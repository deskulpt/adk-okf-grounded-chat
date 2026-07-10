import json
import asyncio
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types
from google.adk import Agent, Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.apps import App

from okf_engine import OKFEngine
import shared

app = FastAPI(title="ADK OKF Agent Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OKF Engine and services
okf_engine = OKFEngine()
session_service = InMemorySessionService()
artifact_service = InMemoryArtifactService()
memory_service = InMemoryMemoryService()

# Root agent setup using ADK 2.x and LiteLLM model provider
agent = Agent(
    name="okf_agent",
    model=shared.DEFAULT_MODEL,
    instruction="You are a helpful grounding assistant. Provide detailed and accurate responses."
)

# Wrap agent in an ADK App
adk_app = App(name="okf_agent_app", root_agent=agent)
runner = Runner(
    app=adk_app,
    artifact_service=artifact_service,
    session_service=session_service,
    memory_service=memory_service,
)

@app.get("/api/health")
def health_check():
    # Reload concepts dynamically so we pick up new markdown files without restarting
    okf_engine.load_concepts()
    return {"status": "ok", "okf_concepts_loaded": len(okf_engine.concepts)}

@app.get("/api/concepts")
def get_concepts():
    # Fetch fresh list of local concepts
    okf_engine.load_concepts()
    # Strip full file path for client privacy before sending
    safe_concepts = []
    for c in okf_engine.concepts:
        safe_concepts.append({
            "id": c["id"],
            "type": c["type"],
            "title": c["title"],
            "tags": c["tags"],
            "description": c["description"],
            "resource": c["resource"],
            "timestamp": c["timestamp"],
            "content": c["content"]
        })
    return {"concepts": safe_concepts}


import tempfile
import os
import re
from markitdown import MarkItDown

markitdown = MarkItDown()

@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if suffix.lower() in ['.pages', '.numbers', '.key']:
            import zipfile
            try:
                with zipfile.ZipFile(tmp_path, 'r') as zip_ref:
                    pdf_files = [f for f in zip_ref.namelist() if f.lower().endswith('preview.pdf')]
                    if pdf_files:
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as pdf_tmp:
                            pdf_tmp.write(zip_ref.read(pdf_files[0]))
                            pdf_path = pdf_tmp.name
                        try:
                            result = markitdown.convert(pdf_path)
                            markdown_text = result.text_content
                        finally:
                            if os.path.exists(pdf_path):
                                os.remove(pdf_path)
                    else:
                        result = markitdown.convert(tmp_path)
                        markdown_text = result.text_content
            except Exception as zip_err:
                print(f"Zip extraction failed for mac file: {zip_err}")
                result = markitdown.convert(tmp_path)
                markdown_text = result.text_content
        else:
            result = markitdown.convert(tmp_path)
            markdown_text = result.text_content
        
        title = os.path.splitext(file.filename)[0]
        clean_title = re.sub(r'[^a-zA-Z0-9]', ' ', title).strip()
        tags = [t.lower() for t in clean_title.split()[:4]] + ["uploaded", "local"]
        
        okf_markdown = f"""---
type: "Local Document"
title: "{title}"
tags: {json.dumps(tags)}
description: "Converted client-side document: {file.filename}"
---
{markdown_text}"""
        
        return {
            "id": f"session/{title.lower().replace(' ', '_')}",
            "type": "Local Document",
            "title": title,
            "tags": tags,
            "description": f"Converted client-side document: {file.filename}",
            "content": okf_markdown
        }
    except Exception as e:
        print(f"Error converting document: {e}")
        return {"error": f"Failed to convert file: {str(e)}"}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/api/convert_url")
async def convert_url(request: Request):
    data = await request.json()
    url = data.get("url")
    if not url:
        return {"error": "No URL provided"}
    try:
        result = markitdown.convert(url)
        markdown_text = result.text_content
        
        title = url.split('/')[-1] or "webpage"
        if not title.endswith('.html'):
            title = title + ".html"
            
        clean_title = re.sub(r'[^a-zA-Z0-9]', ' ', title).strip()
        tags = [t.lower() for t in clean_title.split()[:4]] + ["url", "web"]
        
        okf_markdown = f"""---
type: "Webpage Link"
title: "{url}"
tags: {json.dumps(tags)}
description: "Converted URL webpage: {url}"
---
{markdown_text}"""
        
        return {
            "id": f"session/url_{re.sub(r'[^a-zA-Z0-9]', '_', url.lower())[:50]}",
            "type": "Webpage Link",
            "title": url,
            "tags": tags,
            "description": f"Converted URL webpage: {url}",
            "content": okf_markdown
        }
    except Exception as e:
        print(f"Error converting URL: {e}")
        return {"error": f"Failed to convert URL: {str(e)}"}


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    use_ai = data.get("use_ai", True)
    api_key = data.get("api_key")
    local_concepts = data.get("local_concepts", [])
    if not messages:
        return {"error": "No messages provided"}
    
    # Get the latest user query
    user_query = messages[-1].get("content", "")
    
    # Reload concepts dynamically on incoming request to ensure fresh index
    okf_engine.load_concepts()
    
    # Try local client-uploaded concepts first
    import re
    matched_concept = None
    query_words = set(re.findall(r'[a-zA-Z0-9/_-]+', user_query.lower()))
    for c in local_concepts:
        id_parts = set(re.split(r'[/_-]', c.get('id', '').lower())) | {c.get('id', '').lower()}
        title_words = set(re.findall(r'[a-zA-Z0-9]+', c.get('title', '').lower()))
        tag_words = {t.lower() for t in c.get('tags', [])}
        if id_parts.intersection(query_words) or title_words.intersection(query_words) or tag_words.intersection(query_words):
            matched_concept = c
            break
            
    if not matched_concept:
        matched_concept = okf_engine.match_concept(user_query)

    
    async def sse_generator():
        if matched_concept:
            # Local OKF match found! Stream it.
            print(f"OKF Match Found: {matched_concept['title']}")
            # Yield metadata block
            yield f"data: {json.dumps({'text': '', 'okf_match': True, 'concept': matched_concept['title']})}\n\n"
            
            # Stream the content with simulated chunking
            content = matched_concept["content"]
            chunk_size = 40
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i+chunk_size]
                yield f"data: {json.dumps({'text': chunk, 'okf_match': True, 'concept': matched_concept['title']})}\n\n"
                await asyncio.sleep(0.01)
        elif not use_ai:
            print(f"No OKF Match and use_ai is disabled. Returning notification.")
            yield f"data: {json.dumps({'text': '⚠️ No matching local grounding concept was found, and AI LLM fallback is currently disabled.', 'okf_match': False})}\n\n"
        else:
            # Fallback to ADK agent loop using OpenRouter
            import litellm
            if api_key:
                print("Using custom OpenRouter API Key provided in request payload.")
                litellm.api_key = api_key
            else:
                litellm.api_key = shared.OPENROUTER_KEY
                
            print(f"No OKF Match. Routing to LLM fallback for query: '{user_query}'")
            session = await session_service.create_session(
                app_name="okf_agent_app",
                user_id="user_1"
            )
            content_msg = types.Content(
                role="user",
                parts=[types.Part(text=user_query)]
            )
            
            try:
                async for event in runner.run_async(
                    user_id=session.user_id,
                    session_id=session.id,
                    new_message=content_msg
                ):
                    if event.content and event.content.parts:
                        text_chunks = [p.text for p in event.content.parts if p.text]
                        if text_chunks:
                            joined_text = "".join(text_chunks)
                            yield f"data: {json.dumps({'text': joined_text, 'okf_match': False})}\n\n"
            except Exception as e:
                print(f"Error calling ADK Agent: {e}")
                yield f"data: {json.dumps({'text': f'Error: Failed to fetch response from OpenRouter: {e}', 'okf_match': False})}\n\n"
                
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

import os
from fastapi.staticfiles import StaticFiles

# Mount React built assets
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")


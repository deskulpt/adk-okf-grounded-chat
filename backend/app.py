import json
import asyncio
import os
import re
from fastapi import FastAPI, Request, UploadFile, File, Form
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
        if c.get("type") in ("persona", "instruction"):
            continue
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


@app.delete("/api/concepts/{concept_id}")
def delete_concept(concept_id: str):
    # ponytail: system grounding files are deletable by id (file remove + reload)
    okf_engine.load_concepts()
    target = next((c for c in okf_engine.concepts if c["id"] == concept_id), None)
    if not target:
        return {"error": f"Concept '{concept_id}' not found"}
    try:
        os.remove(target["filepath"])
        okf_engine.load_concepts()
        return {"deleted": concept_id}
    except Exception as e:
        return {"error": f"Failed to delete: {e}"}


@app.put("/api/concepts/{concept_id}")
async def update_concept(concept_id: str, request: Request):
    # ponytail: overwrite the concept's .md file in place, then reload
    body = await request.json()
    markdown = body.get("content")
    if markdown is None:
        return {"error": "content required"}
    okf_engine.load_concepts()
    target = next((c for c in okf_engine.concepts if c["id"] == concept_id), None)
    if not target:
        return {"error": f"Concept '{concept_id}' not found"}
    try:
        with open(target["filepath"], "w", encoding="utf-8") as f:
            f.write(markdown)
        okf_engine.load_concepts()
        return {"updated": concept_id}
    except Exception as e:
        return {"error": f"Failed to save: {e}"}
import tempfile
import re
from markitdown import MarkItDown

markitdown = MarkItDown()

@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...), api_key: str = Form(None)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.gif'] and api_key:
            import base64
            import litellm
            try:
                base64_image = base64.b64encode(content).decode('utf-8')
                mime_type = file.content_type or "image/jpeg"
                model = "gemini/gemini-2.5-flash" if api_key.startswith("AIzaSy") else "openrouter/google/gemini-2.5-flash"
                if api_key.startswith("AIzaSy"):
                    os.environ["GEMINI_API_KEY"] = api_key
                response = litellm.completion(
                    model=model,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe this image in detail. Extract any visible text verbatim. Format as clean markdown suitable for a knowledge catalog."},
                            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
                        ]
                    }],
                    api_key=api_key
                )
                markdown_text = response.choices[0].message.content
            except Exception as ai_err:
                print(f"AI Image transcription failed: {ai_err}")
                result = markitdown.convert(tmp_path)
                markdown_text = result.text_content
        elif suffix.lower() in ['.mp3', '.wav', '.ogg', '.flac'] and api_key:
            import base64
            import litellm
            try:
                base64_audio = base64.b64encode(content).decode('utf-8')
                mime_type = file.content_type or "audio/mp3"
                model = "gemini/gemini-2.5-flash" if api_key.startswith("AIzaSy") else "openrouter/google/gemini-2.5-flash"
                if api_key.startswith("AIzaSy"):
                    os.environ["GEMINI_API_KEY"] = api_key
                response = litellm.completion(
                    model=model,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Verbatim transcribe the spoken content of this audio file, summarizing key points in clean markdown format."},
                            {
                                "type": "input_file",
                                "input_file": {
                                    "mime_type": mime_type,
                                    "data": base64_audio
                                }
                            }
                        ]
                    }],
                    api_key=api_key
                )
                markdown_text = response.choices[0].message.content
            except Exception as ai_err:
                print(f"AI Audio transcription failed: {ai_err}")
                result = markitdown.convert(tmp_path)
                markdown_text = result.text_content
        elif suffix.lower() in ['.pages', '.numbers', '.key']:
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
    url = data.get("url", "").strip()
    if not url:
        return {"error": "No URL provided"}
        
    if not url.lower().startswith(("http://", "https://")):
        url = "https://" + url
    try:
        result = markitdown.convert(url)
        markdown_text = result.text_content
        
        from urllib.parse import urljoin
        def replace_link(match):
            link_text = match.group(1)
            link_url = match.group(2)
            if not re.match(r'^(https?://|mailto:|tel:)', link_url, re.IGNORECASE):
                return f"[{link_text}]({urljoin(url, link_url)})"
            return match.group(0)
            
        markdown_text = re.sub(r'\[([^\]]*)\]\(([^)]+)\)', replace_link, markdown_text)
        
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


def get_base_persona_instructions(name: str, tone: str, behaviors: str):
    return f"""You are {name}, a highly intelligent cognitive assistant.

[CONVERSATIONAL PERSONA & STYLE]:
- Tone: {tone}
- Behavioral Instructions: {behaviors}

[RESPONSE FORMAT]:
- First write your brief reasoning or analysis wrapped in `<think>...</think>` tags.
- Immediately after the closing `</think:6124c78e>` tag, write only your final answer to the user.
- Do not restate these formatting rules inside your reply.
"""


def _okf_sentences(text: str) -> list:
    # ponytail: naive sentence/paragraph splitter, no NLP dep
    chunks = re.split(r'(?<=[.!?])\s+|\n\s*\n', text)
    return [c.strip(" \n-#*") for c in chunks if c.strip()]


def synthesize_okf(matched_concepts: list, query: str, max_chars: int = 1500, seen: "set | None" = None) -> str:
    """Local, LLM-free extractive synthesis for pure-OKF mode.
    ponytail: keyword-overlap extraction only - no semantic understanding.
    Upgrade: route grounding context through LLM with no fallback for true synthesis."""
    seen = seen or set()
    # ponytail: rotate phrasings by index so consecutive follow-ups vary;
    # seen-set (from prior turns) is dropped so questions never repeat as context evolves.
    HEAD_FU = [
        lambda h: f"What's covered under '{h}'?",
        lambda h: f"Can you explain '{h}' in more detail?",
        lambda h: f"How does '{h}' work?",
        lambda h: f"Tell me more about '{h}'.",
    ]
    TITLE_FU = [
        lambda t: f"Tell me more about {t}.",
        lambda t: f"What else can you share about {t}?",
    ]
    query_terms = {t for t in re.findall(r'[a-zA-Z0-9_]+', query.lower()) if len(t) > 3}
    blocks, followups = [], []
    fi = 0
    for c in matched_concepts:
        content = c.get("content", "")
        headings = re.findall(r'^#{1,6}\s+(.+)$', content, re.MULTILINE)
        if headings:
            for h in headings[:3]:
                cand = HEAD_FU[fi % len(HEAD_FU)](h.strip())
                fi += 1
                if cand not in seen:
                    followups.append(cand)
        else:
            cand = TITLE_FU[fi % len(TITLE_FU)](c['title'])
            fi += 1
            if cand not in seen:
                followups.append(cand)
        sentences = _okf_sentences(content)
        relevant = [s for s in sentences if any(t in s.lower() for t in query_terms)] if query_terms else []
        chosen = relevant[:4] if relevant else sentences[:3]
        if chosen:
            blocks.append(f"**{c['title']}** — " + " ".join(chosen))

    text = "\n\n".join(blocks)
    # ponytail: follow-ups count toward the cap so total stays <= max_chars
    fu = "\n\n**Possible follow-up:**\n- " + "\n- ".join(dict.fromkeys(followups)) if followups else ""
    if len(text) + len(fu) > max_chars:
        text = text[:max(0, max_chars - len(fu))].rsplit(" ", 1)[0].rstrip() + "…"
    return text + fu


def _seen_followups(messages: list) -> set:
    """ponytail: pull follow-up questions already shown in prior assistant turns."""
    seen = set()
    for m in messages:
        if m.get("role") != "assistant":
            continue
        # lines after the "Possible follow-up:" marker are the questions
        parts = re.split(r'\*\*Possible follow-up:\*\*', m.get("content", ""), maxsplit=1)
        if len(parts) < 2:
            continue
        for line in parts[1].splitlines():
            q = line.lstrip("-* ").strip()
            if q:
                seen.add(q)
    return seen


# ponytail: offline "essential LLM" — single file-backed common-knowledge responder.
# Used when grounding is off AND no AI keys, so the bot isn't a dead end. Reuses synthesize_okf.
_COMMON_PATH = os.path.join(os.path.dirname(__file__), "..", "okf_knowledge", "datasets", "common_knowledge.md")
_common_concept = None

def _get_common_concept() -> dict:
    global _common_concept
    if _common_concept is None:
        try:
            with open(_COMMON_PATH, encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            content = ""
        _common_concept = {"id": "system/common_knowledge", "title": "Common Knowledge", "content": content, "type": "common"}
    return _common_concept

def _match_common(query: str, concept: dict) -> bool:
    qterms = {t for t in re.findall(r"[a-zA-Z0-9_]+", query.lower()) if len(t) > 2}
    if not qterms:
        return True  # greetings like "hi" carry no terms; let common answer
    # ponytail: any overlap between query terms and the doc => respond; keyword scan, no semantics
    return any(t in concept["content"].lower() for t in qterms)


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    use_ai = data.get("use_ai", True)
    pure_okf = data.get("pure_okf", False)
    use_system_grounding = data.get("use_system_grounding", True)
    api_key = data.get("api_key")
    agent_name = data.get("agent_name", "Antigravity Grounding Core")
    agent_tone = data.get("agent_tone", "Helpful, warm, concise, professional")
    agent_behaviors = data.get("agent_behaviors", "Speak with structured lists. Cite documents clearly. Avoid CoT leakage.")
    local_concepts = data.get("local_concepts", [])
    if not messages:
        return {"error": "No messages provided"}
    
    # Get the latest user query
    user_query = messages[-1].get("content", "")
    
    # Reload concepts dynamically on incoming request to ensure fresh index
    okf_engine.load_concepts()
    
    # Match multiple concepts
    import re
    matched_concepts = []
    query_words = set(re.findall(r'[a-zA-Z0-9/_-]+', user_query.lower()))
    
    # 1. Match local client-uploaded concepts
    for c in local_concepts:
        if c.get("type") in ("persona", "instruction"):
            continue
        id_parts = set(re.split(r'[/_-]', c.get('id', '').lower())) | {c.get('id', '').lower()}
        title_words = set(re.findall(r'[a-zA-Z0-9]+', c.get('title', '').lower()))
        tag_words = {t.lower() for t in c.get('tags', [])}
        if id_parts.intersection(query_words) or title_words.intersection(query_words) or tag_words.intersection(query_words):
            matched_concepts.append(c)
            
    # 2. Match system concepts
    system_matches = okf_engine.match_concepts(user_query) if use_system_grounding else []
    existing_ids = {c['id'] for c in matched_concepts}
    for c in system_matches:
        if c.get("type") in ("persona", "instruction"):
            continue
        if c['id'] not in existing_ids:
            matched_concepts.append(c)
            
    # 3. Aggregate query match: If query asks to summarize/compare all documents, include all uploaded files
    query_lower = user_query.lower()
    if any(w in query_lower for w in ["all files", "uploaded files", "compare", "connections", "summarize everything", "everything uploaded", "all documents"]):
        for c in local_concepts:
            if c.get("type") in ("persona", "instruction"):
                continue
            if c['id'] not in existing_ids:
                matched_concepts.append(c)
                existing_ids.add(c['id'])

    async def sse_generator():
        is_grounded = len(matched_concepts) > 0
        concept_title = ", ".join(c['title'] for c in matched_concepts) if is_grounded else ""
        
        if is_grounded:
            print(f"OKF Grounded Matches: {concept_title}")
            yield f"data: {json.dumps({'text': '', 'okf_match': True, 'concept': concept_title})}\n\n"
            
            if pure_okf:
                synthesized = synthesize_okf(matched_concepts, user_query, seen=_seen_followups(messages))
                chunk_size = 80
                for i in range(0, len(synthesized), chunk_size):
                    chunk = synthesized[i:i+chunk_size]
                    yield f"data: {json.dumps({'text': chunk, 'okf_match': True, 'concept': concept_title})}\n\n"
                    await asyncio.sleep(0.01)
                return
            
        if not use_ai and not is_grounded:
            # ponytail: offline "essential LLM" — answer common queries without AI/grounding
            common = _get_common_concept()
            if _match_common(user_query, common):
                print("Common-knowledge match (no AI, no grounding).")
                synthesized = synthesize_okf([common], user_query, seen=_seen_followups(messages))
                yield f"data: {json.dumps({'text': synthesized, 'okf_match': False, 'concept': 'Common Knowledge'})}\n\n"
                return
            print(f"No OKF Match and use_ai is disabled. Returning notification.")
            yield f"data: {json.dumps({'text': '⚠️ No matching local grounding concept was found, and AI LLM fallback is currently disabled.', 'okf_match': False})}\n\n"
            return

        # ponytail: AI requested but no usable key -> clean message, not a 401 crash.
        # Accept either a Gemini AI Studio key (AIzaSy...) or an OpenRouter key (sk-or-...).
        def _usable_gemini(k):
            return bool(k) and str(k).startswith("AIzaSy")
        def _usable_openrouter(k):
            return bool(k) and str(k).startswith("sk-or-")
        if not (_usable_gemini(api_key) or _usable_openrouter(api_key) or _usable_gemini(shared.GEMINI_KEY) or _usable_openrouter(shared.OPENROUTER_KEY)):
            yield f"data: {json.dumps({'text': '⚠️ AI fallback is on but no API key is set. Add GEMINI_API_KEY to backend/.env or paste an OpenRouter key in Settings.', 'okf_match': is_grounded})}\n\n"
            return

        base_instruction = get_base_persona_instructions(agent_name, agent_tone, agent_behaviors)
        if is_grounded:
            non_persona_matches = [c for c in matched_concepts if c.get("type") not in ("persona", "instruction")]
            if non_persona_matches:
                grounding_context_parts = []
                for c in non_persona_matches:
                    part = f"--- DOCUMENT: {c['title']} (ID: {c['id']}, Type: {c['type']}) ---\n{c['content']}"
                    grounding_context_parts.append(part)
                grounding_context = "\n\n".join(grounding_context_parts)
                
                agent.instruction = f"""{base_instruction}

[REASONING RULES]:
1. Prioritize Grounding: You must prioritize the facts, figures, and relationships defined in the provided [GROUNDING CONTEXT] above all else.
2. Cross-Document Synthesis: If multiple documents are present in the context, you must actively draw connections, find correlations, identify contradictions, and summarize key insights across them. Show how they relate.
3. Citation & Transparency: In your response, clearly mention which documents (by Title or ID) you are citing or pulling information from.
4. Professional & Concise Tone: Be direct, precise, and user-friendly. Avoid repeating raw document dumps unless explicitly asked to do so.
5. Verification & Fallback Boundaries: If the user asks a question that is NOT covered by the context:
   - If AI Fallback is active, answer using general knowledge but clearly state that it is outside the local grounded files.
   - If general knowledge is uncertain, state: "I cannot find this information in the provided grounding context."
6. Reasoning Isolation: Wrap ALL your internal reasoning, cross-document analysis, and planning inside `<think>...</think>` tags. Output only the synthesized answer after the closing tag — your reasoning is displayed separately (collapsed) and never inline with the answer.

[GROUNDING CONTEXT]:
{grounding_context}
"""
            else:
                agent.instruction = base_instruction
        else:
            agent.instruction = base_instruction

        import litellm
        # Route: explicit key > env key; Gemini AI Studio > OpenRouter.
        if _usable_gemini(api_key):
            print("Using user Gemini API Key.")
            agent.model = "gemini/gemini-2.5-flash"
            os.environ["GEMINI_API_KEY"] = api_key
            litellm.api_key = api_key
        elif _usable_openrouter(api_key):
            print("Using user OpenRouter API Key.")
            agent.model = "litellm:openrouter/google/gemini-2.5-flash"
            litellm.api_base = "https://openrouter.ai/api/v1"
            litellm.api_key = api_key
        elif _usable_gemini(shared.GEMINI_KEY):
            print("Using env GEMINI_API_KEY.")
            agent.model = "gemini/gemini-2.5-flash"
            litellm.api_key = shared.GEMINI_KEY
        elif _usable_openrouter(shared.OPENROUTER_KEY):
            print("Using env OPENROUTER_API_KEY.")
            agent.model = "litellm:openrouter/google/gemini-2.5-flash"
            litellm.api_base = "https://openrouter.ai/api/v1"
            litellm.api_key = shared.OPENROUTER_KEY
        else:
            # Should be unreachable because of the guard above, but keep safe.
            yield f"data: {json.dumps({'text': '⚠️ AI fallback is on but no API key is set.', 'okf_match': is_grounded})}\n\n"
            return
            
        print(f"Routing to LLM for query: '{user_query}' using model '{agent.model}' (Grounded: {is_grounded})")
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
                        yield f"data: {json.dumps({'text': joined_text, 'okf_match': is_grounded, 'concept': concept_title if is_grounded else None})}\n\n"
        except Exception as e:
            print(f"Error calling ADK Agent: {e}")
            yield f"data: {json.dumps({'text': f'Error: Failed to fetch response: {e}', 'okf_match': is_grounded})}\n\n"
                
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

from fastapi.staticfiles import StaticFiles

# Mount React built assets
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")


# Architecture Research

**Domain:** standalone-agent-ui
**Researched:** 2026-07-09
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
                    Vite React Chat UI                         
├─────────────────────────────────────────────────────────────┤
   ┌───────────────┐        ┌──────────────────┐               
   │  AgentChat    │ <----> │  Message History │               
   └───────────────┘        └──────────────────┘               
           │ (Streaming API / SSE)                             
┌──────────▼──────────────────────────────────────────────────┐
                     FastAPI Backend                          
├─────────────────────────────────────────────────────────────┤
   ┌─────────────────────────────────────────────────────┐    
   │                   ADK Agent Loop                    │    
   │  ┌───────────────┐     ┌─────────────────────────┐  │    
   │  │ LiteLLM Router│     │ OKF Retrievable Skill   │  │    
   │  └───────────────┘     └─────────────────────────┘  │    
   └─────────────────────────────────────────────────────┘    
├─────────────────────────────────────────────────────────────┤
                    Local Disk (Git Repo)                      
   ┌───────────────────────┐                                   
   │  okf_knowledge/*.md  │                                   
   └───────────────────────┘                                   
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Frontend Chat UI | Renders messages, streams responses, manages active chat session state. | Vite + React + Tailwind + agent-elements shadcn |
| FastAPI Server | API endpoint hosting, handles streaming HTTP responses. | FastAPI using Server-Sent Events (SSE). |
| ADK Agent Loop | Manages agent logic and execution workflows. | google-adk `Agent` and workflow patterns. |
| OKF Skill / Engine | Scans, indexes, matches and retrieves local OKF markdown concept files. | Python parser using `pyyaml` and regex matching. |
| LiteLLM Routing | Resolves OpenRouter queries via LLM wrapper. | LiteLLM client routing queries to `openrouter/free` or specified models. |

## Recommended Project Structure

```
.
├── okf_knowledge/           # OKF Ground-truth Markdown files
│   ├── concept_a.md
│   └── concept_b.md
├── backend/                 # FastAPI + ADK Python Backend
│   ├── app.py               # Backend main server entrypoint
│   ├── shared.py            # LiteLLM OpenRouter helper utility
│   ├── okf_engine.py        # OKF document indexing and matching logic
│   └── requirements.txt     # Python backend dependencies
└── frontend/                # Vite React Frontend App
    ├── src/
    │   ├── components/      # UI components (AgentChat, etc.)
    │   ├── App.tsx          # Frontend main logic
    │   └── main.tsx
    ├── package.json         # NPM dependencies
    └── vite.config.ts       # Vite config
```

### Structure Rationale

- **okf_knowledge/:** Kept at root so it is easily accessible by backend parser and can be tracked directly by Git as the knowledge base.
- **backend/:** Grouped all Python logic (FastAPI, ADK, LiteLLM) together with its own dependency tracker.
- **frontend/:** Standalone React directory separating UI build assets from python logic.

## Architectural Patterns

### Pattern 1: OKF-First Retrieval Routing

**What:** Before delegating the query to the OpenRouter LLM, the OKF engine checks if any local markdown file matches key terms in the query. If a match is found, the concept contents are injected directly as system context or returned as a deterministic response, bypassing the generic model knowledge.

**When to use:** On all user queries to ensure local repo truth takes priority.

**Example:**
```python
def retrieve_okf_context(query: str, index: list[dict]) -> str | None:
    # Match query terms against concept title / tags in indexed frontmatter
    for concept in index:
        if concept['title'].lower() in query.lower() or any(tag in query.lower() for tag in concept.get('tags', [])):
            return concept['content']
    return None
```

### Pattern 2: Server-Sent Events (SSE) Streaming

**What:** Frontend listens to a text/event-stream HTTP endpoint on FastAPI. As ADK processes the LLM output, chunks are written to the stream and immediately displayed by the React chat UI.

## Data Flow

### Request Flow

```
[User inputs message]
    ↓
[Vite Frontend] ──POST /api/chat──> [FastAPI Server]
                                           ↓
                                   [OKF Matcher] (Checks okf_knowledge/)
                                     /       \
                        (Match found)         (No match)
                            /                   \
            [Inject OKF Concept]             [ADK Loop via LiteLLM]
                            \                   /
                             └──> [Stream Response]
```

### Key Data Flows

1. **Query Processing Flow:** Detailed in the diagram above.
2. **Concept Ingestion Flow:** On server startup, the `okf_engine.py` reads `okf_knowledge/` directory, parses frontmatter and markdown body, and constructs an in-memory index list.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single server with in-memory index is highly sufficient. |

## Anti-Patterns

### Anti-Pattern 1: Large Vector DB for small local OKF

**What people do:** Setting up Pinecone or Chroma DB for indexing 10-20 markdown files.
**Why it's wrong:** Adds massive configuration overhead and complexity for minimal gain.
**Do this instead:** Parse directly to an in-memory dictionary. It's extremely fast for hundreds of files.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenRouter | HTTP POST requests via LiteLLM. | Requires valid `OPENROUTER_API_KEY` and `@preset/open-free` model string. |

---
*Architecture research for: standalone-agent-ui*
*Researched: 2026-07-09*

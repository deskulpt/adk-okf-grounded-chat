# Stack Research

**Domain:** standalone-agent-ui
**Researched:** 2026-07-09
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x | Frontend UI Library | Required for `agent-elements` shadcn components. |
| Vite | 6.x | Build Tooling | Cleanest, fastest boilerplate for standalone React UI. |
| Tailwind CSS | 4.x | Utility-first CSS | Required by shadcn and `agent-elements`. |
| Python | 3.10+ | Backend Runtime | Required for google-adk execution and OKF parsing. |
| FastAPI | 0.111+ | Backend Web API | Lightweight, async-first web server to serve chat APIs. |
| google-adk | 2.0.x | Agent Framework | Orchestrates LLM loops, memory, and OKF tooling. |
| LiteLLM | 1.40+ | LLM Abstraction | Translates ADK calls to OpenRouter endpoints seamlessly. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | 0.400+ | UI Icons | Used for chat UI icons (send, bot, user, copy). |
| PyYAML | 6.0+ | YAML Parsing | Parsing YAML frontmatter from OKF markdown files. |
| httpx | 0.27+ | Async HTTP Client | Performing OpenRouter API calls via LiteLLM/FastAPI. |
| shadcn/ui | 1.x | Radix primitives | Base shadcn components required by agent-elements. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pip | Dependency management | Handles python backend packages. |
| npm | Dependency management | Handles React frontend packages. |

## Installation

```bash
# Frontend setup
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss @tailwindcss/vite lucide-react
npm install shadcn@latest add https://agent-elements.21st.dev/r/agent-chat.json

# Backend setup
pip install google-adk litellm fastapi uvicorn pyyaml
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite React | Next.js | Better if multi-page routing or SSR is required. |
| FastAPI | Flask | Better if legacy synchronous patterns are preferred. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Streamlit | Difficult to style with shadcn components. | React + FastAPI |
| LangChain | Adds unnecessary overhead; ADK 2.0 is sufficient. | google-adk |

## Stack Patterns by Variant

**If Standalone Deployment:**
- Use FastAPI + Vite React on separate ports (e.g. 8000 and 5173).
- Because it allows independent frontend/backend development and is standard for single-developer environments.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| google-adk@2.0.x | python@3.10+ | Required for new graph-based runtime. |
| litellm@1.40+ | openrouter@v1 | Supports openrouter base url routing. |

## Sources

- [google/adk-python Docs](https://google.github.io/adk-docs/) — verified 2.0 API structure
- [OpenRouter Docs](https://openrouter.ai/docs) — verified routing syntax and open-free preset details
- [21st.dev Registry](https://21st.dev/) — verified agent-elements installation commands

---
*Stack research for: standalone-agent-ui*
*Researched: 2026-07-09*

<!-- GSD:project-start source:PROJECT.md -->

## Project

**ADK OKF Agent UI**

A standalone web UI for an AI Agent powered by the Google Agent Development Kit (ADK) and Git-based Open Knowledge Format (OKF). It provides a responsive chat interface for streaming text responses, markdown rendering, and message history tracking.

**Core Value:** To provide a clean, responsive, and deterministic agent execution interface that prioritizes local git-backed ground-truth concepts (OKF) with standard LLM fallbacks.

### Constraints

- **Tech Stack**: React-based frontend (Vite/Next.js), Python FastAPI backend (running google-adk).
- **API Key**: Must use OpenRouter API key `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` with `@preset/open-free` routing.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

# Frontend setup

# Backend setup

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

# Project Research Summary

**Project:** ADK OKF Agent UI
**Domain:** standalone-agent-ui
**Researched:** 2026-07-09
**Confidence:** HIGH

## Executive Summary

This research outlines the technical blueprints for a standalone web UI integrated with Google Agent Development Kit (ADK) 2.0 and the Open Knowledge Format (OKF). By combining a modern Vite + React frontend using `agent-elements` shadcn components and a FastAPI python backend, the application can deliver a lightweight, high-performance chat interface.

The core technical challenge involves creating a deterministic matching engine that queries local OKF Git-backed markdown documents before routing generic queries to OpenRouter's free model preset via LiteLLM. This approach establishes a reliable local ground-truth context layer while keeping API costs at zero.

Key risks include OpenRouter rate limits on free endpoints and frontmatter parser fragility. Both are mitigated through backend retry middleware and robust try-except error catching during startup scanning.

## Key Findings

### Recommended Stack

A decoupled React and Python FastAPI setup represents the cleanest architecture for combining shadcn React components with the Python-based Google ADK.

**Core technologies:**
- React 19 / Vite 6: Renders streaming responses and host shadcn components.
- FastAPI: Serves async HTTP endpoints and SSE streams.
- google-adk 2.0: Runs the orchestration loops and manages agent memory.
- LiteLLM: Connects the ADK to OpenRouter's api.

### Expected Features

**Must have (table stakes):**
- Streaming text UI: Immediate chunk rendering.
- OpenRouter API key config: Zero-cost model routing using `@preset/open-free` preset.
- OKF Indexer: Scans `/docs` for markdown files with YAML frontmatter.

**Should have (competitive):**
- Ground-truth prioritization: Strict matching before model fallbacks.
- Shimmer loading state: Displays thinking status.

**Defer (v2+):**
- Interactive OKF editing and Git committing from the web UI.

### Architecture Approach

A decoupled client-server architecture running locally.

**Major components:**
1. React Chat Shell: User interaction layer.
2. FastAPI Controller: Routes commands and feeds SSE chunks.
3. OKF Ingestion Engine: Indexer for local concept files.
4. ADK Agent Loop: Orchestrates LiteLLM tool and model calls.

### Critical Pitfalls

1. **OpenRouter 429 Rate Limits** — Mitigated by LiteLLM native exponential retry logic.
2. **Broken YAML parsing** — Mitigated by try-except blocks in the local indexer.

## Implications for Roadmap

### Phase 1: Backend Core & OKF Engine
**Rationale:** Establishing the data loading and API routing layer first provides a functional API that the frontend can build against.
**Delivers:** FastAPI server, LiteLLM/OpenRouter connection, local OKF indexer and matcher.
**Addresses:** OKF Indexing, OpenRouter Routing.
**Avoids:** Frontmatter parsing crashes, OpenRouter rate limits.

### Phase 2: Frontend Chat & Integration
**Rationale:** Builds the UI on top of the validated Phase 1 API, allowing rapid iteration on the visual layouts.
**Delivers:** Vite React app integrated with `agent-elements.21st.dev`, SSE stream rendering, chat history.
**Uses:** React 19, agent-elements components.
**Implements:** Client-side message history and streaming receiver.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vite React and FastAPI is a highly standard stack. |
| Features | HIGH | Table stakes features map directly to client requirements. |
| Architecture | HIGH | Simple local client-server pattern matches ADK guidelines. |
| Pitfalls | HIGH | Rate limits and parsing issues are well-documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **OpenRouter Free Model Performance:** Free models have high latency and low limits. We must ensure retry mechanisms are robust.

## Sources

### Primary (HIGH confidence)
- [google/adk-python Git Repository](https://github.com/google/adk-python) — checked latest package structure
- [OpenRouter Preset Info](https://openrouter.ai/docs) — verified free routing

---
*Research completed: 2026-07-09*
*Ready for roadmap: yes*

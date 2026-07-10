# Phase 1: Backend Core & OKF Engine - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Builds the FastAPI backend server, local OKF markdown parser and indexer, matching engine prioritizing local concepts, and LiteLLM OpenRouter free model routing.

</domain>

<decisions>
## Implementation Decisions

### API Endpoint Contract & Streaming Format
- API Endpoint Path: `/api/chat` (standard prefix)
- Streaming Protocol: SSE (Server-Sent Events)
- SSE Payload Format: Structured JSON e.g., `{"text": "..."}` to support metadata

### OKF Ingestion & Matching
- OKF Directory Path: `okf_knowledge/` at repository root
- Parser Error Handling: Skip invalid/missing frontmatter files and log warning
- Matching Strategy: Deterministic title and tag term matching

### the agent's Discretion
- Backend structure helper utilities (e.g. `shared.py` structure) and specific ADK graph setup.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Greenfield)

### Established Patterns
- None (Greenfield)

### Integration Points
- None (Greenfield)

</code_context>

<specifics>
## Specific Ideas

- Setup `okf_knowledge/` directory with a couple of starter markdown files containing YAML frontmatter.
- Implement LiteLLM wrapper in a helper file `backend/shared.py` containing OpenRouter credentials routing fallback.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

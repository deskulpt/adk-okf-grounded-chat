# Requirements: ADK OKF Agent UI

**Defined:** 2026-07-09
**Core Value:** To provide a clean, responsive, and deterministic agent execution interface that prioritizes local git-backed ground-truth concepts (OKF) with standard LLM fallbacks.

## v1 Requirements

### Frontend UI

- [ ] **UI-01**: Standalone web UI with clean modern layout using `agent-elements.21st.dev` shadcn React components.
- [ ] **UI-02**: Message list displaying both user and bot messages with markdown formatting.
- [ ] **UI-03**: Streaming text responses rendering incrementally chunk by chunk.
- [ ] **UI-04**: Session message history showing previous conversations in active session.
- [ ] **UI-05**: Visual thinking indicator showing model processing state before streaming starts.

### Backend Framework & Integration

- [ ] **BACK-01**: FastAPI server hosting chat endpoint with Server-Sent Events (SSE) streaming support.
- [ ] **BACK-02**: Backend ADK 2.0 orchestration loop managing agent execution cycles.
- [ ] **BACK-03**: LiteLLM configuration translating backend model calls to OpenRouter.
- [ ] **BACK-04**: Configuration utilizing OpenRouter API key and `@preset/open-free` model preset.

### OKF Engine

- [ ] **OKF-01**: Parser scanning a local `okf_knowledge/` folder for markdown files with YAML frontmatter.
- [ ] **OKF-02**: Matching engine identifying queries with terms corresponding to local OKF concept titles or tags.
- [ ] **OKF-03**: Grounding logic prioritizing OKF matched concepts for deterministic replies, falling back to OpenRouter.

## v2 Requirements

### User & Knowledge Management

- **MGMT-01**: Ability to add/edit OKF markdown files directly through the web UI interface.
- **MGMT-02**: Multi-user session persistence backed by a database.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-tenant login authentication | Excluded to keep local dev tool lightweight and simple. |
| Production cloud hosting | Standalone local execution is sufficient for MVP. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |
| BACK-01 | Phase 1 | Pending |
| BACK-02 | Phase 1 | Pending |
| BACK-03 | Phase 1 | Pending |
| BACK-04 | Phase 1 | Pending |
| OKF-01 | Phase 1 | Pending |
| OKF-02 | Phase 1 | Pending |
| OKF-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-09*
*Last updated: 2026-07-09 after initial definition*


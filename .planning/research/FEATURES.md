# Feature Research

**Domain:** standalone-agent-ui
**Researched:** 2026-07-09
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Streaming Responses | Chat interfaces must display responses incrementally. | MEDIUM | Standard Server-Sent Events (SSE) or WebSockets. |
| Markdown Rendering | Formatting, tables, and code blocks must render correctly. | LOW | React Markdown or equivalent in frontend. |
| Chat History | Persistence of previous messages in active session. | LOW | In-memory/local storage frontend state. |
| OpenRouter Model Routing | Connecting to free models using LiteLLM/ADK. | MEDIUM | Integration in LiteLLM config layer. |
| OKF Directory Indexing | Ingesting YAML frontmatter from local markdown files. | MEDIUM | Backend files scanner. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| OKF Context Prioritization | Prefers local repo ground-truth matches over LLM knowledge. | HIGH | Semantic/regex matcher running before model call. |
| agent-elements Components | High-quality, specialized components (thinking shimmers, etc.). | MEDIUM | Installed from `21st.dev` registry. |
| Hot OKF Reload | Automatically updates index when local OKF markdown files change. | MEDIUM | Watchdog or FastAPI polling. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-tenant Auth | Keep user accounts separate. | Adds complex database/auth schema when we just need local dev. | Single-user local API key binding. |
| Online OKF Editor | Editing concept files in UI. | Leads to synchronization conflicts with Git. | Let user edit files in VS Code / IDE. |

## Feature Dependencies

```
[OKF Context Prioritization] ──requires──> [OKF Directory Indexing]
[Streaming Responses] ──requires──> [OpenRouter Model Routing]
[agent-elements Components] ──enhances──> [Streaming Responses]
```

### Dependency Notes

- **OKF Context Prioritization requires OKF Directory Indexing:** We cannot prioritize matched concepts if we haven't first scanned and loaded them into memory.
- **Streaming Responses requires OpenRouter Model Routing:** The OpenRouter endpoint must support stream response format, routed via LiteLLM.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Standalone Chat UI — modern clean interface rendering streaming text
- [ ] ADK Backend Loop — handles message execution cycles
- [ ] LiteLLM OpenRouter Client — routes queries with API key using `@preset/open-free`
- [ ] OKF Indexer — scans a local `/docs` folder for markdown files with YAML frontmatter
- [ ] OKF Matching Engine — matches query against concept metadata before model fallback

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Hot reloading of OKF files
- [ ] Visual indicator showing if OKF concept was matched vs. general LLM fallback

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Interactive OKF concept editing with Git commit automation.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Chat Interface | HIGH | MEDIUM | P1 |
| ADK Orchestration | HIGH | MEDIUM | P1 |
| OpenRouter Routing | HIGH | LOW | P1 |
| OKF Matching | HIGH | HIGH | P1 |
| OKF Hot Reload | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Local Grounding | RAG DB | Vector Index | Plain Git Markdown files (OKF) parsed directly for deterministic match. |

## Sources

- [OKF Specification](https://google.github.io/adk-docs/okf) — details about YAML frontmatter format
- [agent-elements.21st.dev Component Catalog](https://agent-elements.21st.dev/) — available components and APIs

---
*Feature research for: standalone-agent-ui*
*Researched: 2026-07-09*

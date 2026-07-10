# Pitfalls Research

**Domain:** standalone-agent-ui
**Researched:** 2026-07-09
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: OpenRouter Rate Limits on Free Models

**What goes wrong:**
Calling the OpenRouter API with a free model fails with HTTP 429 (Too Many Requests) when streaming multiple queries quickly.

**Why it happens:**
OpenRouter imposes strict rate limits on free models to prevent abuse.

**How to avoid:**
Implement retry logic with exponential backoff in `shared.py` (supported natively by LiteLLM `num_retries` configuration).

**Warning signs:**
API responses contain "Too Many Requests" or return status code 429.

**Phase to address:**
Phase 1 (Backend Core)

---

### Pitfall 2: OKF Frontmatter Parse Failure

**What goes wrong:**
The indexing engine crashes on server startup because a markdown file has invalid YAML syntax in its frontmatter.

**Why it happens:**
YAML is syntax-sensitive (especially with colons and indentation), and manual editing can easily introduce typos.

**How to avoid:**
Wrap frontmatter parsing in try-except blocks. If a file fails to parse, log a warning and skip it rather than crashing the entire engine.

**Warning signs:**
FastAPI server fails to start or outputs critical traceback on startup.

**Phase to address:**
Phase 1 (OKF Engine)

---

### Pitfall 3: Stream Interruption in SSE

**What goes wrong:**
The streaming UI cuts off mid-sentence, leaving the chat UI stuck in a loading state.

**Why it happens:**
FastAPI connections can time out or drop chunk packages due to browser buffering settings or network latency.

**How to avoid:**
Ensure that stream chunk yields are followed by explicit flushes and terminate with a distinct `[DONE]` message payload that the React frontend listens for.

**Warning signs:**
Users report incomplete bot responses and permanent spinner states.

**Phase to address:**
Phase 2 (UI Integration)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| In-memory OKF Index | Faster implementation, no DB setup. | Slow startup if file count grows to thousands. | Acceptable for MVP (highly suitable for typical OKF use cases). |
| Hardcoded API Key | Skip config environment parsing. | Security vulnerability if pushed to public git. | Never. Always load from `os.environ` or `.env` file. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenRouter | Specifying standard provider models (like `gpt-4o`) directly without routing prefix. | Always use `openrouter/` prefix or specific routing alias supported by LiteLLM (e.g. `openrouter/google/gemini-2.5-flash`). |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-scanning files on every query | Slow API response times. | Build index once on startup and cache in memory. | Above 100 files. |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing OpenRouter API Key in frontend bundle | Key theft and abuse of credits. | Keep key purely in backend python environment; never pass it to React code. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No markdown tables rendering | Unreadable, raw text outputs for tables. | Ensure the markdown component explicitly supports standard GFM (GitHub Flavored Markdown). |

## "Looks Done But Isn't" Checklist

- [ ] **Streaming endpoint:** Often misses error boundary — verify response codes on backend crash.
- [ ] **OKF Indexer:** Often misses files without frontmatter — verify parser handles files gracefully.

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| OpenRouter rate limits | Phase 1 | Run stress tests calling the API continuously and verify retry handling works. |
| Frontmatter parse crashes | Phase 1 | Create a file with broken YAML syntax and confirm server starts successfully. |

---
*Pitfalls research for: standalone-agent-ui*
*Researched: 2026-07-09*

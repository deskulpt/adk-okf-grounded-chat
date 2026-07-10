# ADK OKF Agent UI

## What This Is

A standalone web UI for an AI Agent powered by the Google Agent Development Kit (ADK) and Git-based Open Knowledge Format (OKF). It provides a responsive chat interface for streaming text responses, markdown rendering, and message history tracking.

## Core Value

To provide a clean, responsive, and deterministic agent execution interface that prioritizes local git-backed ground-truth concepts (OKF) with standard LLM fallbacks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Implement standalone React web UI using components from `agent-elements.21st.dev`
- [ ] Establish backend agent orchestrator using Google ADK 2.0
- [ ] Configure LiteLLM integration for OpenRouter routing (`@preset/open-free` preset)
- [ ] Implement OKF Retrievable Skill/Engine to parse and index local YAML frontmatter markdown documents
- [ ] Implement context preference prioritizing OKF matched concepts before secondary LLM model retrieval

### Out of Scope

- Multi-user authentication — This is a standalone local-first application.
- Editing OKF documents within the UI — The UI is read-only for concepts, concepts are managed via git/files directly.

## Context

- The backend is built with Python using Google ADK 2.0 for workflow orchestration.
- The frontend utilizes React with `agent-elements.21st.dev` components.
- The intellectual layer leverages the Open Knowledge Format (OKF) specification for structured repository context.

## Constraints

- **Tech Stack**: React-based frontend (Vite/Next.js), Python FastAPI backend (running google-adk).
- **API Key**: Must use OpenRouter API key `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` with `@preset/open-free` routing.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + FastAPI | Allows using `agent-elements` shadcn components on frontend while running Python `google-adk` on backend. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-09 after initialization*

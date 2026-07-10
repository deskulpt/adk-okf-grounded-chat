# Roadmap: ADK OKF Agent UI

## Overview

This roadmap defines the path to building the ADK OKF Agent UI, a standalone chat interface utilizing Google ADK 2.0 and local Open Knowledge Format (OKF) grounding, with LiteLLM OpenRouter free preset fallback.

## Phases

- [x] **Phase 1: Backend Core & OKF Engine** - Setup FastAPI, ADK 2.0, LiteLLM routing, and OKF indexer/matching logic. (completed 2026-07-10)
- [x] **Phase 2: Frontend React Chat UI** - Build the standalone React app with agent-elements components. (completed 2026-07-10)
- [ ] **Phase 3: Integration & Local Verification** - Connect frontend and backend, bundle sample OKF concepts, and launch local testing.

## Phase Details

### Phase 1: Backend Core & OKF Engine

**Goal**: Build FastAPI backend, google-adk loops, LiteLLM OpenRouter mapping, and local OKF parsing/matching.
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, OKF-01, OKF-02, OKF-03
**Success Criteria** (what must be TRUE):

  1. FastAPI runs and exposes standard chat endpoints.
  2. OKF parser ingests files from `okf_knowledge/` folder without crashes.
  3. Grounding prioritizing OKF matched concepts succeeds before OpenRouter fallback.

**Plans**: 2/2 plans complete

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-01: Establish FastAPI backend, google-adk, and LiteLLM OpenRouter connection wrapper.
- [x] 01-02: Implement local OKF parser, keyword matching indexer, and context injection middleware.

### Phase 2: Frontend React Chat UI

**Goal**: Implement modern standalone React chat UI using shadcn / agent-elements components.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):

  1. Frontend displays a responsive chat shell with thinking indicators and message lists.
  2. Message responses render markdown and stream text incrementally.

**Plans**: 2/2 plans complete

Plans:

- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md

- [x] 02-01: Scaffold Vite React app, setup Tailwind CSS v4, Radix, and install agent-elements components.
- [x] 02-02: Wire chat input, streaming event source (SSE) consumer, and message history state management.

### Phase 3: Integration & Local Verification

**Goal**: Complete end-to-end integration and run validation checks with sample OKF data bundles.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: None
**Success Criteria** (what must be TRUE):

  1. User can type query, see active thinking shimmer, and receive matching local OKF content or model fallback.
  2. Application launches with a single terminal command.

**Plans**: 1 plan

Plans:

- [ ] 03-01: Set up sample OKF markdown files, configure startup scripts, and run manual walkthrough validations.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Core & OKF Engine | 2/2 | Complete   | 2026-07-10 |
| 2. Frontend React Chat UI | 2/2 | Complete   | 2026-07-10 |
| 3. Integration & Local Verification | 0/1 | Not started | - |

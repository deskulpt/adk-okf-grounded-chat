# Phase 2: Frontend React Chat UI - Context

**Phase:** 02
**Date:** 2026-07-09
**Status:** Completed

## Design Decisions

### 1. Framework & Styling
We will use Vite to scaffold the React single-page application.
- Styling: Tailwind CSS v4 (as required by shadcn and `agent-elements`).
- Icons: `lucide-react` for standard UI icons (Send, User, Bot, Sparkles, Check, Copy).

### 2. UI Components & Elements
We will import UI components from shadcn and `agent-elements.21st.dev` to present a premium, modern design:
- Sleek chat interface container with a scrollable message log.
- Thinking shimmer/pulse indicator to show active agent execution during LLM calls.
- Markdown rendering for assistant messages (enabling syntax highlighting and clean lists).
- An OKF badge/banner displaying when a response is loaded from local ground-truth concepts (grounding metadata).

### 3. API Communication (SSE POST Streaming)
Since our `/api/chat` endpoint is a POST request (carrying message history), standard browser `EventSource` is insufficient.
We will implement a streaming fetch consumer using `fetch` and standard `ReadableStream` reader:
```javascript
const response = await fetch("http://localhost:8000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
// Read chunks loop...
```
This is robust, supports POST payloads, and handles SSE streaming chunks natively in modern browsers.

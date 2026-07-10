# Phase 2: Frontend React Chat UI - Research

**Phase:** 02
**Date:** 2026-07-09
**Status:** Completed

## Technical Context

This phase covers building the standalone React-based chat client.

### 1. Scaffolding Vite React App
We will initialize the Vite React app in the repository root or a dedicated `frontend` subdirectory. The stack decisions recommend:
`FastAPI + Vite React on separate ports (e.g. 8000 and 5173).`
Scaffolding command:
```bash
npm create vite@latest frontend -- --template react-ts
```
This scaffolds a React + TypeScript template inside the `frontend` folder.

### 2. Tailwind CSS v4 & Shadcn setup
Tailwind CSS v4 introduces a streamlined configuration using `@theme` and `@import "tailwindcss"` in the main CSS file without requiring a separate `tailwind.config.js`.
In Vite React, we install dependencies:
```bash
npm install tailwindcss @tailwindcss/vite
```
Then configure the Vite plugin `tailwindcss()` in `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
And import tailwind in `src/index.css`:
```css
@import "tailwindcss";
```

### 3. Agent Elements & UI Components
`agent-elements` (from 21st.dev) provides a clean set of Tailwind-based chat components:
- `MessageList`: displays list of messages.
- `ChatInput`: input box with attachments and action buttons.
- `ChatBubble`: chat bubbles for user and assistant messages with customizable icons.
We can implement clean custom React components following their design language if we want maximum portability, or install them from npm if published. In either case, we will build a wowed-at-first-glance premium UI using modern typography, glassmorphism headers, dark mode theme by default, and smooth transitions.

### 4. SSE Stream Parser in React
For POST request streaming, we read the stream chunk-by-chunk:
```typescript
const response = await fetch("http://localhost:8000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages })
});

if (!response.body) return;
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  
  const lines = buffer.split("\n");
  buffer = lines.pop() || ""; // keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const payload = JSON.parse(line.slice(6));
        // Update state with payload.text, check payload.okf_match and payload.concept
      } catch (e) {
        console.error("Failed to parse SSE JSON:", e);
      }
    }
  }
}
```

## Summary of Findings

- Use Vite TypeScript template.
- Install tailwindcss v4 using `@tailwindcss/vite` plugin.
- Handle SSE POST streaming with standard browser `fetch` and `ReadableStream`.

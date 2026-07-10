# Phase 3: Integration & Local Verification - Context

**Phase:** 03
**Date:** 2026-07-10
**Status:** Completed

## Design Decisions

### 1. Unified Startup Script
To satisfy the success criteria *"Application launches with a single terminal command,"* we will create a shell script `start.sh` at the repository root.
- It will verify the python virtual environment exists.
- It will launch the FastAPI backend (`uvicorn app:app --port 8000`) in the background.
- It will launch the Vite React dev server (`npm run dev`) in the background.
- It will handle cleanup on interrupt (trap SIGINT to kill background processes cleanly).

### 2. End-to-End Browser Verification
We will use the Chrome browser agent to visit `http://localhost:5173` (where Vite is running), send sample messages, and verify:
1. The welcome message is present.
2. Typing a query matching OKF (e.g. "adk") streams the local document and displays the grounded badge.
3. Typing an unmatched query streams the model fallback response correctly.

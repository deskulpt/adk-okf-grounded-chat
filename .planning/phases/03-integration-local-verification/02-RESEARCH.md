# Phase 3: Integration & Local Verification - Research

**Phase:** 03
**Date:** 2026-07-10
**Status:** Completed

## Technical Context

This phase coordinates unified startup and browser E2E verification.

### 1. Robust Parallel Startup Script in Bash
On macOS, we can start background tasks in bash and track their PIDs.
Using `trap` allows clean termination on CTRL+C (SIGINT):
```bash
#!/bin/bash

# Cleanup handler on SIGINT
cleanup() {
    echo "Stopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT

# Start backend
cd backend
.venv/bin/uvicorn app:app --port 8000 &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
```

### 2. Browser Automation E2E verification
We can verify the application E2E by visiting `http://localhost:5173`.
The expected browser state:
- Page loads showing the header "ADK OKF Agent".
- Type "adk" in the chat input, press Enter, verify that the text streams back and a badge containing "OKF Grounded: Agent Development Kit" appears.
- Type a general query (e.g. "What is 2+2?"), press Enter, verify that the text streams back.

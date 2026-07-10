#!/bin/bash

# Terminate background processes cleanly on exit
cleanup() {
    echo ""
    echo "Stopping Agent Backend and Frontend servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "Starting ADK OKF Agent UI..."

# Build React static files first to ensure they are available for FastAPI mounting
echo "Building React frontend assets..."
cd frontend
npm run build
cd ..

# Start FastAPI backend
echo "Starting Backend Server on port 8040 (serving React app at http://localhost:8040/)..."
cd backend
.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8040 --reload &
BACKEND_PID=$!
cd ..

# Start Vite React frontend for hot reloading developer server
echo "Starting Vite Dev Server on http://localhost:5173/..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Keep script running and wait for background processes
wait

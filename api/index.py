"""Vercel serverless adapter for the FastAPI backend."""
import os
import sys

# Ensure repo root is importable and okf_knowledge resolves correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# The okf_engine resolves okf_knowledge relative to backend/okf_engine.py,
# so the existing path works as long as the whole repo is deployed.
from backend.app import app  # noqa: E402

# Vercel expects a handler named `handler` or `app`
handler = app

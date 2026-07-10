# Phase 1: Backend Core & OKF Engine - Research

**Phase:** 01
**Date:** 2026-07-09
**Status:** Completed

## Technical Context

This phase sets up the core backend routing and data processing layers.

### 1. Google ADK 2.0 Orchestration
The Google Agent Development Kit (ADK) 2.0 introduces a graph-based workflow execution runtime.
A standard agent setup in ADK 2.0 is defined as:
```python
from google.adk import Agent

agent = Agent(
    name="adk_okf_agent",
    model="openrouter/google/gemini-2.5-flash", # via LiteLLM
    instruction="You are a helpful grounding agent."
)
```
Wait, we should configure LiteLLM to route the model calls to OpenRouter.

### 2. LiteLLM and OpenRouter Integration
LiteLLM allows routing queries to arbitrary model providers by overriding the base URL and API keys.
Configuration is done either via environment variables or programmatically in Python:
```python
import litellm

litellm.api_key = os.environ.get("OPENROUTER_API_KEY")
litellm.api_base = "https://openrouter.ai/api/v1"
```
When calling models, LiteLLM accepts provider prefixes like `openrouter/google/gemini-2.5-flash` or similar. Since the user requests the use of OpenRouter `@preset/open-free` preset routing (which maps to `openrouter/free` model router), the model parameter should be set to `"openrouter/free"`.

### 3. OKF Indexing & Parsing in Python
OKF specifies markdown files with YAML frontmatter. Only the `type` field is mandatory:
```yaml
---
type: concept
title: "My Concept"
tags: ["example", "demo"]
---
# Content of the concept
```
We can parse this in Python using `PyYAML` or simple regex/split on the triple-dashes `---`.
Example parsing function:
```python
import os
import yaml

def parse_okf_file(filepath: str) -> dict | None:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if not content.startswith("---"):
            return None
        parts = content.split("---", 2)
        if len(parts) < 3:
            return None
        frontmatter = yaml.safe_load(parts[1])
        if not frontmatter or 'type' not in frontmatter:
            return None
        return {
            "frontmatter": frontmatter,
            "content": parts[2].strip()
        }
    except Exception as e:
        print(f"Warning: failed to parse {filepath}: {e}")
        return None
```

## Summary of Findings

- Use `pyyaml` for safe frontmatter parsing.
- Set environment variables `OPENROUTER_API_KEY` and fallback base URL properly.
- Matching logic will build an in-memory database list of parsed OKF concepts on server startup.
- Endpoint `/api/chat` returns an SSE stream formatting chunks as structured JSON `{"text": "..."}`.

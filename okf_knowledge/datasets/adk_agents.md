---
type: "Document"
title: "Agent Development Kit — Agents"
tags: ["adk", "agent", "google-adk", "llm", "instruction"]
description: "How ADK Agent objects are defined, configured, and instructed"
resource: "doc://google-adk/agents"
timestamp: "2026-07-10T08:10:00Z"
---
# Agent Development Kit — Agents

An `Agent` is the core LLM unit in Google ADK. It wraps a model, an
instruction, and optional tools.

## Construction
```python
from google.adk import Agent
agent = Agent(
    name="okf_agent",
    model="gemini/gemini-2.5-flash",   # or litellm:openrouter/<model>
    instruction="You are a helpful grounding assistant.",
)
```

## Model strings
- Native: `gemini/gemini-2.5-flash`
- Via LiteLLM (OpenRouter etc.): prefix with `litellm:`, e.g.
  `litellm:openrouter/google/gemini-2.5-flash`

## Instruction
The system prompt. Set per request by reassigning `agent.instruction`
before `runner.run_async(...)`.

## Notes
The agent is stateless between runs; session state lives in the
`SessionService`.

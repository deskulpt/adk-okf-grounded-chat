---
type: "Document"
title: "Agent Development Kit — Tools & Function Calling"
tags: ["adk", "tools", "function-calling", "google-adk", "agent"]
description: "Registering Python functions as agent tools in ADK"
resource: "doc://google-adk/tools"
timestamp: "2026-07-10T08:30:00Z"
---
# Agent Development Kit — Tools & Function Calling

Tools let an agent call your code. Decorate a function with
`@tool` (or pass plain callables) and attach to the agent.

## Example
```python
from google.adk.tools import FunctionTool

def get_weather(city: str) -> str:
    """Return the current weather for a city."""
    return "Sunny in " + city

agent = Agent(
    name="weather_agent",
    model="gemini/gemini-2.5-flash",
    tools=[FunctionTool(get_weather)],
)
```

## Rules
- Docstrings become the tool description the model sees.
- Typed signatures let ADK validate arguments.
- Long-running tools should be async.

## Grounding note
For retrieval-grounded agents, prefer injecting context into the instruction
over giving the model a raw search tool — cheaper and more auditable.

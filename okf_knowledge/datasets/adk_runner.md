---
type: "Document"
title: "Agent Development Kit — Runner & Sessions"
tags: ["adk", "runner", "session", "google-adk", "async"]
description: "Running agents with Runner and handling streamed events"
resource: "doc://google-adk/runner"
timestamp: "2026-07-10T08:20:00Z"
---
# Agent Development Kit — Runner & Sessions

`Runner` executes an agent against a session and yields events.

## Setup
```python
from google.adk import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService

runner = Runner(
    app=adk_app,
    artifact_service=...,
    session_service=InMemorySessionService(),
    memory_service=...,
)

session = await session_service.create_session(app_name="okf_agent_app", user_id="user_1")
async for event in runner.run_async(
    user_id=session.user_id,
    session_id=session.id,
    new_message=content_msg,
):
    if event.content and event.content.parts:
        text = "".join(p.text for p in event.content.parts if p.text)
```

## Streaming
`run_async` is an async generator. Each `event.content.parts` may carry
`text`. Concatenate parts to reconstruct the model output.

## Errors
Wrap the loop in try/except; on failure emit a single error payload rather
than crashing the stream.

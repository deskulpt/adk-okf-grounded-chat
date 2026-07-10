---
type: "Document"
title: "Open Knowledge Format (OKF) Spec"
tags: ["okf", "knowledge", "format", "schema", "frontmatter"]
description: "Reference for the OKF markdown schema used to ground the agent"
resource: "doc://okf/spec"
timestamp: "2026-07-10T08:00:00Z"
---
# Open Knowledge Format (OKF) Spec

OKF stores knowledge as markdown files with YAML frontmatter. The engine
(`okf_engine.py`) walks `okf_knowledge/` recursively and loads every `*.md`
except `index.md` / `log.md`.

## Frontmatter fields
- `type` (required): concept | document | webpage | api | persona | instruction
- `title`: display name; defaults to the filename
- `tags`: list used for keyword matching against the user query
- `description`: one-line summary
- `resource`: opaque locator (e.g. `bigquery://…`, `web://…`)
- `timestamp`: ISO-8601

## Body
Free markdown. Headings become candidate follow-up prompts in pure-OKF mode.

## Matching
`match_concepts(query)` intersects query tokens with id/title/tag words.
Persona and instruction types are excluded from query matches but are still
injected into the grounded prompt context.

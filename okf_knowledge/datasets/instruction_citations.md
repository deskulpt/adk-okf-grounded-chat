---
type: "Instruction"
title: "Citation Rule"
tags: ["instruction", "citation", "grounding", "policy"]
description: "Mandatory rule: every factual claim must cite the source document by title"
resource: "instruction://cite-sources"
timestamp: "2026-07-10T08:30:00Z"
---
# Instruction: Cite Your Sources

Every factual claim in a reply must name the document it came from.

## Format
End the claim with `(Source: <Document Title>)`.

## Examples
- "Refunds land in 5 business days (Source: Returns & Refunds API)."
- "Tracking lags up to 24h after pickup (Source: Support FAQ — Shipping & Tracking)."

## Why
Grounded answers are auditable. If a claim has no source, say "I couldn't
find that in the provided documents" instead of guessing.

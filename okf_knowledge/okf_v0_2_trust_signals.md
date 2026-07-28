---
type: concept
title: "OKF v0.2 Trust Signals"
tags: ["okf", "v0.2", "trust", "provenance", "adoption"]
description: "Summary of the optional trust-signal frontmatter fields introduced in Open Knowledge Format v0.2."
generated:
  by: human:assistant
  at: 2026-07-28T00:00:00Z
verified:
  - by: human:assistant
    at: 2026-07-28T00:00:00Z
status: stable
stale_after: 2027-07-28
sources:
  - id: google-okf-v02-blog
    resource: https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals
    title: "Open Knowledge format v0.2 tackles agentic trust"
    author: "Google Cloud Blog"
---
# OKF v0.2 Trust Signals

OKF v0.2 adds **optional** frontmatter vocabulary that answers five trust questions about a concept:

1. **Provenance** — `sources`: what this concept was created from.
2. **Trust** — `generated` + `verified`: who produced it and who confirmed it.
3. **Freshness** — `stale_after`: when the concept should be considered stale.
4. **Lifecycle** — `status`: current lifecycle stage (e.g. `stable`, `draft`, `deprecated`).
5. **Attestation** — `computation` concept type with policy/expression/attest fields for computed metrics.

The format remains minimally opinionated: `type` is still the only required field, and all v0.2 additions are opt-in. A concept that omits them is exactly as valid as a v0.1 concept.

# OKF v0.2 Adoption Notes

Source: [Open Knowledge format v0.2 tackles agentic trust](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals)

## What changed in v0.2

OKF v0.2 keeps `type` as the only required frontmatter field and adds **optional** trust-signal fields:

| Family | Fields | Purpose |
|--------|--------|---------|
| Provenance | `sources` (id, resource, title, author, usage_count, last_modified) | Record what a concept derives from |
| Trust | `generated` {by, at}, `verified` [{by, at}] | Who produced and confirmed the content |
| Freshness | `stale_after` | ISO 8601 date after which data should be rechecked |
| Lifecycle | `status` (draft, stable, deprecated, etc.) | Current lifecycle stage |
| Attestation | `computation` concept type with `policy`, `expression`, `attest` | Verifiable computed metrics |

## What we adopted

- **`backend/okf_engine.py`**: extended concept loading to preserve v0.2 trust-signal fields (`generated`, `verified`, `status`, `stale_after`, `sources`).
- **`okf_knowledge/okf_v0_2_trust_signals.md`**: a sample concept that uses the new frontmatter.

## What we skipped (for now)

- **Trust-tier filtering** (unverified → machine-confirmed → human-reviewed). The fields are stored, but the matcher does not yet prefer verified or stable concepts. Add when the chat UI needs a trust filter.
- **Computation/attestation concept types**. We have no computed metrics yet.
- **`.okfignore` / typed relationship edges**. Proposals from the community; not yet needed for our chat corpus.

## Next steps (optional)

1. Surface trust signals in the chat UI (e.g., badge for `status: stable` or human-verified concepts).
2. Boost `match_concepts` scores for `verified` / `status: stable` concepts.
3. Add a `computation` concept when we expose queryable metrics.

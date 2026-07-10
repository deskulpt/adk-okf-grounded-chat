# Phase 4: Client-Side Session Knowledge & MarkItDown Conversion - Context

**Phase:** 04
**Date:** 2026-07-10
**Status:** Completed

## Design Decisions

### 1. In-Browser / Backend Hybrid Conversion
We will use Microsoft's `markitdown` on the backend python runtime to handle document conversion (PDFs, Word documents, spreadsheets) while storing the resulting markdown completely in-memory on the React client side.
- Allows parsing complex files securely without requiring client-side JS binary decoders.
- Guarantees zero disk writes/persistence of the uploaded files on the server or git.

### 2. Side-By-Side Catalog Sidebar Explorer
To expose these local documents, we will restructure the React chat interface into a dual-column layout:
- Left Column: Lists all available OKF concepts (System concepts fetched from uvicorn, and Session concepts uploaded during the user's active session). It also houses the drop zone for new files.
- Right Column: The main chat panel itself.
- Highlighting user privacy in the sidebar header with a lock icon.

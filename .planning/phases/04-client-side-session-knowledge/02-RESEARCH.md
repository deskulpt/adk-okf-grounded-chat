# Phase 4: Client-Side Session Knowledge & MarkItDown Conversion - Research

**Phase:** 04
**Date:** 2026-07-10
**Status:** Completed

## Technical Context

This phase coordinates Microsoft MarkItDown library integrations for dynamic user file uploads.

### 1. Microsoft MarkItDown Capabilities
`markitdown` automatically routes and parses the following types of files:
- PDF (via pdfminer)
- DOCX, XLSX, PPTX (via standard openxml wrappers)
- HTML, XML, JSON, CSV
- ZIP (extracts content)

We use it in Python:
```python
from markitdown import MarkItDown
markitdown = MarkItDown()
result = markitdown.convert("path/to/file")
print(result.text_content)
```

### 2. Multi-part File Uploads in FastAPI
To accept file uploads in FastAPI, we define an `/api/convert` POST route:
```python
from fastapi import UploadFile, File

@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...)):
    # Write to temp file and run markitdown
    ...
```

### 3. Frontend Multi-part FormData Requests
In React, we send uploaded files using browser `FormData`:
```typescript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("http://localhost:8040/api/convert", {
  method: "POST",
  body: formData
});
```
This is fully supported in standard fetch API.

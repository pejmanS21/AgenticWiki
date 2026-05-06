# Local AI Knowledge Space

Local-first AI knowledge workspace for document ingestion, semantic search, RAG chat, knowledge graph exploration, derived notes, and editable LLM system prompts.

## Folder Tree

```text
backend/
  app/
    main.py
    config.py
    db.py
    models/entities.py
    repositories/
    routers/
    schemas/
    services/
    utils/
    data/uploads/
    data/chroma/
  pyproject.toml
  .env.example
  README.md
frontend/
  app/
    layout.tsx
    page.tsx
    globals.css
    upload/page.tsx
    search/page.tsx
    graph/page.tsx
    settings/page.tsx
    document/[id]/page.tsx
  components/
    ui/
    layout/
    dashboard/
    document/
    graph/
    search/
    settings/
    upload/
  lib/
    api.ts
    types.ts
    utils.ts
  package.json
  .env.example
  README.md
```

## Backend

```bash
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Backend API: `http://localhost:8000`

## Frontend

```bash
cd frontend
bun install
cp .env.example .env.local
bun run dev
```

Frontend: `http://localhost:3000`

## Features

- Uploads PDF, markdown, text, and images into local filesystem storage.
- Extracts text with PyMuPDF, direct text reads, and pytesseract OCR.
- Chunks text, stores metadata in SQLite, and stores vectors in ChromaDB.
- Runs LLM analysis for summary, key points, and tags.
- Searches semantically and answers with RAG citations.
- Builds similarity-based knowledge graph nodes and edges.
- Generates derived notes as new document entries.
- Persists provider/model/base URL/API key/system prompt in SQLite.

## LLM Providers

Supported settings:

- `ollama` via OpenAI-compatible local endpoint, default `http://localhost:11434/v1`
- `openai`
- `openai-compatible` custom base URL

The backend loads settings for every LLM call and injects the stored system prompt.

## Notes

- No Tailwind. No shadcn/ui. CSS Modules plus global CSS only.
- Default embedding service uses deterministic local hash embeddings so scaffold runs without external embedding APIs.
- For production-grade retrieval, replace `EmbeddingService` with sentence-transformers, OpenAI embeddings, or another configured provider.
- OCR requires Tesseract installed on host.


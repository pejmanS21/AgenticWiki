# Local AI Knowledge Space Backend

FastAPI backend for local document ingestion, semantic search, RAG chat, graph relationships, settings, and derived notes.

## Setup

```bash
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`.

## Local LLM

Default settings target Ollama:

```bash
ollama pull llama3.1
ollama serve
```

OpenAI and OpenAI-compatible APIs can be configured from `/settings` in the frontend.

## OCR

Image ingestion uses `pytesseract`. Install system Tesseract first:

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr
```

## Useful Commands

```bash
uv run uvicorn app.main:app --reload
uv run ruff check app
uv run pytest
```


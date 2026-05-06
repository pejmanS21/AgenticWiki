from pydantic import BaseModel

from app.schemas.search import Citation


class ChatRequest(BaseModel):
    message: str
    top_k: int = 6


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]


class DerivedNoteRequest(BaseModel):
    document_ids: list[int]
    prompt: str = "Create a concise research note with key findings, open questions, and next actions."


class DerivedNoteResponse(BaseModel):
    document_id: int
    title: str
    content: str
    tags: list[str]


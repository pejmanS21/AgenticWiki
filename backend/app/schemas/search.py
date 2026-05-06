from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    top_k: int = 6
    include_answer: bool = True


class ChunkHit(BaseModel):
    chunk_id: int
    document_id: int
    document_title: str
    snippet: str
    score: float
    chunk_index: int


class Citation(BaseModel):
    document_id: int
    document_title: str
    chunk_id: int
    snippet: str


class SearchResponse(BaseModel):
    answer: str
    citations: list[Citation]
    chunks: list[ChunkHit]
    related_documents: list[int]


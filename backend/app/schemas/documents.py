from datetime import datetime

from pydantic import BaseModel


class DocumentListItem(BaseModel):
    id: int
    title: str
    filename: str
    mime_type: str
    kind: str
    status: str
    summary: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime


class ChunkPreview(BaseModel):
    id: int
    chunk_index: int
    content: str


class RelatedDocument(BaseModel):
    id: int
    title: str
    weight: float
    reason: str


class DocumentDetail(DocumentListItem):
    key_points: list[str]
    extracted_text_preview: str
    chunks: list[ChunkPreview]
    related_documents: list[RelatedDocument]


class DocumentActionResponse(BaseModel):
    document: DocumentListItem
    message: str


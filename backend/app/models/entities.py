from datetime import datetime, timezone
from enum import StrEnum
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentStatus(StrEnum):
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class DocumentKind(StrEnum):
    file = "file"
    derived_note = "derived_note"


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    filename: str
    mime_type: str
    file_path: str
    kind: DocumentKind = Field(default=DocumentKind.file)
    status: DocumentStatus = Field(default=DocumentStatus.uploaded, index=True)
    summary: str = ""
    key_points_json: str = "[]"
    tags_json: str = "[]"
    extracted_text: str = ""
    error_message: str = ""
    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: datetime = Field(default_factory=utc_now)


class Chunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(index=True, foreign_key="document.id")
    chunk_index: int
    content: str
    char_start: int
    char_end: int
    embedding_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=utc_now)


class GraphNode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(index=True, foreign_key="document.id", unique=True)
    label: str
    group: str = "document"
    metadata_json: str = "{}"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class GraphEdge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_document_id: int = Field(index=True, foreign_key="document.id")
    target_document_id: int = Field(index=True, foreign_key="document.id")
    weight: float = 0.0
    label: str = "similar"
    metadata_json: str = "{}"
    created_at: datetime = Field(default_factory=utc_now)


class UserSettings(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True)
    llm_provider: str = "ollama"
    llm_model: str = "llama3.1"
    llm_base_url: str = "http://localhost:11434/v1"
    llm_api_key: str = ""
    llm_profiles_json: str = "[]"
    selected_llm_profile_id: str = "default"
    ui_theme: str = "device"
    embedding_provider: str = "local-hash"
    embedding_model: str = "hash-384"
    system_prompt: str = (
        "You are a precise research assistant. Answer with grounded citations from provided context."
    )
    updated_at: datetime = Field(default_factory=utc_now)

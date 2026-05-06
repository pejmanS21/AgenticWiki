from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.models.entities import Document
from app.repositories.document_repository import DocumentRepository
from app.repositories.settings_repository import SettingsRepository
from app.schemas.chat import ChatRequest, ChatResponse, DerivedNoteRequest, DerivedNoteResponse
from app.services.ingestion_service import IngestionService
from app.services.llm_service import LLMService
from app.services.search_service import SearchService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, session: Session = Depends(get_session)) -> ChatResponse:
    result = await SearchService(session).search(request.message, request.top_k, include_answer=True)
    return ChatResponse(answer=result.answer, citations=result.citations)


@router.post("/derived-note", response_model=DerivedNoteResponse)
async def create_derived_note(
    request: DerivedNoteRequest, session: Session = Depends(get_session)
) -> DerivedNoteResponse:
    repo = DocumentRepository(session)
    documents: list[Document] = []
    for document_id in request.document_ids:
        document = repo.get(document_id)
        if document is None:
            raise HTTPException(status_code=404, detail=f"Document not found: {document_id}")
        documents.append(document)

    source_title = ", ".join(document.title for document in documents)
    context = "\n\n".join(
        f"# {document.title}\n{document.extracted_text[:8000]}" for document in documents
    )
    note = await LLMService().create_derived_note(
        SettingsRepository(session).get(), source_title, context, request.prompt
    )
    document = await IngestionService(session).ingest_derived_note(note.title, note.content, note.tags)
    return DerivedNoteResponse(
        document_id=document.id or 0,
        title=note.title,
        content=note.content,
        tags=note.tags,
    )


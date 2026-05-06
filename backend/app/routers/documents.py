from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.repositories.document_repository import DocumentRepository
from app.routers.helpers import document_to_list_item, edge_to_related
from app.schemas.documents import ChunkPreview, DocumentDetail, DocumentListItem
from app.utils.json import from_json

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentListItem])
async def list_documents(limit: int = 20, session: Session = Depends(get_session)) -> list[DocumentListItem]:
    repo = DocumentRepository(session)
    return [document_to_list_item(document) for document in repo.list_recent(limit)]


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: int, session: Session = Depends(get_session)) -> DocumentDetail:
    repo = DocumentRepository(session)
    document = repo.get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    related = []
    for edge in repo.get_related(document_id):
        target_id = edge.target_document_id if edge.source_document_id == document_id else edge.source_document_id
        target = repo.get(target_id)
        if target:
            related.append(edge_to_related(edge, document_id, target.title))

    item = document_to_list_item(document)
    return DocumentDetail(
        **item.model_dump(),
        key_points=from_json(document.key_points_json, []),
        extracted_text_preview=document.extracted_text[:6000],
        chunks=[
            ChunkPreview(id=chunk.id or 0, chunk_index=chunk.chunk_index, content=chunk.content[:800])
            for chunk in repo.chunks_for_document(document_id)[:20]
        ],
        related_documents=related,
    )


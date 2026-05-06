from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db import get_session
from app.repositories.document_repository import DocumentRepository
from app.routers.helpers import document_to_list_item
from app.schemas.documents import DocumentActionResponse
from app.services.ingestion_service import IngestionService

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/{document_id}", response_model=DocumentActionResponse)
async def rerun_ingestion(
    document_id: int, session: Session = Depends(get_session)
) -> DocumentActionResponse:
    document = DocumentRepository(session).get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    updated = await IngestionService(session).ingest_document(document_id)
    return DocumentActionResponse(
        document=document_to_list_item(updated),
        message="Ingestion completed" if updated.status == "ready" else "Ingestion failed",
    )


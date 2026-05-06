from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlmodel import Session

from app.db import get_session
from app.models.entities import Document
from app.repositories.document_repository import DocumentRepository
from app.routers.helpers import document_to_list_item
from app.schemas.upload import UploadResponse
from app.services.file_service import FileService
from app.services.ingestion_service import IngestionService

router = APIRouter(prefix="/upload", tags=["upload"])


async def run_ingestion(document_id: int) -> None:
    from app.db import engine

    with Session(engine) as session:
        await IngestionService(session).ingest_document(document_id)


@router.post("", response_model=UploadResponse)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
) -> UploadResponse:
    file_service = FileService()
    repo = DocumentRepository(session)
    documents = []
    for file in files:
        path, mime_type = await file_service.save_upload(file)
        document = repo.create(
            Document(
                title=file.filename or "Untitled",
                filename=file.filename or "upload",
                mime_type=mime_type,
                file_path=path,
            )
        )
        background_tasks.add_task(run_ingestion, document.id or 0)
        documents.append(document_to_list_item(document))
    return UploadResponse(documents=documents)


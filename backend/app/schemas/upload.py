from pydantic import BaseModel

from app.schemas.documents import DocumentListItem


class UploadResponse(BaseModel):
    documents: list[DocumentListItem]

 

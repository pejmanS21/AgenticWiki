from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest, session: Session = Depends(get_session)
) -> SearchResponse:
    return await SearchService(session).search(
        request.query, top_k=request.top_k, include_answer=request.include_answer
    )


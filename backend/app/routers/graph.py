from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.repositories.document_repository import GraphRepository
from app.routers.helpers import edge_to_read, node_to_read
from app.schemas.graph import GraphResponse

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("", response_model=GraphResponse)
async def get_graph(session: Session = Depends(get_session)) -> GraphResponse:
    nodes, edges = GraphRepository(session).list_graph()
    return GraphResponse(
        nodes=[node_to_read(node) for node in nodes],
        edges=[edge_to_read(edge) for edge in edges],
    )


@router.get("/neighbors/{document_id}", response_model=GraphResponse)
async def get_neighbors(document_id: int, session: Session = Depends(get_session)) -> GraphResponse:
    nodes, edges = GraphRepository(session).neighbors(document_id)
    return GraphResponse(
        nodes=[node_to_read(node) for node in nodes],
        edges=[edge_to_read(edge) for edge in edges],
    )


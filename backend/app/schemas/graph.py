from pydantic import BaseModel


class GraphNodeRead(BaseModel):
    id: int
    document_id: int
    label: str
    group: str
    metadata: dict


class GraphEdgeRead(BaseModel):
    id: int
    source_document_id: int
    target_document_id: int
    weight: float
    label: str
    metadata: dict


class GraphResponse(BaseModel):
    nodes: list[GraphNodeRead]
    edges: list[GraphEdgeRead]


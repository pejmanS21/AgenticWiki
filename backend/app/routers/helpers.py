from app.models.entities import Document, GraphEdge, GraphNode
from app.schemas.documents import DocumentListItem, RelatedDocument
from app.schemas.graph import GraphEdgeRead, GraphNodeRead
from app.utils.json import from_json


def document_to_list_item(document: Document) -> DocumentListItem:
    return DocumentListItem(
        id=document.id or 0,
        title=document.title,
        filename=document.filename,
        mime_type=document.mime_type,
        kind=document.kind,
        status=document.status,
        summary=document.summary,
        tags=from_json(document.tags_json, []),
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def edge_to_related(edge: GraphEdge, source_id: int, title: str) -> RelatedDocument:
    target_id = edge.target_document_id if edge.source_document_id == source_id else edge.source_document_id
    return RelatedDocument(id=target_id, title=title, weight=edge.weight, reason=edge.label)


def node_to_read(node: GraphNode) -> GraphNodeRead:
    return GraphNodeRead(
        id=node.id or 0,
        document_id=node.document_id,
        label=node.label,
        group=node.group,
        metadata=from_json(node.metadata_json, {}),
    )


def edge_to_read(edge: GraphEdge) -> GraphEdgeRead:
    return GraphEdgeRead(
        id=edge.id or 0,
        source_document_id=edge.source_document_id,
        target_document_id=edge.target_document_id,
        weight=edge.weight,
        label=edge.label,
        metadata=from_json(edge.metadata_json, {}),
    )


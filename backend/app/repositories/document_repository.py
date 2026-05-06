from datetime import datetime, timezone

from sqlmodel import Session, col, or_, select

from app.models.entities import Chunk, Document, DocumentStatus, GraphEdge, GraphNode


class DocumentRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, document: Document) -> Document:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def get(self, document_id: int) -> Document | None:
        return self.session.get(Document, document_id)

    def list_recent(self, limit: int = 20) -> list[Document]:
        statement = select(Document).order_by(col(Document.updated_at).desc()).limit(limit)
        return list(self.session.exec(statement))

    def list_ready(self) -> list[Document]:
        statement = select(Document).where(Document.status == DocumentStatus.ready)
        return list(self.session.exec(statement))

    def update(self, document: Document) -> Document:
        document.updated_at = datetime.now(timezone.utc)
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def add_chunks(self, chunks: list[Chunk]) -> list[Chunk]:
        self.session.add_all(chunks)
        self.session.commit()
        for chunk in chunks:
            self.session.refresh(chunk)
        return chunks

    def delete_chunks(self, document_id: int) -> None:
        chunks = self.session.exec(select(Chunk).where(Chunk.document_id == document_id)).all()
        for chunk in chunks:
            self.session.delete(chunk)
        self.session.commit()

    def chunks_for_document(self, document_id: int) -> list[Chunk]:
        statement = select(Chunk).where(Chunk.document_id == document_id).order_by(Chunk.chunk_index)
        return list(self.session.exec(statement))

    def chunk_by_embedding_id(self, embedding_id: str) -> Chunk | None:
        statement = select(Chunk).where(Chunk.embedding_id == embedding_id)
        return self.session.exec(statement).first()

    def get_related(self, document_id: int, limit: int = 8) -> list[GraphEdge]:
        statement = (
            select(GraphEdge)
            .where(
                or_(
                    GraphEdge.source_document_id == document_id,
                    GraphEdge.target_document_id == document_id,
                )
            )
            .order_by(col(GraphEdge.weight).desc())
            .limit(limit)
        )
        return list(self.session.exec(statement))


class GraphRepository:
    def __init__(self, session: Session):
        self.session = session

    def upsert_node(self, node: GraphNode) -> GraphNode:
        existing = self.session.exec(
            select(GraphNode).where(GraphNode.document_id == node.document_id)
        ).first()
        if existing:
            existing.label = node.label
            existing.group = node.group
            existing.metadata_json = node.metadata_json
            existing.updated_at = datetime.now(timezone.utc)
            self.session.add(existing)
            self.session.commit()
            self.session.refresh(existing)
            return existing
        self.session.add(node)
        self.session.commit()
        self.session.refresh(node)
        return node

    def replace_edges_for_document(self, document_id: int, edges: list[GraphEdge]) -> None:
        old_edges = self.session.exec(
            select(GraphEdge).where(
                or_(
                    GraphEdge.source_document_id == document_id,
                    GraphEdge.target_document_id == document_id,
                )
            )
        ).all()
        for edge in old_edges:
            self.session.delete(edge)
        self.session.add_all(edges)
        self.session.commit()

    def list_graph(self) -> tuple[list[GraphNode], list[GraphEdge]]:
        return list(self.session.exec(select(GraphNode))), list(self.session.exec(select(GraphEdge)))

    def neighbors(self, document_id: int) -> tuple[list[GraphNode], list[GraphEdge]]:
        edges = self.session.exec(
            select(GraphEdge).where(
                or_(
                    GraphEdge.source_document_id == document_id,
                    GraphEdge.target_document_id == document_id,
                )
            )
        ).all()
        document_ids = {document_id}
        for edge in edges:
            document_ids.add(edge.source_document_id)
            document_ids.add(edge.target_document_id)
        nodes = self.session.exec(select(GraphNode).where(col(GraphNode.document_id).in_(document_ids))).all()
        return list(nodes), list(edges)


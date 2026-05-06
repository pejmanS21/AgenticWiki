import itertools

import numpy as np

from app.models.entities import Document, GraphEdge, GraphNode
from app.repositories.document_repository import DocumentRepository, GraphRepository
from app.utils.json import to_json


class GraphService:
    def __init__(self, document_repo: DocumentRepository, graph_repo: GraphRepository):
        self.document_repo = document_repo
        self.graph_repo = graph_repo

    def upsert_document_node(self, document: Document) -> None:
        tags = document.tags_json
        self.graph_repo.upsert_node(
            GraphNode(
                document_id=document.id or 0,
                label=document.title,
                group=document.kind,
                metadata_json=to_json({"status": document.status, "tags": tags}),
            )
        )

    async def rebuild_edges_for_document(self, document: Document) -> None:
        if document.id is None:
            return
        ready_documents = [item for item in self.document_repo.list_ready() if item.id != document.id]
        source_chunks = self.document_repo.chunks_for_document(document.id)
        edges: list[GraphEdge] = []
        for other in ready_documents:
            if other.id is None:
                continue
            target_chunks = self.document_repo.chunks_for_document(other.id)
            score = self._similarity(
                " ".join(chunk.content[:500] for chunk in source_chunks[:5]),
                " ".join(chunk.content[:500] for chunk in target_chunks[:5]),
            )
            if score >= 0.12:
                source_id, target_id = sorted([document.id, other.id])
                edges.append(
                    GraphEdge(
                        source_document_id=source_id,
                        target_document_id=target_id,
                        weight=round(score, 4),
                        label="semantic similarity",
                        metadata_json=to_json({"basis": "chunk text hash similarity"}),
                    )
                )
        deduped = {
            (edge.source_document_id, edge.target_document_id): edge
            for edge in sorted(edges, key=lambda edge: edge.weight)
        }
        self.graph_repo.replace_edges_for_document(document.id, list(deduped.values()))

    def _similarity(self, left: str, right: str) -> float:
        if not left or not right:
            return 0.0
        left_tokens = {token.lower().strip(".,;:!?") for token in left.split() if len(token) > 4}
        right_tokens = {token.lower().strip(".,;:!?") for token in right.split() if len(token) > 4}
        if not left_tokens or not right_tokens:
            return 0.0
        overlap = len(left_tokens & right_tokens)
        union = len(left_tokens | right_tokens)
        jaccard = overlap / union
        tag_bonus = 0.0
        for first, second in itertools.product(list(left_tokens)[:12], list(right_tokens)[:12]):
            if first[:6] == second[:6]:
                tag_bonus += 0.002
        return float(np.clip(jaccard + tag_bonus, 0, 1))


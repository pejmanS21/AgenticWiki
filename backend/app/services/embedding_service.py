import hashlib
import math
from dataclasses import dataclass

import chromadb
from chromadb.api.models.Collection import Collection

from app.config import get_settings


@dataclass
class VectorHit:
    embedding_id: str
    score: float
    metadata: dict
    document: str


class EmbeddingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = chromadb.PersistentClient(path=str(settings.chroma_dir))
        self.collection: Collection = self.client.get_or_create_collection(
            name="knowledge_chunks",
            metadata={"hnsw:space": "cosine"},
        )
        self.dimensions = 384

    async def embed_text(self, text: str) -> list[float]:
        return self._hash_embedding(text)

    async def upsert_chunks(self, ids: list[str], texts: list[str], metadatas: list[dict]) -> None:
        embeddings = [self._hash_embedding(text) for text in texts]
        self.collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)

    async def delete_document(self, document_id: int) -> None:
        self.collection.delete(where={"document_id": document_id})

    async def search(self, query: str, top_k: int) -> list[VectorHit]:
        embedding = self._hash_embedding(query)
        result = self.collection.query(query_embeddings=[embedding], n_results=top_k)
        ids = result.get("ids", [[]])[0]
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]
        hits: list[VectorHit] = []
        for embedding_id, document, metadata, distance in zip(ids, documents, metadatas, distances):
            hits.append(
                VectorHit(
                    embedding_id=embedding_id,
                    score=max(0.0, 1.0 - float(distance)),
                    metadata=metadata or {},
                    document=document or "",
                )
            )
        return hits

    def _hash_embedding(self, text: str) -> list[float]:
        tokens = [token.strip(".,;:!?()[]{}\"'").lower() for token in text.split()]
        vector = [0.0] * self.dimensions
        for token in tokens:
            if not token:
                continue
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


from collections import OrderedDict

from sqlmodel import Session

from app.repositories.document_repository import DocumentRepository
from app.repositories.settings_repository import SettingsRepository
from app.schemas.search import ChunkHit, Citation, SearchResponse
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService


class SearchService:
    def __init__(self, session: Session):
        self.document_repo = DocumentRepository(session)
        self.settings_repo = SettingsRepository(session)
        self.embeddings = EmbeddingService()
        self.llm = LLMService()

    async def search(self, query: str, top_k: int = 6, include_answer: bool = True) -> SearchResponse:
        vector_hits = await self.embeddings.search(query, top_k)
        chunk_hits: list[ChunkHit] = []
        citations: list[Citation] = []
        related_document_ids: OrderedDict[int, None] = OrderedDict()

        for hit in vector_hits:
            chunk = self.document_repo.chunk_by_embedding_id(hit.embedding_id)
            if chunk is None:
                continue
            document = self.document_repo.get(chunk.document_id)
            if document is None:
                continue
            snippet = chunk.content[:500]
            chunk_hit = ChunkHit(
                chunk_id=chunk.id or 0,
                document_id=document.id or 0,
                document_title=document.title,
                snippet=snippet,
                score=hit.score,
                chunk_index=chunk.chunk_index,
            )
            chunk_hits.append(chunk_hit)
            citations.append(
                Citation(
                    document_id=document.id or 0,
                    document_title=document.title,
                    chunk_id=chunk.id or 0,
                    snippet=snippet,
                )
            )
            related_document_ids[document.id or 0] = None

        context = "\n\n".join(
            f"[{item.document_id}:{item.chunk_id}] {item.document_title}\n{item.snippet}"
            for item in chunk_hits
        )
        answer = ""
        if include_answer and chunk_hits:
            answer = await self.llm.answer_query(self.settings_repo.get(), query, context)
        elif not chunk_hits:
            answer = "No matching context found."

        return SearchResponse(
            answer=answer,
            citations=citations,
            chunks=chunk_hits,
            related_documents=list(related_document_ids.keys()),
        )


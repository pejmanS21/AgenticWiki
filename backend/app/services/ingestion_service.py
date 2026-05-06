import logging
from pathlib import Path
from uuid import uuid4

from sqlmodel import Session

from app.models.entities import Chunk, Document, DocumentKind, DocumentStatus
from app.config import get_settings
from app.repositories.document_repository import DocumentRepository, GraphRepository
from app.repositories.settings_repository import SettingsRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.graph_service import GraphService
from app.services.llm_service import LLMService, DocumentAnalysis
from app.services.text_extraction_service import TextExtractionService
from app.utils.json import to_json

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(self, session: Session):
        self.session = session
        self.document_repo = DocumentRepository(session)
        self.settings_repo = SettingsRepository(session)
        self.extractor = TextExtractionService()
        self.chunker = ChunkingService()
        self.embeddings = EmbeddingService()
        self.llm = LLMService()
        self.graph = GraphService(self.document_repo, GraphRepository(session))

    async def ingest_document(self, document_id: int) -> Document:
        document = self.document_repo.get(document_id)
        if document is None:
            raise ValueError(f"Document not found: {document_id}")

        logger.info("Starting ingestion for document %s", document_id)
        document.status = DocumentStatus.processing
        document.error_message = ""
        self.document_repo.update(document)

        try:
            text = await self.extractor.extract_text(document.file_path, document.mime_type)
            document.extracted_text = text
            self.document_repo.delete_chunks(document.id or 0)
            await self.embeddings.delete_document(document.id or 0)

            text_chunks = self.chunker.chunk_text(text)
            embedding_ids = [f"doc-{document.id}-chunk-{index}-{uuid4().hex[:8]}" for index, _ in enumerate(text_chunks)]
            chunks = [
                Chunk(
                    document_id=document.id or 0,
                    chunk_index=index,
                    content=chunk.content,
                    char_start=chunk.char_start,
                    char_end=chunk.char_end,
                    embedding_id=embedding_ids[index],
                )
                for index, chunk in enumerate(text_chunks)
            ]
            if chunks:
                self.document_repo.add_chunks(chunks)
                await self.embeddings.upsert_chunks(
                    ids=[chunk.embedding_id for chunk in chunks],
                    texts=[chunk.content for chunk in chunks],
                    metadatas=[
                        {
                            "document_id": chunk.document_id,
                            "chunk_id": chunk.id or 0,
                            "chunk_index": chunk.chunk_index,
                            "title": document.title,
                        }
                        for chunk in chunks
                    ],
                )

            analysis = await self.llm.analyze_document(self.settings_repo.get(), document.title, text)
            document.summary = analysis.summary
            document.key_points_json = to_json(analysis.key_points)
            document.tags_json = to_json(analysis.tags)
            document.status = DocumentStatus.ready
            self.document_repo.update(document)
            self.graph.upsert_document_node(document)
            await self.graph.rebuild_edges_for_document(document)
            logger.info("Finished ingestion for document %s", document_id)
            return document
        except Exception as exc:
            logger.exception("Ingestion failed for document %s", document_id)
            document.status = DocumentStatus.failed
            document.error_message = str(exc)
            self.document_repo.update(document)
            return document

    async def ingest_derived_note(self, title: str, content: str, tags: list[str]) -> Document:
        note_path = get_settings().upload_dir / f"derived_{uuid4().hex}.md"
        note_path.parent.mkdir(parents=True, exist_ok=True)
        note_path.write_text(content, encoding="utf-8")
        document = self.document_repo.create(
            Document(
                title=title,
                filename=note_path.name,
                mime_type="text/markdown",
                file_path=str(note_path),
                kind=DocumentKind.derived_note,
                summary=content[:600],
                tags_json=to_json(tags),
            )
        )
        return await self.ingest_document(document.id or 0)

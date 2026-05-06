import json
import logging
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent

try:
    from pydantic_ai.models.openai import OpenAIChatModel
    from pydantic_ai.providers.openai import OpenAIProvider
except Exception:  # pragma: no cover
    OpenAIChatModel = None
    OpenAIProvider = None

from app.models.entities import UserSettings

logger = logging.getLogger(__name__)


class DocumentAnalysis(BaseModel):
    summary: str
    key_points: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class DerivedNote(BaseModel):
    title: str
    content: str
    tags: list[str] = Field(default_factory=list)


class LLMService:
    def build_agent(self, settings: UserSettings, output_type: type[Any] | None = str) -> Agent:
        model = self._build_model(settings)
        return Agent(model=model, output_type=output_type, system_prompt=settings.system_prompt)

    async def analyze_document(self, settings: UserSettings, title: str, text: str) -> DocumentAnalysis:
        logger.info("Running document analysis for %s", title)
        prompt = (
            "Analyze this document. Return concise JSON-compatible output with summary, "
            "5-8 key_points, and 3-8 lowercase tags.\n\n"
            f"Title: {title}\n\nDocument:\n{text[:12000]}"
        )
        try:
            agent = self.build_agent(settings, DocumentAnalysis)
            result = await agent.run(prompt)
            # return json.loads(result.output)
            return result.output
        except Exception as exc:
            logger.warning("LLM analysis failed, using fallback: %s", exc)
            return self._fallback_analysis(text)

    async def answer_query(self, settings: UserSettings, query: str, context: str) -> str:
        logger.info("Running RAG answer")
        prompt = (
            "Answer user question using only provided context. Cite sources as [doc_id:chunk_id]. "
            "If context is insufficient, say what is missing.\n\n"
            f"Question: {query}\n\nContext:\n{context}"
        )
        try:
            agent = self.build_agent(settings)
            result = await agent.run(prompt)
            return str(result.output)
        except Exception as exc:
            logger.warning("LLM answer failed, using fallback: %s", exc)
            return "LLM unavailable. Relevant context is listed in citations and chunks."

    async def create_derived_note(
        self, settings: UserSettings, source_title: str, context: str, prompt: str
    ) -> DerivedNote:
        logger.info("Creating derived note for %s", source_title)
        note_prompt = (
            f"{prompt}\n\nCreate a derived note from source: {source_title}. "
            "Return title, markdown content, and tags.\n\n"
            f"Context:\n{context[:16000]}"
        )
        try:
            agent = self.build_agent(settings, DerivedNote)
            result = await agent.run(note_prompt)
            return result.output
        except Exception as exc:
            logger.warning("LLM note failed, using fallback: %s", exc)
            return DerivedNote(
                title=f"Derived note: {source_title}",
                content=context[:4000],
                tags=["derived", "local"],
            )

    async def test_connection(self, settings: UserSettings) -> tuple[bool, str]:
        try:
            agent = self.build_agent(settings)
            result = await agent.run("Reply with exactly: ok")
            return True, str(result.output)
        except Exception as exc:
            logger.warning("LLM connection test failed: %s", exc)
            return False, str(exc)

    def _build_model(self, settings: UserSettings) -> Any:
        if OpenAIChatModel is None or OpenAIProvider is None:
            raise RuntimeError("pydantic-ai OpenAI provider not available")

        provider_name = settings.llm_provider
        base_url = settings.llm_base_url.strip()
        api_key = settings.llm_api_key.strip() or "local-not-needed"

        if provider_name == "openai":
            provider = OpenAIProvider(api_key=api_key)
            return OpenAIChatModel(settings.llm_model, provider=provider)

        if provider_name in {"ollama", "openai-compatible"}:
            provider = OpenAIProvider(api_key=api_key, base_url=base_url)
            return OpenAIChatModel(settings.llm_model, provider=provider)

        raise ValueError(f"Unsupported LLM provider: {provider_name}")

    def _fallback_analysis(self, text: str) -> DocumentAnalysis:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        summary = " ".join(lines[:4])[:700] or "No readable text extracted."
        key_points = [line[:180] for line in lines[:6]]
        tags = sorted({token.lower().strip(".,:;!?") for token in " ".join(lines[:20]).split() if len(token) > 6})[
            :6
        ]
        return DocumentAnalysis(summary=summary, key_points=key_points, tags=tags or ["local"])

    def parse_jsonish(self, value: str) -> dict[str, Any]:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return {}

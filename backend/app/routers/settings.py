from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import SettingsRead, SettingsUpdate, TestConnectionResponse
from app.services.llm_service import LLMService

router = APIRouter(prefix="/settings", tags=["settings"])


def to_settings_read(settings) -> SettingsRead:
    return SettingsRead(
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        llm_base_url=settings.llm_base_url,
        llm_api_key=settings.llm_api_key,
        embedding_provider=settings.embedding_provider,
        embedding_model=settings.embedding_model,
        system_prompt=settings.system_prompt,
    )


@router.get("", response_model=SettingsRead)
async def get_settings(session: Session = Depends(get_session)) -> SettingsRead:
    return to_settings_read(SettingsRepository(session).get())


@router.put("", response_model=SettingsRead)
async def update_settings(
    request: SettingsUpdate, session: Session = Depends(get_session)
) -> SettingsRead:
    settings = SettingsRepository(session).update(request.model_dump())
    return to_settings_read(settings)


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(session: Session = Depends(get_session)) -> TestConnectionResponse:
    ok, message = await LLMService().test_connection(SettingsRepository(session).get())
    return TestConnectionResponse(ok=ok, message=message)


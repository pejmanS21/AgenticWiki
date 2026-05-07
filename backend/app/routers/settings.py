from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import LLMProfile, SettingsRead, SettingsUpdate, TestConnectionResponse
from app.services.llm_service import LLMService
from app.utils.json import from_json, to_json

router = APIRouter(prefix="/settings", tags=["settings"])


def to_settings_read(settings) -> SettingsRead:
    default_profile = LLMProfile(
        id="default",
        name="Default",
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        llm_base_url=settings.llm_base_url,
        llm_api_key=settings.llm_api_key,
    )
    llm_profiles: list[LLMProfile] = []
    for profile in from_json(settings.llm_profiles_json, [default_profile.model_dump()]):
        try:
            llm_profiles.append(LLMProfile.model_validate(profile))
        except Exception:
            continue
    if not llm_profiles:
        llm_profiles = [default_profile]
    selected_id = settings.selected_llm_profile_id or default_profile.id
    if not any(profile.id == selected_id for profile in llm_profiles):
        selected_id = llm_profiles[0].id if llm_profiles else default_profile.id

    return SettingsRead(
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
        llm_base_url=settings.llm_base_url,
        llm_api_key=settings.llm_api_key,
        llm_profiles=llm_profiles,
        selected_llm_profile_id=selected_id,
        ui_theme=settings.ui_theme,
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
    payload = request.model_dump(exclude={"llm_profiles"})
    llm_profiles = request.llm_profiles or [
        LLMProfile(
            id="default",
            name="Default",
            llm_provider=request.llm_provider,
            llm_model=request.llm_model,
            llm_base_url=request.llm_base_url,
            llm_api_key=request.llm_api_key,
        )
    ]
    selected_id = request.selected_llm_profile_id
    if not any(profile.id == selected_id for profile in llm_profiles):
        selected_id = llm_profiles[0].id
    selected_profile = next(profile for profile in llm_profiles if profile.id == selected_id)
    payload.update(
        llm_provider=selected_profile.llm_provider,
        llm_model=selected_profile.llm_model,
        llm_base_url=selected_profile.llm_base_url,
        llm_api_key=selected_profile.llm_api_key,
        selected_llm_profile_id=selected_id,
        llm_profiles_json=to_json([profile.model_dump() for profile in llm_profiles]),
    )
    settings = SettingsRepository(session).update(payload)
    return to_settings_read(settings)


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(session: Session = Depends(get_session)) -> TestConnectionResponse:
    ok, message = await LLMService().test_connection(SettingsRepository(session).get())
    return TestConnectionResponse(ok=ok, message=message)

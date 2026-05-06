from collections.abc import Generator
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine, select

from app.config import get_settings
from app.models.entities import UserSettings


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    if settings.database_url.startswith("sqlite:///"):
        db_path = Path(settings.database_url.replace("sqlite:///", "", 1))
        db_path.parent.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        existing = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
        if existing is None:
            session.add(
                UserSettings(
                    id=1,
                    llm_provider=settings.default_llm_provider,
                    llm_model=settings.default_llm_model,
                    llm_base_url=settings.default_llm_base_url,
                    system_prompt=settings.default_system_prompt,
                )
            )
            session.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


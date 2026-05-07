from collections.abc import Generator
from pathlib import Path

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine, select

from app.config import get_settings
from app.models.entities import UserSettings


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def _migrate_user_settings_table() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info('usersettings')")).fetchall()
        existing_names = {str(column[1]) for column in columns}
        required_columns = {
            "llm_profiles_json": "TEXT NOT NULL DEFAULT '[]'",
            "selected_llm_profile_id": "TEXT NOT NULL DEFAULT 'default'",
            "ui_theme": "TEXT NOT NULL DEFAULT 'device'",
        }
        for name, definition in required_columns.items():
            if name not in existing_names:
                connection.execute(text(f"ALTER TABLE usersettings ADD COLUMN {name} {definition}"))


def init_db() -> None:
    if settings.database_url.startswith("sqlite:///"):
        db_path = Path(settings.database_url.replace("sqlite:///", "", 1))
        db_path.parent.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)
    _migrate_user_settings_table()
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

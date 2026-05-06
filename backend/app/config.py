from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    app_name: str = "Local AI Knowledge Space"
    app_env: str = "development"
    database_url: str = "sqlite:///./app/data/app.db"
    upload_dir: Path = Path("./app/data/uploads")
    chroma_dir: Path = Path("./app/data/chroma")
    frontend_origin: str = "http://localhost:3000"
    default_llm_provider: str = "ollama"
    default_llm_model: str = "llama3.1"
    default_llm_base_url: str = "http://localhost:11434/v1"
    default_system_prompt: str = (
        "You are a precise research assistant. Answer with grounded citations from provided context."
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> AppSettings:
    settings = AppSettings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.chroma_dir.mkdir(parents=True, exist_ok=True)
    return settings


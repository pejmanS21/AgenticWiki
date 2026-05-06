from pydantic import BaseModel, Field


class SettingsRead(BaseModel):
    llm_provider: str
    llm_model: str
    llm_base_url: str
    llm_api_key: str = ""
    embedding_provider: str
    embedding_model: str
    system_prompt: str


class SettingsUpdate(BaseModel):
    llm_provider: str = Field(pattern="^(ollama|openai|openai-compatible)$")
    llm_model: str
    llm_base_url: str = ""
    llm_api_key: str = ""
    embedding_provider: str = "local-hash"
    embedding_model: str = "hash-384"
    system_prompt: str


class TestConnectionResponse(BaseModel):
    ok: bool
    message: str


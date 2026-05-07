from pydantic import BaseModel, Field


class LLMProfile(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    llm_provider: str = Field(pattern="^(ollama|openai|openai-compatible)$")
    llm_model: str = Field(min_length=1)
    llm_base_url: str = ""
    llm_api_key: str = ""


class SettingsRead(BaseModel):
    llm_provider: str
    llm_model: str
    llm_base_url: str
    llm_api_key: str = ""
    llm_profiles: list[LLMProfile]
    selected_llm_profile_id: str
    ui_theme: str
    embedding_provider: str
    embedding_model: str
    system_prompt: str


class SettingsUpdate(BaseModel):
    llm_provider: str = Field(pattern="^(ollama|openai|openai-compatible)$")
    llm_model: str
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_profiles: list[LLMProfile] = Field(default_factory=list)
    selected_llm_profile_id: str = "default"
    ui_theme: str = Field(default="device", pattern="^(light|dark|device)$")
    embedding_provider: str = "local-hash"
    embedding_model: str = "hash-384"
    system_prompt: str


class TestConnectionResponse(BaseModel):
    ok: bool
    message: str

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ANIRA Career Intelligence API"
    app_version: str = "0.1.0"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.4-mini"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    max_upload_mb: int = Field(default=5, ge=1, le=20)

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()

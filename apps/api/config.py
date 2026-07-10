from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    anthropic_api_key: str = ""
    app_env: str = "development"
    api_port: int = 8000

    # Comma-separated list of allowed CORS origins for the web frontend.
    # Local dev default covers the Vite dev server (5173) and an alt port (3000).
    # For a deployed demo, set CORS_ORIGINS to the frontend origin(s), e.g.
    # CORS_ORIGINS=https://sentineliq.vercel.app
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    session_ttl_hours: int = 8
    session_db_path: str = "./sentineliq.db"

    classifier_model: str = "claude-haiku-4-5-20251001"
    nlq_model: str = "claude-sonnet-4-6"
    action_model: str = "claude-sonnet-4-6"
    mock_llm: bool = False


settings = Settings()

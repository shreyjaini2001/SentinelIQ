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

    session_ttl_hours: int = 8
    session_db_path: str = "./sentineliq.db"

    classifier_model: str = "claude-haiku-4-5-20251001"
    nlq_model: str = "claude-sonnet-4-6"
    action_model: str = "claude-sonnet-4-6"
    mock_llm: bool = False


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str          # legacy HS256 secret (kept as fallback)
    supabase_jwt_jwk: str             # EC public key in JWK JSON (ES256)

    # OpenRouter
    openrouter_api_key: str

    # App
    app_env: str = "development"
    app_name: str = "BizKPI API"
    app_version: str = "1.0.0"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()  # type: ignore[call-arg]

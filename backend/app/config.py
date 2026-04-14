from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bot_token: str
    admin_ids: str = ""

    database_url: str
    redis_url: str = "redis://redis:6379"

    yukassa_shop_id: str
    yukassa_secret_key: str

    bitrefill_api_key: str
    reloadly_client_id: str = ""
    reloadly_client_secret: str = ""

    encryption_key: str

    webapp_url: str = "https://atlasnumberone.netlify.app"

    rate_update_interval: int = 300
    rate_smoothing_factor: float = 0.05
    bitrefill_markup: float = 1.015
    selling_markup: float = 1.30
    min_margin: float = 0.20

    class Config:
        env_file = ".env"


settings = Settings()

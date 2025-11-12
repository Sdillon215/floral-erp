from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import find_dotenv, load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


def _load_environment() -> None:
    repo_root_env = Path(__file__).resolve().parents[3] / ".env"

    if repo_root_env.exists():
        load_dotenv(repo_root_env)
        return

    discovered_env: Optional[str] = find_dotenv(filename=".env", usecwd=True) or find_dotenv()
    if discovered_env:
        load_dotenv(discovered_env)


_load_environment()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", case_sensitive=False, extra="ignore")

    database_url: str
    secret_key: str = "dev_secret_key_change_me"
    access_token_expire_minutes: int = 60 * 24
    sqlalchemy_echo: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


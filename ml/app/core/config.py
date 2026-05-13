from pydantic_settings import BaseSettings
from functools import lru_cache


class _Settings(BaseSettings):
    BACKEND_URL: str = "http://backend:8001/api/v1"

    TOKEN_HUGGING_FACE: str = "dAbzW_TduOkAkFbmmqA_hwQqsFGgrfsdi_pEq"

    PROGRESS_URL = f"{BACKEND_URL}/progress"
    PREDICTION_URL = f"{BACKEND_URL}/prediction"

    class Config:
        env_file = ".env.local"


@lru_cache
def __get_settings__():
    return _Settings()


settings: _Settings = __get_settings__()

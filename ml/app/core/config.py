from pydantic_settings import BaseSettings
from functools import lru_cache


class _Settings(BaseSettings):
    BACKEND_URL: str = "http://backend:8000/api/v1"

    TOKEN_HUGGING_FACE: str = "dAbzW_TduOkAkFbmmqA_hwQqsFGgrfsdi_pEq"

    @property
    def POST_PROGRESS_URL(self) -> str:
        return f"{self.BACKEND_URL}/train/post_progress"

    @property
    def GET_FILES_URL(self) -> str:
        return f"{self.BACKEND_URL}/train/get_files"

    @property
    def POST_FILE_URL(self) -> str:
        return f"{self.BACKEND_URL}/train/post_file"

    class Config:
        env_file = ".env.local"


@lru_cache
def __get_settings__():
    return _Settings()


settings: _Settings = __get_settings__()

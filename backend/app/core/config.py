from pydantic_settings import BaseSettings
from functools import lru_cache


class _Settings(BaseSettings):
    ML_URL: str = "http://ml:8001/api/v1"

    # Основная БД
    DB_HOST: str = "host.docker.internal"
    DB_PORT: int = 5432
    DB_USERNAME: str = "postgres"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "marking-lab"

    # БД для аутентификации
    AUTH_DB_HOST: str = "host.docker.internal"
    AUTH_DB_PORT: int = 5432
    AUTH_DB_USERNAME: str = "postgres"
    AUTH_DB_PASSWORD: str = "password"
    AUTH_DB_NAME: str = "marking-lab-auth"

    # JWT-токены
    USER_JWT_ACCESS_TOKEN_SECRET: str = "w3NWlz4BSf6j6TwwEEXK0pT5yPY4AJzt"
    USER_JWT_ACCESS_TOKEN_EXPIRATION_HOURS: int = 240
    # USER_JWT_REFRESH_TOKEN_SECRET: str = "v4m9mCNqrIjiNdYiarb4SwUBH5mxCe4O"
    # USER_JWT_REFRESH_TOKEN_EXPIRATION_HOURS: int = 720

    TRAIN_JWT_ACCESS_TOKEN_SECRET: str = "r1yGRupzNCNGwEstj5fL0c5NFfjtON2B"

    # Хранилище файлов
    STORAGE_PATH: str = "./projects"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def AUTH_DATABASE_URL(self) -> str:
        return f"postgresql://{self.AUTH_DB_USERNAME}:{self.AUTH_DB_PASSWORD}@{self.AUTH_DB_HOST}:{self.AUTH_DB_PORT}/{self.AUTH_DB_NAME}"

    class Config:
        env_file = ".env.local"


@lru_cache
def __get_settings__():
    return _Settings()


settings: _Settings = __get_settings__()

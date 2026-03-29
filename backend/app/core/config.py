from pydantic_settings import BaseSettings
from functools import lru_cache


class __Settings__(BaseSettings):
    ML_URL: str

    # Основная БД
    DB_HOST: str
    DB_PORT: int
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_NAME: str

    # БД для аутентификации
    AUTH_DB_HOST: str
    AUTH_DB_PORT: int
    AUTH_DB_USERNAME: str
    AUTH_DB_PASSWORD: str
    AUTH_DB_NAME: str

    # JWT-токены
    JWT_ACCESS_TOKEN_SECRET: str
    JWT_ACCESS_TOKEN_EXPIRATION_HOURS: int
    JWT_REFRESH_TOKEN_SECRET: str
    JWT_REFRESH_TOKEN_EXPIRATION_HOURS: int

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def AUTH_DATABASE_URL(self) -> str:
        return f"postgresql://{self.AUTH_DB_USERNAME}:{self.AUTH_DB_PASSWORD}@{self.AUTH_DB_HOST}:{self.AUTH_DB_PORT}/{self.AUTH_DB_NAME}"

    class Config:
        env_file = ".env.local"


# Не выгружаем из памяти
@lru_cache
def __get_settings__():
    return __Settings__()


settings: __Settings__ = __get_settings__()

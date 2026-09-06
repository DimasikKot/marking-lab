from pydantic_settings import BaseSettings
from functools import lru_cache


class _Settings(BaseSettings):
    BACKEND_URL: str = "http://backend:8000/api/v1"

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    HF_TOKEN: str = "hf_xxxxx"

    TRAIN_LOGGING_STEPS: int = 8
    # Количесво шагов, необходимое для обратной связи обучения модели

    @property
    def GET_TRAINING_FILES_URL(self) -> str:
        return f"{self.BACKEND_URL}/ml/train/get_files"

    @property
    def POST_PROGRESS_URL(self) -> str:
        return f"{self.BACKEND_URL}/ml/train/post_progress"

    @property
    def GET_PREDICTION_FILES_URL(self) -> str:
        return f"{self.BACKEND_URL}/ml/predict/get_files"

    @property
    def POST_FILE_URL(self) -> str:
        return f"{self.BACKEND_URL}/ml/predict/post_file"

    MIN_EPOCHS: int = 1
    MAX_EPOCHS: int = 10

    MIN_BATCH_SIZE: int = 8
    MAX_BATCH_SIZE: int = 16

    MIN_LEARNING_RATE: float = 1e-5
    MAX_LEARNING_RATE: float = 1e-3

    MIN_TESTING_SIZE: float = 0.1
    MAX_TESTING_SIZE: float = 0.9

    MIN_MAX_LINE_LENGHT: int = 32
    MAX_MAX_LINE_LENGHT: int = 512

    MAX_TRAINING_LINES_FOR_FILE: int = 2000
    MAX_PREDICTION_LINES_FOR_FILE: int = 2000

    class Config:
        env_file = ".env.local"


@lru_cache
def __get_settings__():
    return _Settings()


settings: _Settings = __get_settings__()

import json
from fastapi import APIRouter, BackgroundTasks, Form

from ml.app.core.config import settings
from ml.app.services.model_router import model_train

router = APIRouter()


@router.post("/train")
async def train_ner(
    parameters: str = Form(...),
    train_access_token: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    # Тренируем модель
    params_dict: dict = json.loads(parameters)
    return_parameters = model_router(
        EPOCHS=int(params_dict.get("Эпохи", 2)),
        BATCH_SIZE=int(params_dict.get("Размер батчей", 16)),
        BASE_MODEL=params_dict.get("Базовая модель", "albert-base-v2"),
        LEARNING_RATE=float(params_dict.get("Скорость обучения", 2e-5)),
        TESTING_SIZE=float(params_dict.get("Размер тренировочного набора", 0.8)),
        MAX_LINE_LENGHT=int(params_dict.get("Максимальная длина предложения", 128)),
        train_access_token=train_access_token,
        background_tasks=background_tasks,
    )

    return {
        "parameters": json.dumps(return_parameters),
    }


# router
def model_router(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    train_access_token: str,
    background_tasks: BackgroundTasks,
) -> dict:
    EPOCHS = max(settings.MIN_EPOCHS, EPOCHS)
    EPOCHS = min(settings.MAX_EPOCHS, EPOCHS)

    BATCH_SIZE = max(settings.MIN_BATCH_SIZE, BATCH_SIZE)
    BATCH_SIZE = min(settings.MAX_BATCH_SIZE, BATCH_SIZE)

    LEARNING_RATE = max(settings.MIN_LEARNING_RATE, LEARNING_RATE)
    LEARNING_RATE = min(settings.MAX_LEARNING_RATE, LEARNING_RATE)

    TESTING_SIZE = max(settings.MIN_TESTING_SIZE, TESTING_SIZE)
    TESTING_SIZE = min(settings.MAX_TESTING_SIZE, TESTING_SIZE)

    MAX_LINE_LENGHT = max(settings.MIN_MAX_LINE_LENGHT, MAX_LINE_LENGHT)
    MAX_LINE_LENGHT = min(settings.MAX_MAX_LINE_LENGHT, MAX_LINE_LENGHT)

    background_tasks.add_task(
        model_train,
        EPOCHS,
        BATCH_SIZE,
        BASE_MODEL,
        LEARNING_RATE,
        TESTING_SIZE,
        MAX_LINE_LENGHT,
        train_access_token,
    )

    return_parameters = {
        "Эпохи": EPOCHS,
        "Размер батчей": BATCH_SIZE,
        "Базовая модель": BASE_MODEL,
        "Скорость обучения": LEARNING_RATE,
        "Размер тренировочного набора": TESTING_SIZE,
        "Максимальная длина предложения": MAX_LINE_LENGHT,
    }

    return return_parameters

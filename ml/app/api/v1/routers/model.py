import json
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from multiprocessing import Process

from app.services.model_router import model_router
from app.services.model_files import get_all_sentences

router = APIRouter()


@router.post("/train")
async def train_ner(
    parameters: str = Form(...),
    files: list[UploadFile] = File(...),
):
    params = json.loads(parameters)
    epochs = int(params.get("Эпохи", 2))
    batch_size = int(params.get("Размер батчей", 16))
    # distilbert-base-uncased
    base_model = str(params.get("Базовая модель", "albert-base-v2"))
    learning_rate = float(params.get("Скорость обучения", 2e-5))
    testing_size = float(params.get("Размер тренировочного набора", 0.8))
    max_line_lenght = int(params.get("Максимальная длина предложения", 128))

    # Получаем предложения
    all_sentences = await get_all_sentences(files)
    if len(all_sentences) == 0:
        raise HTTPException(status_code=400, detail="Выберите файлы для обучения")

    # Тренируем модель
    return_metrics, train_loss_plot = model_router(
        EPOCHS=epochs,
        BATCH_SIZE=batch_size,
        BASE_MODEL=base_model,
        LEARNING_RATE=learning_rate,
        TESTING_SIZE=testing_size,
        MAX_LINE_LENGHT=max_line_lenght,
        all_sentences=all_sentences,
    )

    return {
        "parameters": json.dumps(parameters),
        "metrics": json.dumps(return_metrics),
        "graphs": json.dumps(
            {
                "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                # "Потери на валидации": f"data:image/png;base64,{validation_loss_plot}",
                # "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
            }
        ),
    }

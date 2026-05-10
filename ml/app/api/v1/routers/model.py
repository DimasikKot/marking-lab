import json
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.model_router import model_router
from app.services.model_files import get_all_sentences

router = APIRouter()


@router.post("/train")
async def train_ner(
    parameters: str = Form(...),
    files: list[UploadFile] = File(...),
):
    # Получаем предложения
    all_sentences = await get_all_sentences(files)
    if len(all_sentences) == 0:
        raise HTTPException(status_code=400, detail="Выберите файлы для обучения")

    # Тренируем модель
    params_dict: dict = json.loads(parameters)
    return_parameters, return_metrics, train_loss_plot = model_router(
        EPOCHS=int(params_dict.get("Эпохи", 2)),
        BATCH_SIZE=int(params_dict.get("Размер батчей", 16)),
        # distilbert-base-uncased
        BASE_MODEL=params_dict.get("Базовая модель", "albert-base-v2"),
        LEARNING_RATE=float(params_dict.get("Скорость обучения", 2e-5)),
        TESTING_SIZE=float(params_dict.get("Размер тренировочного набора", 0.8)),
        MAX_LINE_LENGHT=int(params_dict.get("Максимальная длина предложения", 128)),
        all_sentences=all_sentences,
    )

    return {
        "parameters": json.dumps(return_parameters),
        "metrics": json.dumps(return_metrics),
        "graphs": json.dumps(
            {
                "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                # "Потери на валидации": f"data:image/png;base64,{validation_loss_plot}",
                # "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
            }
        ),
    }

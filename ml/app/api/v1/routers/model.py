import json
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from multiprocessing import Process, Queue
import asyncio

from app.services.model_router import model_router
from app.services.model_files import get_all_sentences

router = APIRouter()


async def wait_result(queue: Queue):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, queue.get)


def train_worker(queue, **kwargs):
    try:  # в случае ошибки
        return_metrics, train_loss_plot = model_router(**kwargs)
        queue.put({"metrics": return_metrics, "train_loss_plot": train_loss_plot})
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Ошибка: {error}")


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
    queue = Queue()

    params_dict: dict = json.loads(parameters)
    p = Process(
        target=train_worker,
        kwargs=dict(
            queue=queue,
            EPOCHS=int(params_dict.get("Эпохи", 2)),
            BATCH_SIZE=int(params_dict.get("Размер батчей", 16)),
            # distilbert-base-uncased
            BASE_MODEL=params_dict.get("Базовая модель", "albert-base-v2"),
            LEARNING_RATE=float(params_dict.get("Скорость обучения", 2e-5)),
            TESTING_SIZE=float(params_dict.get("Размер тренировочного набора", 0.8)),
            MAX_LINE_LENGHT=int(params_dict.get("Максимальная длина предложения", 128)),
            all_sentences=all_sentences,
        ),
    )
    p.start()

    result = await wait_result(queue)

    return {
        "parameters": parameters,
        "metrics": json.dumps(result["metrics"]),
        "graphs": json.dumps(
            {
                "Потери на обучении": f"data:image/png;base64,{result["train_loss_plot"]}",
                # "Потери на валидации": f"data:image/png;base64,{validation_loss_plot}",
                # "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
            }
        ),
    }

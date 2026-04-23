import io
import json
from typing import Any
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse


router: APIRouter = APIRouter()


@router.post("/train")
async def post_train_ner(
    parameters: str = Form(
        {"model": "ner", "epochs": 3, "batch_size": 4, "learning_rate": 0.001}
    ),
    files: list[UploadFile] = File(...),
):
    # парсим параметры (они придут строкой)
    params_dict: dict[str, Any] = json.loads(parameters)

    combined_content = ""

    # объединяем содержимое файлов
    for file in files:
        content = await file.read()
        combined_content += content.decode("utf-8") + "\n"

    # делаем "файл" из строки
    result_file = io.BytesIO(combined_content.encode("utf-8"))

    return StreamingResponse(
        result_file,
        media_type="text/plain",
        headers={
            "Content-Disposition": "attachment; filename=combined.txt",
            "X-Metrics": json.dumps(params_dict),
        },
    )

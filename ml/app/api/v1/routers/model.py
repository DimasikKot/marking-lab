import io
import json
import base64
from typing import Any
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse
import matplotlib.pyplot as plt
import numpy as np

router: APIRouter = APIRouter()


@router.post("/train")
async def post_train_ner(
    parameters: str = Form(
        {"model": "ner", "epochs": 3, "batch_size": 4, "learning_rate": 0.001}
    ),
    files: list[UploadFile] = File(...),
):
    # парсим параметры
    params_dict: dict[str, Any] = json.loads(parameters)

    # читаем файлы
    combined_content = ""
    for file in files:
        content = await file.read()
        combined_content += content.decode("utf-8") + "\n"

    # создаем "модель" (просто текстовый файл)
    result_file = io.BytesIO(combined_content.encode("utf-8"))

    # Генерируем случайный график 1 (train loss)
    fig1, ax1 = plt.subplots(figsize=(6, 4))
    epochs = np.arange(1, params_dict.get("epochs", 3) + 1)
    loss = np.random.uniform(0.5, 2.0, len(epochs)) * np.exp(-epochs * 0.5)
    ax1.plot(epochs, loss, "b-o", linewidth=2, markersize=8)
    ax1.set_title("Training Loss")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.grid(True, alpha=0.3)

    img1_buffer = io.BytesIO()
    plt.savefig(img1_buffer, format="png", dpi=80, bbox_inches="tight")
    img1_base64 = base64.b64encode(img1_buffer.getvalue()).decode("utf-8")
    plt.close()

    # Генерируем график 2 (confusion matrix / heatmap)
    fig2, ax2 = plt.subplots(figsize=(6, 5))
    data = np.random.rand(5, 5)
    im = ax2.imshow(data, cmap="hot", interpolation="nearest")
    ax2.set_title("Confusion Matrix")
    ax2.set_xlabel("Predicted")
    ax2.set_ylabel("Actual")
    plt.colorbar(im, ax=ax2)

    img2_buffer = io.BytesIO()
    plt.savefig(img2_buffer, format="png", dpi=80, bbox_inches="tight")
    img2_base64 = base64.b64encode(img2_buffer.getvalue()).decode("utf-8")
    plt.close()

    # Возвращаем модель с графиками в headers
    return StreamingResponse(
        result_file,
        media_type="text/plain",
        headers={
            "Content-Disposition": "attachment; filename=combined.txt",
            "X-Metrics": json.dumps(params_dict),
            # Проверить можно на https://products.aspose.app/imaging/ru/conversion/base64-to-image
            "X-Graphs": json.dumps(
                {
                    # Добавляем правильный префикс для PNG изображения
                    # Именно с ним сайт-конвертер точно распознает данные
                    "train_loss": f"data:image/png;base64,{img1_base64}",
                    "heatmap": f"data:image/png;base64,{img2_base64}",
                }
            ),
        },
    )

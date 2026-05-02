import io
import json
import zipfile
import base64
import tempfile
import logging
from pathlib import Path
from typing import List, Dict

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse
import matplotlib.pyplot as plt
import numpy as np

from app.services.model import (
    NERModel,
    build_zip_model,
    extract_labels_from_sentences,
    parse_csv_from_text,
    plot_confusion_matrix,
    plot_loss,   # <-- переименованная функция
    prepare_dataset,
    MAX_LENGTH,
    MODEL_NAME,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/train")
async def train_ner(
    parameters: str = Form(...),
    files: list[UploadFile] = File(...),
):
    params = json.loads(parameters)
    logger.info(f"Training parameters: {params}")

    # Собираем все предложения из загруженных CSV-файлов
    all_sentences = []
    for file in files:
        content = await file.read()
        text = content.decode("utf-8")
        # Теперь используем правильный парсер
        all_sentences.extend(parse_csv_from_text(text))

    if not all_sentences:
        return StreamingResponse(
            io.BytesIO(b"no data"),
            media_type="text/plain",
            status_code=400,
        )

    label_list = extract_labels_from_sentences(all_sentences)

    # Разбиение train/validation (80/20)
    split_idx = int(len(all_sentences) * 0.8)
    train_sentences = all_sentences[:split_idx]
    eval_sentences = all_sentences[split_idx:]

    epochs = int(params.get("epochs", 5))
    batch_size = int(params.get("batch_size", 16))
    learning_rate = float(params.get("learning_rate", 2e-5))

    ner = NERModel(MODEL_NAME, label_list)
    tokenizer = ner.tokenizer
    label2id = ner.label2id

    train_dataset = prepare_dataset(train_sentences, tokenizer, label2id, MAX_LENGTH)
    eval_dataset = prepare_dataset(eval_sentences, tokenizer, label2id, MAX_LENGTH) if eval_sentences else None

    with tempfile.TemporaryDirectory() as tmpdir:
        result = ner.train(
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            output_dir=tmpdir,
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
        )

        eval_metrics = result["eval_metrics"]
        metrics = {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
        }
        if eval_metrics:
            metrics.update({
                "accuracy": eval_metrics.get("eval_accuracy"),
                "f1": eval_metrics.get("eval_f1"),
                "precision": eval_metrics.get("eval_precision"),
                "recall": eval_metrics.get("eval_recall"),
            })

        loss_plot = plot_loss(result["train_loss"])
        cm_plot = plot_confusion_matrix(label_list)

        zip_data = build_zip_model(tmpdir)

    return StreamingResponse(
        io.BytesIO(zip_data),
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=ner_model.zip",
            "X-Metrics": json.dumps(metrics),
            "X-Graphs": json.dumps({
                "train_loss": f"data:image/png;base64,{loss_plot}",
                "heatmap": f"data:image/png;base64,{cm_plot}",
            }),
        },
    )
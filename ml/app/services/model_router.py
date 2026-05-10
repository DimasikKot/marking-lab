import io
import json
import tempfile
import numpy as np
from datasets import Dataset

from app.services.model_class import (
    Trainer,
    TrainingArguments,
    NERModel,
)
from app.services.model_metrics import loss_plot
from app.services.model_files import (
    extract_labels_from_sentences,
    prepare_dataset,
)


def model_router(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    all_sentences: list[list[dict]],
) -> tuple[dict, dict, str | None]:
    # Список уникальных меток
    label_list = extract_labels_from_sentences(all_sentences)

    # Инициализируем модель
    ner = NERModel(BASE_MODEL, label_list)
    tokenizer = ner.tokenizer
    label2id = ner.label2id

    # Разделяем набор на тренировочный и валидационный
    split_idx = int(len(all_sentences) * TESTING_SIZE)
    train_sentences = all_sentences[:split_idx]
    validation_sentences = all_sentences[split_idx:]

    train_dataset: Dataset = prepare_dataset(
        train_sentences, tokenizer, label2id, MAX_LINE_LENGHT
    )
    validation_dataset: Dataset | None = (
        prepare_dataset(validation_sentences, tokenizer, label2id, MAX_LINE_LENGHT)
        if validation_sentences
        else None
    )

    result = ner.train(
        train_dataset=train_dataset,
        eval_dataset=validation_dataset,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
    )

    # Метрики валидационной выборки
    validation_metrics: dict = result["eval_metrics"]
    return_metrics = {}
    labels_metrics = {}
    if validation_metrics:
        return_metrics = {
            "Точность (accuracy)": validation_metrics.get("eval_accuracy"),
            "Точность (precision)": validation_metrics.get("eval_precision"),
            "Полнота (recall)": validation_metrics.get("eval_recall"),
            "F1-мера": validation_metrics.get("eval_f1"),
        }

        # Метрики по классам (если они есть в результате)
        for key, value in validation_metrics.items():
            # обычно классовые метрики идут как:
            # "eval_PER", "eval_ORG", "eval_LOC" и т.д.
            if key.startswith("eval_") and isinstance(value, dict):
                label_name = key.replace("eval_", "")

                labels_metrics[label_name] = {
                    "Точность": value.get("precision"),
                    "Полнота": value.get("recall"),
                    "F1-мера": value.get("f1"),
                }

    print(return_metrics)
    print(labels_metrics)

    train_loss_plot = loss_plot("Потери на обучении", result["train_loss"])
    # validation_loss_plot = loss_plot(
    #     "Потери на валидации", result["validation_loss"]
    # )
    # confusion_matrix_plot = plot_confusion_matrix(label_list)

    # TODO Предсказания

    return_parameters = {
        "Эпохи": EPOCHS,
        "Размер батчей": BATCH_SIZE,
        "Базовая модель": BASE_MODEL,
        "Скорость обучения": LEARNING_RATE,
        "Размер тренировочного набора": TESTING_SIZE,
        "Максимальная длина предложения": MAX_LINE_LENGHT,
    }

    return return_parameters, return_metrics, train_loss_plot

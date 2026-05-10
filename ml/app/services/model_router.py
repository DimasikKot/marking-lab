import json
import tempfile
from datasets import Dataset
from fastapi import BackgroundTasks
import httpx

from app.services.model_class import NERModel
from app.services.model_metrics import loss_plot
from app.services.model_files import (
    extract_labels_from_sentences,
    prepare_dataset,
)


def _model_train(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    project_id: int,
    model_id: int,
    uuid: str,
    all_sentences: list[list[dict]],
):
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

    # Обучаем модель во временном каталоге, чтобы не засорять память
    with tempfile.TemporaryDirectory() as tmpdir:
        result = ner.train(
            train_dataset=train_dataset,
            eval_dataset=validation_dataset,
            output_dir=tmpdir,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            learning_rate=LEARNING_RATE,
            project_id=project_id,
            model_id=model_id,
            uuid=uuid,
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

        print("+" * 100)
        print(return_metrics)
        print(labels_metrics)
        print("+" * 100)

        train_loss_plot = loss_plot("Потери на обучении", result["train_loss"])
        # validation_loss_plot = loss_plot(
        #     "Потери на валидации", result["validation_loss"]
        # )
        # confusion_matrix_plot = plot_confusion_matrix(label_list)

        # TODO Предсказания

        url = f"http://backend:8000/api/v1/projects/{project_id}/models/{model_id}/progress"
        request = {
            "uuid": uuid,
            "progress": 100,
            "metrics": return_metrics,
            "graphs": {
                "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                # "Потери на валидации": f"data:image/png;base64,{validation_loss_plot}",
                # "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
            },
        }

        with httpx.Client() as client:
            client.post(url, json=request)


# router
def model_router(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    project_id: int,
    model_id: int,
    uuid: str,
    all_sentences: list[list[dict]],
    background_tasks: BackgroundTasks,
) -> dict:
    background_tasks.add_task(
        _model_train,
        EPOCHS,
        BATCH_SIZE,
        BASE_MODEL,
        LEARNING_RATE,
        TESTING_SIZE,
        MAX_LINE_LENGHT,
        project_id,
        model_id,
        uuid,
        all_sentences,
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

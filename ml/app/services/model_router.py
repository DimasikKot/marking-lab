import tempfile
import time
from datasets import Dataset
import httpx
import signal

from app.services.model_class import NERModel
from app.core.config import settings
from app.services.model_metrics import loss_plot, plot_confusion_matrix
from app.services.model_prediction import model_predict
from app.services.model_files import (
    extract_labels_from_sentences,
    get_all_sentences,
    prepare_dataset,
)


def model_train(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    train_access_token: str,
):
    # Получаем предложения
    all_sentences = get_all_sentences(train_access_token)
    if len(all_sentences) == 0:
        httpx.post(
            settings.POST_PROGRESS_URL,
            json={"progress": 0, "train_access_token": train_access_token},
            timeout=300,
        )
        raise RuntimeError(f"Нет предложений для обучения")

    # Список уникальных меток
    label_list = extract_labels_from_sentences(all_sentences)

    # Инициализируем модель
    # ====================================================
    class InitTimeout(Exception):
        pass

    def handler(signum, frame):
        raise InitTimeout("Инициализация NERModel превысила 180 секунд")

    signal.signal(signal.SIGALRM, handler)  # type: ignore
    signal.alarm(180)  # type: ignore

    try:
        print("Инициализация NERModel...")
        ner = NERModel(BASE_MODEL, label_list)
        print("Инициализация NERModel завершена")
    finally:
        signal.alarm(0)  # type: ignore
    # ====================================================

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

    httpx.post(
        settings.POST_PROGRESS_URL,
        json={"train_access_token": train_access_token, "progress": 4},
        timeout=300,
    )

    # Обучаем модель во временном каталоге, чтобы не засорять память
    with tempfile.TemporaryDirectory() as tmpdir:
        start_time = time.perf_counter()
        result = ner.train(
            train_dataset=train_dataset,
            eval_dataset=validation_dataset,
            output_dir=tmpdir,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            learning_rate=LEARNING_RATE,
            train_access_token=train_access_token,
        )
        training_time_seconds = time.perf_counter() - start_time

        # Метрики валидационной выборки
        validation_metrics: dict[str, float] = result["eval_metrics"]

        # Получаем истинные и предсказанные метки из результата
        true_labels = result.get("true_labels", [])
        pred_labels = result.get("pred_labels", [])

        return_metrics = {}
        if validation_metrics:
            # Убираем метки из словаря метрик, если они там есть
            clean_metrics = {
                k: v
                for k, v in validation_metrics.items()
                if not k.startswith("eval_true") and not k.startswith("eval_pred")
            }
            return_metrics = {
                "Точность (accuracy)": clean_metrics.get("eval_accuracy"),
                "Точность (precision)": clean_metrics.get("eval_precision"),
                "Полнота (recall)": clean_metrics.get("eval_recall"),
                "F1-мера": clean_metrics.get("eval_f1"),
                "Время обучения (сек)": round(training_time_seconds, 2),
            }

        # print("+" * 100)
        # print(return_metrics)
        # print(f"Всего меток для матрицы ошибок: {len(true_labels)}")
        # print("+" * 100)

        train_loss_plot = loss_plot("Потери на обучении", result["train_loss"])

        # Создаем матрицу ошибок с реальными данными
        confusion_matrix_plot = plot_confusion_matrix(
            label_list, true_labels, pred_labels
        )

        request = {
            "train_access_token": train_access_token,
            "progress": 100,
            "metrics": return_metrics,
            "graphs": {
                "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
            },
        }
        httpx.post(settings.POST_PROGRESS_URL, json=request, timeout=1000)

        try:
            star_predict_time = time.perf_counter()
            model_predict(train_access_token, ner, MAX_LINE_LENGHT, BATCH_SIZE)
            predict_time_seconds = time.perf_counter() - star_predict_time
            return_metrics["Время разметки (сек)"] = round(predict_time_seconds, 2)
        except Exception as error:
            httpx.post(
                settings.POST_PROGRESS_URL,
                json={"progress": 100, "train_access_token": train_access_token},
                timeout=300,
            )

        request = {
            "train_access_token": train_access_token,
            "progress": 200,
            "metrics": return_metrics,
        }
        httpx.post(settings.POST_PROGRESS_URL, json=request, timeout=1000)


def model_router(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
    train_access_token: str,
):
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

    return_parameters = {
        "Эпохи": EPOCHS,
        "Размер батчей": BATCH_SIZE,
        "Базовая модель": BASE_MODEL,
        "Скорость обучения": LEARNING_RATE,
        "Размер тренировочного набора": TESTING_SIZE,
        "Максимальная длина предложения": MAX_LINE_LENGHT,
    }

    response = httpx.post(
        settings.POST_PROGRESS_URL,
        json={
            "progress": 3,
            "train_access_token": train_access_token,
            "parameters": return_parameters,
        },
        timeout=1000,
    )

    if response.status_code != 200:
        raise Exception(response.json()["detail"])

    model_train(
        EPOCHS=EPOCHS,
        BATCH_SIZE=BATCH_SIZE,
        BASE_MODEL=BASE_MODEL,
        LEARNING_RATE=LEARNING_RATE,
        TESTING_SIZE=TESTING_SIZE,
        MAX_LINE_LENGHT=MAX_LINE_LENGHT,
        train_access_token=train_access_token,
    )

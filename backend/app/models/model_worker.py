# accelerate==1.13.0
# datasets==4.8.5
# httpx==0.28.1
# matplotlib==3.10.9
# numpy==2.4.4
# pydantic-settings==2.14.0
# python-multipart==0.0.27
# redis==7.4.0
# seqeval==1.2.2
# transformers==5.7.0

from pathlib import Path
import csv
import io
import tempfile
import numpy as np
import base64
import matplotlib.pyplot as plt
from typing import Any, cast
from seqeval.metrics import classification_report, f1_score, accuracy_score
from seqeval.scheme import IOB2
from sklearn.metrics import confusion_matrix
from datasets import Dataset
import time
import gc
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    TrainerCallback,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
)

TRAIN_LOGGING_STEPS: int = 8

EPOCHS: int = 2
BATCH_SIZE: int = 128
BASE_MODEL: str = "albert-base-v2"
LEARNING_RATE: float = 0.00002
TRAINING_SIZE: float = 0.8
MAX_LINE_LENGHT: int = 128

BASE_DIR = Path(__file__).resolve().parent
TRAINING_FILES_PATHS = [
    BASE_DIR / "47.csv",
]

PREDICTING_FILES_PATHS = [
    BASE_DIR / "54.csv",
]


class ProgressCallback(TrainerCallback):
    def __init__(
        self,
        total_epochs: int,
    ):
        self.total_epochs = total_epochs

        self.last_progress = -1

    def _send_progress(self, progress: int, metrics: dict):
        try:
            metrics_data = {
                "F1-мера": metrics.get("f1"),
                "Потери на обучающей выборке": metrics.get("train_loss"),
                "Потери на валидационной выборке": metrics.get("eval_loss"),
                "Полнота (recall)": metrics.get("recall"),
                "Скорость обучения": metrics.get("learning_rate"),
                "Точность (accuracy)": metrics.get("accuracy"),
                "Точность (precision)": metrics.get("precision"),
            }

            if "epoch" in metrics:
                metrics_data["Эпоха"] = f'{metrics["epoch"]} / {self.total_epochs}'

            metrics_data = {k: v for k, v in metrics_data.items() if v is not None}

            print({"progress": progress, "metrics": metrics_data})

            return True

        except Exception as _:
            return False

    def _calculate_progress(self, state):
        """
        Прогресс по step, а не по epoch.
        """

        if state.max_steps and state.max_steps > 0:
            progress = int((state.global_step / state.max_steps) * (99 - 5)) + 5  # 5-99
            progress = min(99, max(5, progress))
        else:
            progress = 0

        return progress

    def on_log(self, args, state, control, logs=None, **kwargs):
        """
        Вызывается постоянно во время train.
        """

        if not logs:
            return control

        progress = self._calculate_progress(state)

        # не спамим одинаковый progress
        if progress == self.last_progress:
            return control

        self.last_progress = progress

        metrics = {}

        # TRAIN METRICS
        if "loss" in logs:
            metrics["train_loss"] = float(logs["loss"])

        if "learning_rate" in logs:
            metrics["learning_rate"] = float(logs["learning_rate"])

        if "epoch" in logs:
            metrics["epoch"] = float(logs["epoch"])

        # print("^" * 100)
        # print("ON LOG")
        # print(logs)
        # print("^" * 100)

        success = self._send_progress(
            progress=progress,
            metrics=metrics,
        )

        if not success:
            print(f"Ошибка отправки прогресса, остановка модели")
            raise RuntimeError(f"Не удалось отправить прогресс")

        return control

    def on_evaluate(self, args, state, control, metrics=None, **kwargs):
        if not metrics:
            return

        progress = self._calculate_progress(state)

        eval_metrics = {}

        if "eval_loss" in metrics:
            eval_metrics["eval_loss"] = float(metrics["eval_loss"])

        if "eval_accuracy" in metrics:
            eval_metrics["accuracy"] = float(metrics["eval_accuracy"])

        if "eval_precision" in metrics:
            eval_metrics["precision"] = float(metrics["eval_precision"])

        if "eval_recall" in metrics:
            eval_metrics["recall"] = float(metrics["eval_recall"])

        if "eval_f1" in metrics:
            eval_metrics["f1"] = float(metrics["eval_f1"])

        # print("^" * 100)
        # print("ON EVALUATE")
        # print(metrics)
        # print("^" * 100)

        self._send_progress(
            progress=progress,
            metrics=eval_metrics,
        )

    # def on_train_end(self, args, state, control, **kwargs):
    #     self._send_progress(
    #         progress=100,
    #         metrics={"status": "completed"},
    #     )


# Метрики
def compute_metrics(p, label_list):
    predictions, labels = p
    predictions = np.argmax(predictions, axis=2)

    true_predictions = [
        [label_list[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [label_list[l] for (_, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]

    # Сохраняем метки в глобальную переменную или атрибут trainer
    # Самый простой способ - вернуть их вместе с метриками
    report = classification_report(
        true_labels,
        true_predictions,
        scheme=IOB2,
        output_dict=True,
    )
    report_dict = cast(dict[str, Any], report)
    f1 = f1_score(true_labels, true_predictions, scheme=IOB2)
    acc = accuracy_score(true_labels, true_predictions)

    # Возвращаем метрики И метки
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": report_dict["micro avg"]["precision"],
        "recall": report_dict["micro avg"]["recall"],
        "true_labels": true_labels,  # добавляем
        "pred_labels": true_predictions,  # добавляем
    }


# График потерь
def loss_plot(title: str, loss_list: list) -> str:
    fig, ax = plt.subplots(figsize=(6, 4))
    if loss_list:
        epochs = [item[0] for item in loss_list if item[0] is not None]
        losses = [item[1] for item in loss_list if item[0] is not None]
        if epochs:
            ax.plot(epochs, losses, "b-o", linewidth=2, markersize=8)
    ax.set_title(title)
    ax.set_xlabel("Эпохи")
    ax.set_ylabel("Потери")
    ax.grid(True, alpha=0.3)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# График матрицы ошибок
def plot_confusion_matrix(
    label_list: list[str], true_labels: list, pred_labels: list
) -> str:
    """
    Создает и возвращает base64 изображение матрицы ошибок

    Args:
        label_list: Список всех меток
        true_labels: Истинные метки для валидационной выборки
        pred_labels: Предсказанные метки модели
    """
    # Фильтруем метки, исключая "O"
    labels = [l for l in label_list if l != "O"]
    size = len(labels)

    if size == 0:
        # Создаем пустой график, если нет меток
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.text(
            0.5, 0.5, "Нет меток для отображения", ha="center", va="center", fontsize=14
        )
        ax.set_title("Матрица ошибок")
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
        plt.close(fig)
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    # Создаем mapping меток в индексы
    # label_to_idx = {label: idx for idx, label in enumerate(labels)}

    # Фильтруем предсказания, исключая "O"
    filtered_true = []
    filtered_pred = []
    for true, pred in zip(true_labels, pred_labels):
        if true != "O" and pred != "O":
            filtered_true.append(true)
            filtered_pred.append(pred)

    # Строим матрицу ошибок
    cm = confusion_matrix(filtered_true, filtered_pred, labels=labels)

    # Создаем график
    fig, ax = plt.subplots(figsize=(10, 8))

    # Отображаем матрицу
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    plt.colorbar(im, ax=ax)

    # Настраиваем оси
    ax.set_xticks(np.arange(size))
    ax.set_yticks(np.arange(size))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_yticklabels(labels)

    # Добавляем значения в ячейки
    for i in range(size):
        for j in range(size):
            text = ax.text(
                j,
                i,
                cm[i, j],
                ha="center",
                va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black",
            )

    ax.set_xlabel("Предсказанные метки")
    ax.set_ylabel("Истинные метки")
    ax.set_title(f"Матрица ошибок (всего: {len(filtered_true)} примеров)")

    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    plt.close(fig)

    return base64.b64encode(buf.getvalue()).decode("utf-8")


# Константы по умолчанию
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Класс NER модели
class NERModel:
    def __init__(self, model_name: str, label_list: list[str]):
        self.model_name = model_name
        self.label_list = label_list  # список уникальных меток
        self.label2id = {
            l: i for i, l in enumerate(label_list)
        }  # преобразование метки в число
        self.id2label = {
            i: l for l, i in self.label2id.items()
        }  # преобразование числа в метку

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_name, use_fast=True
        )  # преобразование текста в числа
        self.model = AutoModelForTokenClassification.from_pretrained(  # инициализируем предобученную модель
            model_name,  # название модели
            num_labels=len(label_list),  # сколько всего типов меток
            id2label=self.id2label,  # словарь число-метка
            label2id=self.label2id,  # cловарь метка-число
        ).to(
            DEVICE
        )  # используем GPU
        self.data_collator = DataCollatorForTokenClassification(
            self.tokenizer, padding="longest"
        )  # собирает примеры в батчи, выравнивает метки по самому длинному примеру батча

    def train(
        self,
        train_dataset,
        epochs: int,
        batch_size: int,
        learning_rate: float,
        eval_dataset=None,
        output_dir: str = "./models",
    ) -> dict:
        training_args = TrainingArguments(  # параметры выбираемые для обучения модели
            output_dir=output_dir,
            eval_steps=10,
            eval_strategy=(
                "epoch" if eval_dataset else "no"
            ),  # оценка модели в конце каждой эпохи
            save_strategy="epoch",
            learning_rate=learning_rate,  # скорость обучения
            per_device_train_batch_size=batch_size,  # размер батча для тренировочной выборки
            per_device_eval_batch_size=batch_size,  # размер батча для валидационной выборки
            num_train_epochs=epochs,  # кол-во эпох
            weight_decay=0.01,  # штраф за большие веса чтобы модель не переобучалась
            logging_steps=TRAIN_LOGGING_STEPS,  # каждые N шагов логируем метрики
            load_best_model_at_end=(
                True if eval_dataset else False
            ),  # выбирает лучшую модель по метрике
            metric_for_best_model="f1",  # метрика для выбора лучшей модели
            greater_is_better=True,  # лучшая модель - модель с максимальным значением метрики
            push_to_hub=False,  # Запись модели в HGhub, если нужна - True
            report_to="none",  # куда отправляются логи метрик
            fp16=torch.cuda.is_available(),  # При использовании GPU использовать 16-битные числа
            dataloader_num_workers=2,  # распараллеливание загрузки данных
            save_total_limit=1,  # хранить только лучшую модель на диске
            max_grad_norm=1.0,  # максимальная норма градиента
            optim="adamw_torch",  # оптимизатор
            lr_scheduler_type="linear",  # тип распределения скорости обучения
            warmup_steps=0.1,  # кол-во эпох для увеличения скорости обучения
            dataloader_pin_memory=False,
        )

        trainer = Trainer(
            model=self.model,  # предобученная модель
            args=training_args,  # признаки обучения, которые мы создали выше
            train_dataset=train_dataset,  # тренировочная выборка
            eval_dataset=eval_dataset,  # валидационная выборка
            data_collator=self.data_collator,  # выравнивает примеры в батчи
            compute_metrics=(
                (lambda p: compute_metrics(p, self.label_list))
                if eval_dataset
                else None
            ),  # функция для расчёта метрик
            callbacks=(
                [
                    EarlyStoppingCallback(early_stopping_patience=2),
                    ProgressCallback(total_epochs=epochs),
                ]
                if eval_dataset
                else [
                    ProgressCallback(total_epochs=epochs),
                ]
            ),
        )
        print(DEVICE)

        torch.cuda.empty_cache()
        gc.collect()
        trainer.train()  # обучаем модель

        # trainer.save_model(output_dir)  # сохраняем обученную модель
        # self.tokenizer.save_pretrained(output_dir)  # сохраняем токенизатор

        log_history = trainer.state.log_history
        train_loss = []
        eval_metrics = {}
        true_labels: list = []
        pred_labels: list = []
        for entry in log_history:
            if "loss" in entry and "epoch" in entry:
                train_loss.append((entry["epoch"], entry["loss"]))
            if "eval_f1" in entry:
                eval_metrics = entry
                if "eval_true_labels" in entry:
                    raw_true = entry.get("eval_true_labels", [])
                    raw_pred = entry.get("eval_pred_labels", [])

                    true_labels = raw_true if isinstance(raw_true, list) else [raw_true]
                    pred_labels = raw_pred if isinstance(raw_pred, list) else [raw_pred]

        # Если метки не сохранились в log_history, получаем их через predict
        if not true_labels and eval_dataset:
            # Делаем предсказание на валидационной выборке
            predictions = trainer.predict(eval_dataset)
            metrics_with_labels = compute_metrics(
                (predictions.predictions, eval_dataset["labels"]), self.label_list
            )
            true_labels = metrics_with_labels.get("true_labels", [])
            pred_labels = metrics_with_labels.get("pred_labels", [])

        # Преобразуем список списков в плоские списки для матрицы ошибок
        flat_true_labels = [label for sublist in true_labels for label in sublist]
        flat_pred_labels = [label for sublist in pred_labels for label in sublist]

        # print("-" * 100)
        # print(eval_metrics)
        # print(log_history[-5:])
        # print("-" * 100)
        return {
            "train_loss": train_loss,
            "eval_metrics": eval_metrics,
            "model_dir": output_dir,
            "true_labels": flat_true_labels,  # добавляем
            "pred_labels": flat_pred_labels,  # добавляем
        }

    def load(self, model_dir: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForTokenClassification.from_pretrained(model_dir).to(
            DEVICE
        )
        self.label_list = list(self.model.config.id2label.values())
        self.label2id = self.model.config.label2id
        self.id2label = self.model.config.id2label

    def predict(
        self, text: str, return_entities: bool = True, max_length: int = 512
    ) -> list[dict]:
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=max_length
        ).to(DEVICE)
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=-1)
        predictions = torch.argmax(logits, dim=-1)

        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        word_ids = inputs.word_ids()

        result = []
        prev_word_id = None
        for i, (token, pred, prob) in enumerate(
            zip(tokens, predictions[0], probabilities[0])
        ):
            word_id = word_ids[i]
            if word_id is None:
                continue

            if word_id != prev_word_id:
                label_id = int(pred.item())
                label = self.id2label[label_id]
                score = prob[label_id].item()

                token_text = (
                    token.replace("##", "")
                    if self.model_name.startswith("bert")
                    else token
                )

                result.append({"word": token_text, "entity": label, "score": score})

            prev_word_id = word_id

        if return_entities:
            entities: list[dict] = []
            current_entity = None
            for item in result:
                label: str = item["entity"]
                if label == "O":
                    if current_entity:
                        entities.append(current_entity)
                        current_entity = None
                elif label.startswith("B-"):
                    if current_entity:
                        entities.append(current_entity)
                    current_entity = {
                        "type": label[2:],
                        "text": item["word"],
                        "score": item["score"],
                    }
                elif label.startswith("I-"):
                    if current_entity and current_entity["type"] == label[2:]:
                        current_entity["text"] += " " + item["word"]
                        current_entity["score"] = min(
                            current_entity["score"], item["score"]
                        )
                    else:
                        if current_entity:
                            entities.append(current_entity)
                        current_entity = {
                            "type": label[2:],
                            "text": item["word"],
                            "score": item["score"],
                        }
            if current_entity:
                entities.append(current_entity)
            return entities
        else:
            return result


# Чтение данных из файлов
def parse_csv_from_text(text: str):
    """
    Парсит содержимое CSV-файла с колонками text и labels.
    Строки могут быть в кавычках, разделитель – запятая.
    Пример строки:
    "Thousands of demonstrators have marched...",O O O O O O B-geo ...
    Возвращает список предложений, где каждое предложение – список словарей {token, label}.
    """
    sentences: list[list[dict[str, str]]] = []
    reader = csv.reader(io.StringIO(text), skipinitialspace=True)
    next(reader, None)  # пропускаем заголовок, если он есть (text,labels)
    for row in reader:
        if len(row) < 2:
            continue
        text_part = row[0].strip()
        labels_part = row[1].strip()
        if not text_part or not labels_part:
            continue
        tokens = text_part.split()
        labels = labels_part.split()
        if len(tokens) != len(labels):
            print(
                f"Несовпадение длины токенов ({len(tokens)}) и меток ({len(labels)}). "
                f"Строка пропущена: {text_part[:100]}..."
            )
            continue
        sentence = [{"token": t, "label": l} for t, l in zip(tokens, labels)]
        sentences.append(sentence)
    return sentences


def model_predict(
    ner: NERModel,
    MAX_LINE_LENGTH: int,
    BATCH_SIZE: int,
):
    print({"progress": 101})

    with tempfile.TemporaryDirectory() as tmpdir:
        trainer = Trainer(
            model=ner.model,
            args=TrainingArguments(
                output_dir=tmpdir,
                per_device_eval_batch_size=BATCH_SIZE,
                report_to="none",
            ),
            data_collator=ner.data_collator,
        )

        for index, file_path in enumerate(PREDICTING_FILES_PATHS):
            with open(file_path, "r", encoding="utf-8") as file:
                progress = int((index / len(PREDICTING_FILES_PATHS)) * (99 - 2)) + 102
                progress = min(199, max(102, progress))
                print({"progress": progress})

                text = file.read()

                # Разбиваем текст
                validation_sentences = parse_csv_from_text(text)

                # Dataset для модели
                dataset = prepare_dataset(
                    tokenizer=ner.tokenizer,
                    label2id=ner.label2id,
                    max_length=MAX_LINE_LENGTH,
                    sentences=validation_sentences,
                )

                predictions = trainer.predict(dataset)  # type: ignore
                preds = np.argmax(predictions.predictions, axis=2)
                result_rows = []
                for idx, sentence in enumerate(validation_sentences):
                    tokens = [item["token"] for item in sentence]
                    tokenized = ner.tokenizer(
                        tokens,
                        truncation=True,
                        is_split_into_words=True,
                        max_length=MAX_LINE_LENGTH,
                        return_tensors="pt",
                    )
                    word_ids = tokenized.word_ids()
                    pred_ids_for_sentence = preds[idx]
                    prev_word_idx = None
                    pred_labels_aligned = []

                    for i, word_idx in enumerate(word_ids):
                        if word_idx is None:
                            continue
                        if word_idx != prev_word_idx:
                            if i < len(pred_ids_for_sentence):
                                pred_label = ner.label_list[pred_ids_for_sentence[i]]
                                pred_labels_aligned.append(pred_label)
                            prev_word_idx = word_idx
                    pred_labels_aligned = pred_labels_aligned[: len(tokens)]
                    result_rows.append(
                        {
                            "tokens": tokens,
                            "labels": pred_labels_aligned,
                        }
                    )

                # Сохранение CSV
                # result_path = (
                #     Path("./files") / f"{Path(file_name).stem}_pred.csv"
                # )
                # result_path.parent.mkdir(parents=True, exist_ok=True)
                # with result_path.open(
                #     "w",
                #     encoding="utf-8",
                #     newline="",
                # ) as f:
                #     writer = csv.writer(f)
                #     writer.writerow(["text", "labels"])
                #     for item in result_rows:
                #         text_part = " ".join(item["tokens"])
                #         labels_part = " ".join(item["labels"])
                #         writer.writerow([text_part, labels_part])

                # Создаём CSV в памяти
                csv_buffer = io.StringIO()

                writer = csv.writer(csv_buffer)
                writer.writerow(["text", "labels"])

                for item in result_rows:
                    text_part = " ".join(item["tokens"])
                    labels_part = " ".join(item["labels"])
                    writer.writerow([text_part, labels_part])

                # Переводим в bytes
                csv_bytes = csv_buffer.getvalue().encode("utf-8")

                output_dir = Path("output")
                output_dir.mkdir(exist_ok=True)

                output_path = output_dir / f"{file_path}_result.csv"

                with open(output_path, "w", encoding="utf-8", newline="") as f:
                    f.write(csv_buffer.getvalue())

                print(f"Сохранено: {output_path}")

                # print(response.status_code)
                # print(response.json())


# Собираем все предложения из тренировочных CSV-файлов
def get_all_sentences() -> list[list[dict[str, str]]]:
    all_sentences: list[list[dict[str, str]]] = []

    for file_path in TRAINING_FILES_PATHS:
        try:
            with open(file_path, newline="", encoding="utf-8") as f:
                for sentence in parse_csv_from_text(f.read()):
                    all_sentences.append(sentence)
        except Exception as e:
            print(f"Ошибка при чтении CSV-файла {file_path}: {e}")

    return all_sentences


# Токенизация с выравниванием меток
def tokenize_and_align_labels(examples, tokenizer, label2id, max_length):
    tokenized_inputs = tokenizer(
        examples["tokens"],
        truncation=True,
        padding=False,
        is_split_into_words=True,
        max_length=max_length,
    )
    labels = []
    for i, label_seq in enumerate(examples["ner_tags"]):
        word_ids = tokenized_inputs.word_ids(batch_index=i)
        previous_word_idx = None
        label_ids = []
        for word_idx in word_ids:
            if word_idx is None:
                label_ids.append(-100)
            elif word_idx != previous_word_idx:
                label_ids.append(label2id[label_seq[word_idx]])
            else:
                label_ids.append(-100)
            previous_word_idx = word_idx
        labels.append(label_ids)
    tokenized_inputs["labels"] = labels
    return tokenized_inputs


# Извлечение уникальных меток
def extract_labels_from_sentences(sentences: list[list[dict]]) -> list[str]:
    all_labels = set()
    for sent in sentences:
        for item in sent:
            if item["label"] != "O":
                all_labels.add(item["label"])
    labels = sorted(list(all_labels)) + ["O"]
    return labels


# Подготовка датасета
def prepare_dataset(sentences: list[list[dict]], tokenizer, label2id, max_length):
    tokens_list = [[item["token"] for item in sent] for sent in sentences]
    tags_list = [[item["label"] for item in sent] for sent in sentences]
    dataset = Dataset.from_dict({"tokens": tokens_list, "ner_tags": tags_list})
    tokenized_dataset = dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer, label2id, max_length),
        batched=True,
        remove_columns=dataset.column_names,
    )
    return tokenized_dataset


def model_train(
    EPOCHS: int,
    BATCH_SIZE: int,
    BASE_MODEL: str,
    LEARNING_RATE: float,
    TESTING_SIZE: float,
    MAX_LINE_LENGHT: int,
):
    # Получаем предложения
    all_sentences = get_all_sentences()
    if len(all_sentences) == 0:
        print({"progress": 0})
        raise RuntimeError(f"Нет предложений для обучения")

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

    print({"progress": 4})

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

        train_loss_plot = loss_plot("Потери на обучении", result["train_loss"])

        # Создаем матрицу ошибок с реальными данными
        confusion_matrix_plot = plot_confusion_matrix(
            label_list, true_labels, pred_labels
        )

        print(
            {
                "progress": 100,
                "metrics": return_metrics,
                "graphs": {
                    "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                    "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
                },
            }
        )

        try:
            star_predict_time = time.perf_counter()
            model_predict(ner, MAX_LINE_LENGHT, BATCH_SIZE)
            predict_time_seconds = time.perf_counter() - star_predict_time
            return_metrics["Время разметки (сек)"] = round(predict_time_seconds, 2)
        except Exception as error:
            print({"progress": 201}, error)

        print(
            {
                "progress": 200,
                "metrics": return_metrics,
            }
        )


def main():
    return_parameters = {
        "Эпохи": EPOCHS,
        "Размер батчей": BATCH_SIZE,
        "Базовая модель": BASE_MODEL,
        "Скорость обучения": LEARNING_RATE,
        "Размер тренировочного набора": TRAINING_SIZE,
        "Максимальная длина предложения": MAX_LINE_LENGHT,
    }

    print({"progress": 3, "parameters": return_parameters})

    model_train(
        EPOCHS=EPOCHS,
        BATCH_SIZE=BATCH_SIZE,
        BASE_MODEL=BASE_MODEL,
        LEARNING_RATE=LEARNING_RATE,
        TESTING_SIZE=TRAINING_SIZE,
        MAX_LINE_LENGHT=MAX_LINE_LENGHT,
    )
    pass


if __name__ == "__main__":
    from multiprocessing import freeze_support

    freeze_support()  # можно оставить всегда
    main()

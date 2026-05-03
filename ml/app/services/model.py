import base64
import csv
import io
import logging
from typing import Any, List, Dict, cast
from pathlib import Path
import zipfile
import matplotlib.pyplot as plt

import torch
import numpy as np
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
)
from datasets import Dataset
from seqeval.metrics import classification_report, f1_score, accuracy_score
from seqeval.scheme import IOB2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Константы по умолчанию
# -------------------------------------------------------------------
MODEL_NAME = "distilbert-base-uncased"
MAX_LENGTH = 128
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# -------------------------------------------------------------------
# 1. Чтение данных из файлов
# -------------------------------------------------------------------
def parse_csv_from_text(text: str):
    """
    Парсит содержимое CSV-файла с колонками text и labels.
    Строки могут быть в кавычках, разделитель – запятая.
    Пример строки:
    "Thousands of demonstrators have marched...",O O O O O O B-geo ...
    Возвращает список предложений, где каждое предложение – список словарей {token, label}.
    """
    sentences: List[List[Dict[str, str]]] = []
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
            logger.warning(
                f"Несовпадение длины токенов ({len(tokens)}) и меток ({len(labels)}). "
                f"Строка пропущена: {text_part[:100]}..."
            )
            continue
        sentence = [{"token": t, "label": l} for t, l in zip(tokens, labels)]
        sentences.append(sentence)
    return sentences


# -------------------------------------------------------------------
# 2. Токенизация с выравниванием меток
# -------------------------------------------------------------------
def tokenize_and_align_labels(examples, tokenizer, label2id, max_length=MAX_LENGTH):
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


# -------------------------------------------------------------------
# 3. Подготовка датасета
# -------------------------------------------------------------------
def prepare_dataset(
    sentences: List[List[Dict]], tokenizer, label2id, max_length=MAX_LENGTH
):
    tokens_list = [[item["token"] for item in sent] for sent in sentences]
    tags_list = [[item["label"] for item in sent] for sent in sentences]
    dataset = Dataset.from_dict({"tokens": tokens_list, "ner_tags": tags_list})
    tokenized_dataset = dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer, label2id, max_length),
        batched=True,
        remove_columns=dataset.column_names,
    )
    return tokenized_dataset


# -------------------------------------------------------------------
# 4. Метрики
# -------------------------------------------------------------------
def compute_metrics(p, label_list):
    predictions, labels = p
    predictions = np.argmax(predictions, axis=2)

    true_predictions = [
        [label_list[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [label_list[l] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]

    report = classification_report(
        true_labels, true_predictions, scheme=IOB2, output_dict=True
    )
    report_dict = cast(Dict[str, Any], report)
    f1 = f1_score(true_labels, true_predictions, scheme=IOB2)
    acc = accuracy_score(true_labels, true_predictions)
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": report_dict["micro avg"]["precision"],
        "recall": report_dict["micro avg"]["recall"],
    }


# -------------------------------------------------------------------
# 5. Класс NER модели
# -------------------------------------------------------------------
class NERModel:
    def __init__(self, model_name: str, label_list: List[str]):
        self.model_name = model_name
        self.label_list = label_list
        self.label2id = {l: i for i, l in enumerate(label_list)}
        self.id2label = {i: l for l, i in self.label2id.items()}

        self.tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
        self.model = AutoModelForTokenClassification.from_pretrained(
            model_name,
            num_labels=len(label_list),
            id2label=self.id2label,
            label2id=self.label2id,
        ).to(device)
        self.data_collator = DataCollatorForTokenClassification(
            self.tokenizer, padding="longest"
        )

    def train(
        self,
        train_dataset,
        eval_dataset=None,
        output_dir: str = "./models",
        epochs: int = 5,
        batch_size: int = 16,
        learning_rate: float = 2e-5,
        max_length: int = MAX_LENGTH,
    ) -> dict:
        training_args = TrainingArguments(
            output_dir=output_dir,
            eval_strategy="epoch" if eval_dataset else "no",
            save_strategy="epoch",
            learning_rate=learning_rate,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            num_train_epochs=epochs,
            weight_decay=0.01,
            logging_steps=50,
            load_best_model_at_end=True if eval_dataset else False,
            metric_for_best_model="f1",
            greater_is_better=True,
            push_to_hub=False,
            report_to="none",
            fp16=torch.cuda.is_available(),
            dataloader_num_workers=2,
            save_total_limit=1,
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=self.data_collator,
            compute_metrics=(lambda p: compute_metrics(p, self.label_list)) if eval_dataset else None,
            callbacks=(
                [EarlyStoppingCallback(early_stopping_patience=2)]
                if eval_dataset
                else []
            ),
        )
        print(device)

        trainer.train()

        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        log_history = trainer.state.log_history
        train_loss = []
        eval_metrics = {}
        for entry in log_history:
            if "loss" in entry and "epoch" in entry:
                train_loss.append((entry["epoch"], entry["loss"]))
            if "eval_f1" in entry:
                eval_metrics = entry

        return {
            "train_loss": train_loss,
            "eval_metrics": eval_metrics,
            "model_dir": output_dir,
        }

    def load(self, model_dir: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForTokenClassification.from_pretrained(model_dir).to(
            device
        )
        self.label_list = list(self.model.config.id2label.values())
        self.label2id = self.model.config.label2id
        self.id2label = self.model.config.id2label


# -------------------------------------------------------------------
# Вспомогательные функции
# -------------------------------------------------------------------
def extract_labels_from_sentences(sentences: List[List[Dict]]) -> List[str]:
    all_labels = set()
    for sent in sentences:
        for item in sent:
            if item["label"] != "O":
                all_labels.add(item["label"])
    labels = sorted(list(all_labels)) + ["O"]
    return labels


def build_zip_model(model_dir: str) -> bytes:
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in Path(model_dir).glob("**/*"):
            if file_path.is_file():
                zf.write(file_path, arcname=file_path.relative_to(model_dir))
    return zip_buffer.getvalue()


def plot_loss(train_loss: list) -> str:
    fig, ax = plt.subplots(figsize=(6, 4))
    if train_loss:
        epochs = [item[0] for item in train_loss if item[0] is not None]
        losses = [item[1] for item in train_loss if item[0] is not None]
        if epochs:
            ax.plot(epochs, losses, "b-o", linewidth=2, markersize=8)
    ax.set_title("Training Loss")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Loss")
    ax.grid(True, alpha=0.3)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def plot_confusion_matrix(label_list: List[str]) -> str:
    fig, ax = plt.subplots(figsize=(8, 6))
    labels = [l for l in label_list if l != "O"]
    size = len(labels)
    data = np.random.rand(size, size)  # заглушка, замените на реальную матрицу
    if size > 0:
        im = ax.imshow(data, cmap="hot", interpolation="nearest")
        ax.set_xticks(range(size))
        ax.set_yticks(range(size))
        ax.set_xticklabels(labels, rotation=45)
        ax.set_yticklabels(labels)
        plt.colorbar(im, ax=ax)
    ax.set_title("Confusion Matrix (example)")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

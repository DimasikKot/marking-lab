import csv
import io
from pathlib import Path
import zipfile
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
)

from app.services.model_metrics import compute_metrics

# Константы по умолчанию
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


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
            eval_strategy=(
                "epoch" if eval_dataset else "no"
            ),  # оценка модели в конце каждой эпохи
            save_strategy="epoch",
            learning_rate=learning_rate,  # скорость обучения
            per_device_train_batch_size=batch_size,  # размер батча для тренировочной выборки
            per_device_eval_batch_size=batch_size,  # размер батча для валидационной выборки
            num_train_epochs=epochs,  # кол-во эпох
            weight_decay=0.01,  # штраф за большие веса чтобы модель не переобучалась
            logging_steps=50,  # каждый 50 шагов логируем метрики
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
                    EarlyStoppingCallback(early_stopping_patience=2)
                ]  # кол-во эпох для остановки
                if eval_dataset
                else []
            ),  # ранняя остановка обучения модели при достижении определенного кол-ва эпох без улучшения метрики
        )
        print(DEVICE)

        trainer.train()  # обучаем модель

        trainer.save_model(output_dir)  # сохраняем обученную модель
        self.tokenizer.save_pretrained(output_dir)  # сохраняем токенизатор

        log_history = trainer.state.log_history
        train_loss = []
        eval_metrics = {}
        for entry in log_history:
            if "loss" in entry and "epoch" in entry:
                train_loss.append((entry["epoch"], entry["loss"]))
            if "eval_f1" in entry:
                eval_metrics = entry

        print(eval_metrics)
        print(log_history[-5:])
        return {
            "train_loss": train_loss,
            "eval_metrics": eval_metrics,
            "model_dir": output_dir,
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
                label = self.id2label[pred.item()]  # type: ignore
                score = prob[pred].item()
                token_text = (
                    token.replace("##", "")
                    if self.model_name.startswith("bert")
                    else token
                )
                result.append({"word": token_text, "entity": label, "score": score})
            prev_word_id = word_id

        if return_entities:
            entities = []
            current_entity = None
            for item in result:
                label = item["entity"]
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


# Вспомогательные функции
def extract_labels_from_sentences(sentences: list[list[dict]]) -> list[str]:
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

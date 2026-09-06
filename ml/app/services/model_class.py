import gc
from typing import Union
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
)

from app.core.config import settings
from app.services.model_metrics import compute_metrics
from app.services.progress_callback import ProgressCallback

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
            model_name, use_fast=True, token=settings.HF_TOKEN
        )  # преобразование текста в числа
        self.model = AutoModelForTokenClassification.from_pretrained(  # инициализируем предобученную модель
            model_name,  # название модели
            num_labels=len(label_list),  # сколько всего типов меток
            id2label=self.id2label,  # словарь число-метка
            label2id=self.label2id,  # cловарь метка-число
            token=settings.HF_TOKEN,  # Добавлен токен
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
        train_access_token: str,
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
            logging_steps=settings.TRAIN_LOGGING_STEPS,  # каждые N шагов логируем метрики
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
            hub_token=settings.HF_TOKEN,  # Добавлен токен для возможной загрузки на Hub
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
                    ProgressCallback(
                        train_access_token=train_access_token, total_epochs=epochs
                    ),
                ]
                if eval_dataset
                else [
                    ProgressCallback(
                        train_access_token=train_access_token, total_epochs=epochs
                    ),
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
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_dir, token=settings.HF_TOKEN
        )
        self.model = AutoModelForTokenClassification.from_pretrained(
            model_dir, token=settings.HF_TOKEN
        ).to(DEVICE)
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

import os
import json
import torch
import numpy as np
from typing import List, Dict
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

# -------------------------------------------------------------------
# Конфигурация
# -------------------------------------------------------------------
MODEL_NAME = "distilbert-base-uncased"
MAX_LENGTH = 128
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
EPOCHS = 5
OUTPUT_DIR = "./ner_model"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


# -------------------------------------------------------------------
# 1. Чтение CoNLL
# -------------------------------------------------------------------
def read_conll(file_path: str) -> List[List[Dict]]:
    sentences = []
    with open(file_path, "r", encoding="utf-8") as f:
        sentence = []
        for line in f:
            line = line.strip()
            if line == "":
                if sentence:
                    sentences.append(sentence)
                    sentence = []
            else:
                parts = line.split()
                if len(parts) >= 2:
                    token, label = parts[0], parts[-1]
                    sentence.append({"token": token, "label": label})
        if sentence:
            sentences.append(sentence)
    return sentences

# -------------------------------------------------------------------
# 2. Токенизация с выравниванием меток
# -------------------------------------------------------------------
def tokenize_and_align_labels(examples, tokenizer, label2id):
    tokenized_inputs = tokenizer(
        examples["tokens"],
        truncation=True,
        padding=False,
        is_split_into_words=True,
        max_length=MAX_LENGTH,
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
def prepare_dataset(file_path: str, tokenizer, label2id):
    sentences = read_conll(file_path)
    tokens_list = [[item["token"] for item in sent] for sent in sentences]
    tags_list = [[item["label"] for item in sent] for sent in sentences]
    
    dataset = Dataset.from_dict({"tokens": tokens_list, "ner_tags": tags_list})
    tokenized_dataset = dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer, label2id),
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

    report = classification_report(true_labels, true_predictions, scheme=IOB2, output_dict=True)
    f1 = f1_score(true_labels, true_predictions, scheme=IOB2)
    acc = accuracy_score(true_labels, true_predictions)
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": report["micro avg"]["precision"],
        "recall": report["micro avg"]["recall"],
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
        self.data_collator = DataCollatorForTokenClassification(self.tokenizer, padding="longest")

    def train(self, train_file: str, eval_file: str = None, output_dir: str = OUTPUT_DIR):
        train_dataset = prepare_dataset(train_file, self.tokenizer, self.label2id)
        eval_dataset = None
        if eval_file and os.path.exists(eval_file):
            eval_dataset = prepare_dataset(eval_file, self.tokenizer, self.label2id)

        training_args = TrainingArguments(
            output_dir=output_dir,
            eval_strategy="epoch" if eval_dataset else "no",
            save_strategy="epoch",
            learning_rate=LEARNING_RATE,
            per_device_train_batch_size=BATCH_SIZE,
            per_device_eval_batch_size=BATCH_SIZE,
            num_train_epochs=EPOCHS,
            weight_decay=0.01,
            logging_steps=50,
            load_best_model_at_end=True if eval_dataset else False,
            metric_for_best_model="f1",
            greater_is_better=True,
            push_to_hub=False,
            report_to="none",
            fp16=torch.cuda.is_available(),
            dataloader_num_workers=2,
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=self.data_collator,
            compute_metrics=lambda p: compute_metrics(p, self.label_list) if eval_dataset else None,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=2)] if eval_dataset else None,
        )
        
        trainer.train()
        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        print(f"Model saved to {output_dir}")

    def load(self, model_dir: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForTokenClassification.from_pretrained(model_dir).to(device)
        self.label_list = list(self.model.config.id2label.values())
        self.label2id = self.model.config.label2id
        self.id2label = self.model.config.id2label
        print(f"Model loaded from {model_dir}")

    def predict(self, text: str, return_entities: bool = True) -> List[Dict]:
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_LENGTH).to(device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=-1)
        predictions = torch.argmax(logits, dim=-1)
        
        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        word_ids = inputs.word_ids()
        
        result = []
        prev_word_id = None
        for i, (token, pred, prob) in enumerate(zip(tokens, predictions[0], probabilities[0])):
            word_id = word_ids[i]
            if word_id is None:
                continue
            if word_id != prev_word_id:
                label = self.id2label[pred.item()]
                score = prob[pred].item()
                token_text = token.replace("##", "") if self.model_name.startswith("bert") else token
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
                    current_entity = {"type": label[2:], "text": item["word"], "score": item["score"]}
                elif label.startswith("I-"):
                    if current_entity and current_entity["type"] == label[2:]:
                        current_entity["text"] += " " + item["word"]
                        current_entity["score"] = min(current_entity["score"], item["score"])
                    else:
                        if current_entity:
                            entities.append(current_entity)
                        current_entity = {"type": label[2:], "text": item["word"], "score": item["score"]}
            if current_entity:
                entities.append(current_entity)
            return entities
        else:
            return result

# -------------------------------------------------------------------
# 6. Запуск
# -------------------------------------------------------------------
if __name__ == "__main__":
    TRAIN_FILE = "2.tsv"
    VALID_FILE = "1.tsv"
    
    # Собираем все метки из train и valid файлов
    all_labels = set()
    for file_path in [TRAIN_FILE, VALID_FILE]:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    label = parts[-1]
                    if label != "O":
                        all_labels.add(label)
    # Добавляем 'O' и сортируем для воспроизводимости
    LABEL_LIST = sorted(list(all_labels)) + ["O"]
    print("Detected labels:", LABEL_LIST)
    
    # Создаём модель с актуальным списком меток
    ner = NERModel(model_name=MODEL_NAME, label_list=LABEL_LIST)
    
    # Обучение (если данных много и CPU медленный — уменьшите MAX_LENGTH и BATCH_SIZE)
    ner.train(train_file=TRAIN_FILE, eval_file=VALID_FILE, output_dir=OUTPUT_DIR)
    
    # Предсказание
    text = "Apple Inc. is looking at buying U.K. startup for $1 billion."
    entities = ner.predict(text)
    print("Entities:", json.dumps(entities, indent=2, ensure_ascii=False))
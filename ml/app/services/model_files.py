import csv
import io
from datasets import Dataset


# Собираем все предложения из загруженных CSV-файлов
async def get_all_sentences(files) -> list[list[dict[str, str]]]:
    all_sentences = []
    for file in files:
        content = await file.read()
        text = content.decode("utf-8")
        # Теперь используем правильный парсер
        all_sentences.extend(parse_csv_from_text(text))  # список предложений

    return all_sentences


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

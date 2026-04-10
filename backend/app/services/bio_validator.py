import csv
from io import StringIO
from typing import List, Optional, TextIO
from pydantic import BaseModel


# ---------- Tokenization ----------


def tokenize(text: str) -> List[str]:
    return text.strip().split()


# ---------- BIO normalization ----------


def normalize_label(label: str) -> str:
    label = label.strip()
    if label == "O":
        return "O"

    if "-" not in label:
        return "O"

    bio, ent = label.split("-", 1)
    bio = bio.upper()
    ent = ent.lower()

    if bio not in ("B", "I"):
        return "O"

    return f"{bio}-{ent}"


def normalize_labels(tokens: List[str], labels: Optional[List[str]]) -> List[str]:
    labels = labels or []
    labels = [normalize_label(l) for l in labels]

    # выравнивание длины
    if len(labels) < len(tokens):
        labels.extend(["O"] * (len(tokens) - len(labels)))
    elif len(labels) > len(tokens):
        labels = labels[: len(tokens)]

    # BIO auto-fix
    prev = "O"
    for i, label in enumerate(labels):
        if label.startswith("I-"):
            if prev == "O" or prev[2:] != label[2:]:
                labels[i] = "B-" + label[2:]
        prev = labels[i]

    return labels


# ---------- Parsers ----------


def parse_csv_tokens_labels(text: str):
    reader = csv.DictReader(StringIO(text))
    # Если нужно поддерживать TSV, раскомментируйте эту строку и закомментируйте предыдущую
    # reader = csv.DictReader(StringIO(text), delimiter="\t")

    if not reader.fieldnames:
        return None

    fieldnames = set(reader.fieldnames)

    # определяем, из какого поля брать текст
    if "token" in fieldnames:
        text_field = "token"
    elif "text" in fieldnames:
        text_field = "text"
    else:
        return None

    if "labels" in fieldnames:
        label_field = "labels"
    elif "label" in fieldnames:
        label_field = "label"
    else:
        return None

    sentences = []

    for row in reader:
        text_value = (row.get(text_field) or "").strip()
        labels_value = (row.get(label_field) or "").strip()

        if not text_value:
            continue

        tokens = tokenize(text_value)
        labels = labels_value.split() if labels_value else []

        sentences.append((tokens, labels))

    return sentences if sentences else None


def parse_plain_text(text: str):
    sentences = []
    for line in text.splitlines():
        if not line.strip():
            continue
        tokens = tokenize(line)
        sentences.append((tokens, []))
    return sentences


class Word(BaseModel):
    token: str
    label: str


class Line(BaseModel):
    words: list[Word]


def parse_tsv_to_lines(content: str) -> list[Line]:
    lines: list[Line] = []
    current_words: list[Word] = []

    for raw_line in content.splitlines():
        raw_line = raw_line.strip()

        # граница предложения
        if not raw_line:
            if current_words:
                lines.append(Line(words=current_words))
                current_words = []
            continue

        parts = raw_line.split("\t")

        # пропускаем заголовок
        if parts[0].lower() == "token" and len(parts) > 1 and parts[1].lower() == "label":
            continue

        if len(parts) < 2:
            continue

        token, label = parts[0], parts[1]
        current_words.append(Word(token=token, label=label))

    # добавить последнее предложение, если файл не заканчивается пустой строкой
    if current_words:
        lines.append(Line(words=current_words))

    return lines


# ---------- Main normalization ----------


def normalize_to_bio_tsv(file: TextIO) -> str:
    content = file.read()

    sentences = parse_csv_tokens_labels(content)

    if sentences is None:
        sentences = parse_plain_text(content)

    output = StringIO()
    writer = csv.writer(output, delimiter="\t", lineterminator="\n")
    writer.writerow(["token", "label"])

    for tokens, raw_labels in sentences:
        labels = normalize_labels(tokens, raw_labels)

        for token, label in zip(tokens, labels):
            writer.writerow([token, label])

        # пустая строка = граница предложения
        writer.writerow([])

    return output.getvalue()

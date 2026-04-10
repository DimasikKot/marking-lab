import csv
from io import StringIO
from typing import List, Optional, TextIO


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


# ---------- CSV parser ----------

def parse_csv_tokens_labels(text: str):
    reader = csv.DictReader(StringIO(text))

    if not reader.fieldnames:
        raise ValueError("Пустой CSV или отсутствует заголовок")

    fieldnames = set(reader.fieldnames)

    # определяем, из какого поля брать текст
    if "tokens" in fieldnames:
        text_field = "tokens"
    elif "text" in fieldnames:
        text_field = "text"
    else:
        raise ValueError("CSV должен содержать колонку tokens или text")

    if "labels" not in fieldnames:
        raise ValueError("CSV должен содержать колонку labels")

    for row in reader:
        text_value = row.get(text_field, "").strip()
        labels_value = row.get("labels", "").strip()

        if not text_value:
            continue

        tokens = tokenize(text_value)
        labels = labels_value.split() if labels_value else []

        yield tokens, labels


# ---------- Main normalization ----------

def normalize_to_bio_tsv(file: TextIO) -> str:
    content = file.read()
    sentences = list(parse_csv_tokens_labels(content))

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
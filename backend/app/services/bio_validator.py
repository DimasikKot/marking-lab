import csv
from io import StringIO
from typing import List, Tuple, Optional, TextIO


def tokenize(text: str) -> List[str]:
    return text.strip().split()


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
    if not labels:
        labels = []

    labels = [normalize_label(l) for l in labels]

    # выравнивание длины
    if len(labels) < len(tokens):
        labels.extend(["O"] * (len(tokens) - len(labels)))
    elif len(labels) > len(tokens):
        labels = labels[: len(tokens)]

    # BIO-инварианты (мягкая нормализация)
    prev = "O"
    for i, label in enumerate(labels):
        if label.startswith("I-"):
            if prev == "O" or prev[2:] != label[2:]:
                labels[i] = "B-" + label[2:]
        prev = labels[i]

    return labels


def parse_plain_text(text: str) -> List[Tuple[List[str], List[str]]]:
    sentences = []
    for line in text.splitlines():
        if not line.strip():
            continue
        tokens = tokenize(line)
        sentences.append((tokens, []))
    return sentences


def parse_csv_text_labels(text: str) -> List[Tuple[List[str], List[str]]]:
    sentences = []
    reader = csv.DictReader(StringIO(text))

    if not reader.fieldnames or not {"text", "labels"} <= set(reader.fieldnames):
        raise ValueError("CSV не содержит колонок text и labels")

    for row in reader:
        text_part = row["text"].strip()
        labels_part = row.get("labels", "").strip()

        tokens = tokenize(text_part)
        labels = labels_part.split() if labels_part else []

        sentences.append((tokens, labels))

    return sentences


def normalize_to_bio_tsv(file: TextIO) -> str:
    content = file.read()

    # пробуем CSV с text,labels
    try:
        sentences = parse_csv_text_labels(content)
    except Exception:
        sentences = parse_plain_text(content)

    output = StringIO()
    writer = csv.writer(output, delimiter="\t", lineterminator="\n")
    writer.writerow(["sentence_id", "token", "label"])

    sentence_id = 1
    for tokens, raw_labels in sentences:
        labels = normalize_labels(tokens, raw_labels)
        for token, label in zip(tokens, labels):
            writer.writerow([sentence_id, token, label])
        sentence_id += 1

    return output.getvalue()
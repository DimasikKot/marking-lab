import csv
from io import StringIO, TextIOWrapper
from typing import BinaryIO

from fastapi import HTTPException


def normalize_label(label: str) -> str:
    label = label.strip().upper()
    if label == "O" or "-" not in label:
        return "O"
    bio, ent = label.split("-", 1)
    if bio not in ("B", "I"):
        return "O"
    return f"{bio}-{ent.lower()}"


def normalize_content_to_csv(file: BinaryIO) -> tuple[str, int]:
    try:
        content_stream = TextIOWrapper(
            file,
            encoding="utf-8",
            newline="",
        )
        content = content_stream.read()
    except UnicodeDecodeError:
        raise HTTPException(status_code=415, detail="Неподдерживаемый формат файла")

    sentences: list[tuple[str, str]] = []

    # Пробуем прочитать как правильный CSV (text,labels)
    reader = csv.DictReader(StringIO(content))

    for row in reader:
        text = (row.get("text") or row.get("tokens") or "").strip()
        labels_str = (row.get("labels") or row.get("label") or "").strip()

        if not text:
            continue

        tokens = text.split()
        raw_labels = labels_str.split() if labels_str else []

        labels = [normalize_label(l) for l in raw_labels]
        if len(labels) < len(tokens):
            labels += ["O"] * (len(tokens) - len(labels))
        labels = labels[: len(tokens)]

        # BIO auto-fix
        prev = "O"
        for i, lab in enumerate(labels):
            if lab.startswith("I-") and (prev == "O" or prev[2:] != lab[2:]):
                labels[i] = "B" + lab[1:]
            prev = labels[i]

        sentences.append((" ".join(tokens), " ".join(labels)))

    # plain text
    if not sentences:
        for line in content.splitlines():
            line = line.strip()
            if line:
                tokens = line.split()
                labels = ["O"] * len(tokens)
                sentences.append((" ".join(tokens), " ".join(labels)))

    # CSV output
    output = StringIO()
    writer = csv.writer(
        output, delimiter=",", quoting=csv.QUOTE_MINIMAL, lineterminator="\n"
    )

    writer.writerow(["text", "labels"])
    for text, labels_str in sentences:
        writer.writerow([text, labels_str])

    csv_result = output.getvalue()

    # 4. total_rows
    total_rows = len(sentences)

    return csv_result, total_rows

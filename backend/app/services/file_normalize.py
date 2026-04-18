import csv
from io import StringIO
from typing import TextIO


def normalize_label(label: str) -> str:
    label = label.strip().upper()
    if label == "O" or "-" not in label:
        return "O"
    bio, ent = label.split("-", 1)
    if bio not in ("B", "I"):
        return "O"
    return f"{bio}-{ent.lower()}"


def normalize_to_sentence_csv(file: TextIO) -> str:
    content = file.read()

    sentences = []

    # 1. Пробуем прочитать как правильный CSV (text,labels)
    try:
        reader = csv.DictReader(StringIO(content))
        for row in reader:
            text = (row.get("text") or row.get("token") or "").strip()
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

    except Exception:
        # 2. Если CSV не прочитался — пробуем старый TSV-формат (token\tlabel)
        current_tokens = []
        current_labels = []

        for line in content.splitlines():
            line = line.strip()
            if not line:
                if current_tokens:
                    text = " ".join(current_tokens)
                    labels_str = " ".join(current_labels)
                    sentences.append((text, labels_str))
                    current_tokens.clear()
                    current_labels.clear()
                continue

            if line.lower().startswith(("token", "text")):
                continue

            parts = line.split("\t", 1)
            if len(parts) == 2:
                token, label = parts
                current_tokens.append(token)
                current_labels.append(normalize_label(label))

        if current_tokens:
            sentences.append((" ".join(current_tokens), " ".join(current_labels)))

    # 3. Если ничего не нашлось — plain text fallback
    if not sentences:
        for line in content.splitlines():
            line = line.strip()
            if line:
                tokens = line.split()
                labels = ["O"] * len(tokens)
                sentences.append((" ".join(tokens), " ".join(labels)))

    # Записываем правильно в CSV
    output = StringIO()
    writer = csv.writer(
        output, delimiter=",", quoting=csv.QUOTE_MINIMAL, lineterminator="\n"
    )
    writer.writerow(["text", "labels"])

    for text, labels_str in sentences:
        writer.writerow([text, labels_str])

    return output.getvalue()

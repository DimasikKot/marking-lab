import csv
from io import StringIO
from fastapi import HTTPException


def normalize_labels(text: str, labels: str | None) -> str:
    tokens = text.split()
    label_tokens = labels.split() if labels else []

    if len(label_tokens) > len(tokens):
        raise HTTPException(
            status_code=400,
            detail="Количество BIO-меток больше количества токенов"
        )

    # Дополняем O
    label_tokens.extend(["O"] * (len(tokens) - len(label_tokens)))

    # Проверка BIO-тегов
    for tag in label_tokens:
        if tag != "O" and not (tag.startswith("B-") or tag.startswith("I-")):
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимый BIO-тег: {tag}"
            )

    return " ".join(label_tokens)


def validate_and_normalize_bio(content: str) -> str:
    content = content.strip().replace("\ufeff", "")
    if not content:
        raise HTTPException(status_code=400, detail="Файл пустой")

    rows = []

    # --- Попытка CSV ---
    try:
        f = StringIO(content)
        reader = csv.DictReader(f)

        if reader.fieldnames == ["text", "labels"]:
            for row in reader:
                text = row["text"].strip()
                labels = row["labels"].strip() if row["labels"] else None
                normalized = normalize_labels(text, labels)
                rows.append({"text": text, "labels": normalized})
        else:
            raise ValueError

    except Exception:
        # --- TXT ---
        for line in content.splitlines():
            line = line.strip()
            if not line:
                continue

            if "\t" in line:
                text, labels = line.split("\t", 1)
            else:
                parts = line.rsplit(" ", 1)
                if len(parts) == 2 and parts[1].startswith(("O", "B-", "I-")):
                    text, labels = parts
                else:
                    text, labels = line, None

            text = text.strip()
            labels = labels.strip() if labels else None

            normalized = normalize_labels(text, labels)
            rows.append({"text": text, "labels": normalized})

    # --- Финальный CSV ---
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["text", "labels"])
    writer.writeheader()
    writer.writerows(rows)

    return output.getvalue()
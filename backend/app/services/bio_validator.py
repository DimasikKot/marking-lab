import csv
from fastapi import HTTPException
from io import StringIO
from typing import TextIO


ALLOWED_TAG_PREFIXES = ("B-", "I-")


def validate_bio_tag(tag: str) -> None:
    if tag == "O":
        return
    if not tag.startswith(ALLOWED_TAG_PREFIXES):
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый BIO-тег: {tag}",
        )


def validate_and_normalize_bio(file: TextIO) -> str:
    reader = csv.DictReader(file, delimiter="\t")

    required_fields = {"sentence_id", "token", "label"}
    if not reader.fieldnames or set(reader.fieldnames) != required_fields:
        raise HTTPException(
            status_code=400,
            detail="TSV должен содержать колонки: sentence_id, token, label",
        )

    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["sentence_id", "token", "label"],
        delimiter="\t",
        lineterminator="\n",
    )
    writer.writeheader()

    prev_sentence = None
    prev_label = "O"

    for row in reader:
        sentence_id = row["sentence_id"]
        token = row["token"].strip()
        label = row["label"].strip()

        if not token:
            raise HTTPException(status_code=400, detail="Пустой токен")

        validate_bio_tag(label)

        # BIO-инвариант: I-* не может начинать сущность
        if label.startswith("I-"):
            if prev_label == "O" or prev_label[2:] != label[2:]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Некорректная BIO-последовательность: {label}",
                )

        if sentence_id != prev_sentence:
            prev_label = "O"
            prev_sentence = sentence_id

        writer.writerow(
            {
                "sentence_id": sentence_id,
                "token": token,
                "label": label,
            }
        )

        prev_label = label

    return output.getvalue()

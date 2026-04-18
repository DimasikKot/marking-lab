import csv
from itertools import islice
from pathlib import Path
from pydantic import BaseModel


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def iter_sentences_new_format(file_path: Path):
    with file_path.open(encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            text = (row.get("text") or "").strip()
            labels_str = (row.get("labels") or "").strip()

            if not text:
                continue

            tokens = text.split()  # простое разбиение по пробелам
            labels = labels_str.split() if labels_str else ["O"] * len(tokens)

            # выравниваем длину
            if len(labels) < len(tokens):
                labels += ["O"] * (len(tokens) - len(labels))
            labels = labels[: len(tokens)]

            words = [Word(token=t, label=l) for t, l in zip(tokens, labels)]
            yield Row(words=words)


def read_page_from_file(file_path: Path, page: int = 1, rows_per_page: int = 40):
    start = (page - 1) * rows_per_page
    sentences = list(
        islice(iter_sentences_new_format(file_path), start, start + rows_per_page)
    )

    # total_rows (лучше считать один раз при загрузке и хранить в БД)
    total_rows = (
        sum(1 for _ in iter_sentences_new_format(file_path)) if page == 1 else 0
    )

    return sentences, total_rows

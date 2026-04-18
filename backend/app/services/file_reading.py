import csv
from itertools import islice
from pathlib import Path
from pydantic import BaseModel


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def iter_sentences_fast(file_path: Path, start: int = 0, count: int = 40):
    """Генератор, который сразу пропускает start строк и читает только count"""
    with file_path.open(encoding="utf-8", errors="ignore") as f:
        # Пропускаем заголовок + нужное количество строк
        for _ in range(start + 1):  # +1 — заголовок
            next(f, None)

        reader = csv.reader(f)

        for row in islice(reader, count):
            if len(row) < 2:
                continue
            text = row[0].strip()
            labels_str = row[1].strip()
            if not text:
                continue

            tokens = text.split()
            labels = labels_str.split() if labels_str else ["O"] * len(tokens)

            if len(labels) < len(tokens):
                labels += ["O"] * (len(tokens) - len(labels))
            labels = labels[: len(tokens)]

            words = [Word(token=t, label=l) for t, l in zip(tokens, labels)]
            yield Row(words=words)


def read_page_from_file(
    file_path: Path,
    page: int = 1,
    rows_per_page: int = 40,
    total_rows: int | None = None,
):
    start_idx = (page - 1) * rows_per_page

    sentences = list(
        iter_sentences_fast(file_path, start=start_idx, count=rows_per_page)
    )

    if total_rows is None:
        total_rows = 100000  # get_total_sentences_fast(file_path)

    return sentences, total_rows


def get_total_sentences(file_path: Path) -> int:
    """Считает количество предложений (строк данных) в файле"""
    count = 0
    with file_path.open(encoding="utf-8") as file:
        next(file, None)  # пропускаем заголовок
        for line in file:
            if line.strip():  # считаем только непустые строки
                count += 1
    return count

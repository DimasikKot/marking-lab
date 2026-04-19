import collections
import csv
from itertools import islice
import itertools
from pathlib import Path
from pydantic import BaseModel


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def iter_sentences(file_path: Path, start: int = 0, count: int = 40):
    """Генератор, который сразу пропускает start строк и читает только count"""
    with file_path.open(encoding="utf-8", errors="ignore") as file:
        # Пропускаем заголовок + нужное количество строк
        itertools.islice(file, start + 1)  # не пропускает строки вообще
        # for _ in range(start + 1):  # +1 — заголовок
        #     # next(file, None)
        #     file.readline()
        collections.deque(itertools.islice(file, start + 1), maxlen=0)

        reader = csv.reader(file)

        for row in islice(reader, count):
            if len(row) < 2:
                continue
            tokens_str = row[0].strip()
            labels_str = row[1].strip()
            if not tokens_str:
                continue

            tokens = tokens_str.split()
            labels = labels_str.split()  # if labels_str else ["O"] * len(tokens)

            # if len(labels) < len(tokens):
            #     labels += ["O"] * (len(tokens) - len(labels))
            # labels = labels[: len(tokens)]

            words = [Word(token=t, label=l) for t, l in zip(tokens, labels)]
            yield Row(words=words)


def read_page_from_file(
    file_path: Path,
    page: int = 1,
    rows_per_page: int = 40,
):
    start_idx = (page - 1) * rows_per_page

    sentences = list(iter_sentences(file_path, start=start_idx, count=rows_per_page))

    return sentences

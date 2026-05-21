import csv
from io import StringIO, TextIOWrapper
from itertools import cycle
from typing import BinaryIO

from fastapi import HTTPException

BASE_TAGS: list[dict[str, str]] = [
    {
        "value": "art",
        "label": "Иновационные проекты",
        "color": "bg-yellow-200",
    },
    {
        "value": "eve",
        "label": "Событие",
        "color": "bg-green-200",
    },
    {
        "value": "geo",
        "label": "Географическое место",
        "color": "bg-orange-200",
    },
    {
        "value": "gpe",
        "label": "Страна/город (полит.)",
        "color": "bg-amber-400",
    },
    {
        "value": "nat",
        "label": "Природное явление",
        "color": "bg-teal-200",
    },
    {
        "value": "org",
        "label": "Организация",
        "color": "bg-purple-200",
    },
    {
        "value": "per",
        "label": "Человек",
        "color": "bg-pink-200",
    },
    {
        "value": "tim",
        "label": "Дата/время",
        "color": "bg-blue-200",
    },
]

COLORS_SET: list[str] = [
    "bg-red-200",
    "bg-rose-200",
    "bg-pink-200",
    "bg-purple-200",
    "bg-indigo-200",
    "bg-blue-200",
    "bg-sky-200",
    "bg-cyan-200",
    "bg-teal-200",
    "bg-emerald-200",
    "bg-green-200",
    "bg-lime-200",
    "bg-yellow-200",
    "bg-amber-200",
    "bg-orange-200",
    "bg-red-400",
    "bg-rose-400",
    "bg-pink-400",
    "bg-purple-400",
    "bg-indigo-400",
    "bg-blue-400",
    "bg-sky-400",
    "bg-cyan-400",
    "bg-teal-400",
    "bg-emerald-400",
    "bg-green-400",
    "bg-lime-400",
    "bg-yellow-400",
    "bg-amber-400",
    "bg-orange-400",
]


def normalize_label(label: str) -> str:
    label = label.strip().upper()
    if label == "O" or "-" not in label:
        return "O"
    bio, ent = label.split("-", 1)
    if bio not in ("B", "I"):
        return "O"
    return f"{bio}-{ent.lower()}"


def normalize_content_to_csv(file: BinaryIO) -> tuple[str, int, list[dict[str, str]]]:
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
    unique_tags: set[str] = set()

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

        prev_label = "O"
        for i, label in enumerate(labels):
            # BIO auto-fix
            if label.startswith("I-") and (
                prev_label == "O" or prev_label[2:] != label[2:]
            ):
                label = "B" + label[1:]
                labels[i] = label

            # Сбор уникальных тегов
            if label != "O":
                tag = label[2:] if label.startswith(("B-", "I-")) else label
                unique_tags.add(tag)

            prev_label = label

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

    # total_rows
    total_rows = len(sentences)

    # tags
    base_tags_map = {tag["value"]: tag for tag in BASE_TAGS}
    color_cycle = cycle(COLORS_SET)
    # Формируем `tags` с заменой совпадающих
    tags = [
        base_tags_map.get(
            tag,  # ключ поиска
            {
                "value": tag,
                "label": tag,
                "color": next(color_cycle),
            },
        )
        for tag in sorted(unique_tags)
    ]

    return csv_result, total_rows, tags

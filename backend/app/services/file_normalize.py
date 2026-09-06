import csv
from io import StringIO, TextIOWrapper
from itertools import cycle
from pathlib import Path
from typing import BinaryIO
from fastapi import HTTPException
from pydantic import BaseModel

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


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def normalize_label(label: str) -> str:
    label = label.strip().upper()
    if label == "O" or "-" not in label:
        return "O"
    bio, ent = label.split("-", 1)
    if bio not in ("B", "I"):
        return "O"
    return f"{bio}-{ent.lower()}"


# Знаки, которые отделяются в начале токена
START_SEPARATORS = {"(", "[", "{", '"', "'", "$", "%", "₽"}

# Знаки, которые отделяются в конце токена
END_SEPARATORS = {".", ",", ")", "]", "}", "!", "?", ":", "-", '"', "'", "$", "%", "₽"}


def split_token(token: str, label: str) -> tuple[list[str], list[str]]:
    """
    Разбивает один токен на части:
    - все символы из START_SEPARATORS в начале → отдельные токены с меткой O
    - все символы из END_SEPARATORS в конце → отдельные токены с меткой O
    - оставшаяся середина получает исходную метку label
    """
    if not token:
        return [], []

    # Отделяем начальные разделители
    start_chars = []
    while token and token[0] in START_SEPARATORS:
        start_chars.append(token[0])
        token = token[1:]

    # Отделяем конечные разделители
    end_chars = []
    while token and token[-1] in END_SEPARATORS:
        end_chars.append(token[-1])
        token = token[:-1]
    end_chars.reverse()  # сохраняем порядок

    result_tokens = []
    result_labels = []

    # Начальные знаки → O
    for ch in start_chars:
        result_tokens.append(ch)
        result_labels.append("O")

    # Середина → исходная метка
    if token:
        result_tokens.append(token)
        result_labels.append(label)

    # Конечные знаки → O
    for ch in end_chars:
        result_tokens.append(ch)
        result_labels.append("O")

    return result_tokens, result_labels


def tokenize_plain_text(text: str) -> list[str]:
    """
    Для plain text (без меток) – все метки будут 'O'.
    """
    orig_tokens = text.split()
    new_tokens = []
    for token in orig_tokens:
        sub_tokens, _ = split_token(token, "O")
        new_tokens.extend(sub_tokens)
    return new_tokens


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

        orig_tokens = text.split()
        raw_labels = labels_str.split() if labels_str else []

        labels = [normalize_label(l) for l in raw_labels]
        if len(labels) < len(orig_tokens):
            labels += ["O"] * (len(orig_tokens) - len(labels))
        labels = labels[: len(orig_tokens)]

        # --- НОВАЯ ТОКЕНИЗАЦИЯ ---
        new_tokens = []
        new_labels = []
        for token, label in zip(orig_tokens, labels):
            sub_tokens, sub_labels = split_token(token, label)
            new_tokens.extend(sub_tokens)
            new_labels.extend(sub_labels)
        tokens, labels = new_tokens, new_labels
        # --- КОНЕЦ ТОКЕНИЗАЦИИ ---

        prev_label = "O"
        for i, label in enumerate(labels):
            # BIO auto-fix
            if label.startswith("I-") and (
                prev_label == "O" or prev_label[2:] != label[2:]
            ):
                label = "B" + label[1:]
                labels[i] = label

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
                tokens = tokenize_plain_text(line)
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
        for tag in unique_tags
    ]

    return csv_result, total_rows, tags


def write_new_rows(
    file_path: Path, page: int, limit: int, new_rows: list[Row]
) -> tuple[int, list[dict[str, str]]]:
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    tmp = file_path.with_suffix(".tmp")

    new_total_rows = 0
    inserted_rows = 0
    unique_tags: set[str] = set()

    def collect_tags(labels: list[str]) -> None:
        for label in labels:
            if label != "O":
                tag = label[2:] if label.startswith(("B-", "I-")) else label
                unique_tags.add(tag)

    with file_path.open(encoding="utf-8") as src, tmp.open(
        "w", encoding="utf-8", newline=""
    ) as dst:
        reader = csv.reader(src)
        writer = csv.writer(dst)

        # 1. Переносим заголовок
        writer.writerow(next(reader))

        # 2. Идем по старым строкам
        for i, row in enumerate(reader):

            # Если это строка ДО или ПОСЛЕ заменяемой страницы -> просто копируем
            if i < start_idx or i >= end_idx:
                writer.writerow(row)
                new_total_rows += 1

                # Собираем теги из старых строк
                if len(row) > 1:
                    collect_tags(row[1].split())

            # Если мы дошли ровно до начала заменяемой страницы -> вываливаем все новые строки разом
            elif i == start_idx:
                for new_row in new_rows:
                    tokens = [(word.token or "").strip() for word in new_row.words]
                    labels = [word.label for word in new_row.words]

                    writer.writerow(
                        [
                            " ".join(tokens),
                            " ".join(labels),
                        ]
                    )

                    collect_tags(labels)

                    new_total_rows += 1
                    inserted_rows += 1

            # Примечание: если start_idx < i < end_idx, код ничего не делает
            # Старые строки просто пропускаются (удаляются)

        # 3. Подстраховка: если мы добавляли новую страницу в самый конец файла,
        # цикл мог закончиться раньше, чем наступил start_idx. Дописываем в конец.
        if inserted_rows < len(new_rows):
            for new_row in new_rows[inserted_rows:]:
                tokens = [(word.token or "").strip() for word in new_row.words]
                labels = [word.label for word in new_row.words]

                writer.writerow(
                    [
                        " ".join(tokens),
                        " ".join(labels),
                    ]
                )

                collect_tags(labels)
                new_total_rows += 1

    tmp.replace(file_path)

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
        for tag in unique_tags
    ]

    return new_total_rows, tags

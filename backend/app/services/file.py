import csv
from collections import deque
from io import TextIOWrapper
from itertools import islice
from fastapi import HTTPException
from pathlib import Path
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Literal, TextIO

from app.core.config import settings
from app.models.db import FileDB
from app.services.project import is_owner_of_project
from app.services.file_normalize import normalize_to_sentence_csv


def _is_owner_of_file(project_id: int, file_id: int, user_id: int, db: Session) -> None:
    is_owner_of_project(project_id=project_id, user_id , db)

    if (
        db.query(FileDB)
        .filter(FileDB.id == file_id, FileDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=403, detail="Нет доступа к файлу")


def _fetch_file_db_by_id(
    project_id: int, file_id: int, user_id: int, db: Session
) -> FileDB:
    _is_owner_of_file(project_id=project_id, file_id=file_id, user_id=user_id, db=db)

    file_db = db.query(FileDB).filter(FileDB.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file_db


def _get_file_path_by_id(project_id: int, file_id: int) -> Path:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    file_path = base_dir / str(project_id) / "files" / f"{file_id}.csv"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден на диске")

    return file_path


def _create_file_on_disk(project_id: int, file_id: int, content: str) -> None:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    file_path = base_dir / str(project_id) / "files" / f"{file_id}.csv"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_text(
        content,
        encoding="utf-8",
        newline="\n",
    )


def _delete_file_from_disk(project_id: int, file_id: int) -> None:
    file_path = _get_file_path_by_id(project_id, file_id)

    if file_path.exists():
        file_path.unlink()


def _get_total_rows(file: TextIO) -> int:
    """Считает количество строк в файле (кроме заголовка)"""
    count = 0
    file.seek(0)  # на всякий случай возвращаем в начало
    next(file, None)  # пропускаем заголовок

    for line in file:
        if line.strip():  # считаем только непустые строки
            count += 1

    return count


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def _get_file_sentences(file_path: Path, start: int = 0, count: int = 40):
    """Генератор, который сразу пропускает start строк и читает только count"""
    with file_path.open(encoding="utf-8", errors="ignore") as file:
        # Пропускаем заголовок + нужное количество строк
        islice(file, start + 1)  # не пропускает строки вообще
        # for _ in range(start + 1):  # +1 — заголовок
        #     # next(file, None)
        #     file.readline()
        deque(islice(file, start + 1), maxlen=0)

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


# router
def create_file_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    file: TextIO,
    name: str,
) -> FileDB:
    is_owner_of_project(db, project_id, user_id)

    content_stream = TextIOWrapper(
        file.buffer,
        encoding="utf-8",
        newline="",
    )

    content = normalize_to_sentence_csv(content_stream)
    total_rows = _get_total_rows(content_stream)

    file_db = FileDB(name=name, project_id=project_id, total_rows=total_rows)

    _create_file_on_disk(project_id, file_db.id, content)

    db.add(file_db)
    db.commit()
    db.refresh(file_db)

    return file_db


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


# router
def fetch_files_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    search: str | None = None,
    sort: SortType | None = None,
) -> list[FileDB]:
    is_owner_of_project(db, project_id, user_id)

    query = db.query(FileDB).filter(FileDB.project_id == project_id)
    if search:
        query = query.filter(FileDB.name.ilike(f"%{search}%"))
    if sort == "name_asc":
        query = query.order_by(FileDB.name.asc())
    elif sort == "name_desc":
        query = query.order_by(FileDB.name.desc())
    elif sort == "created_at_asc":
        query = query.order_by(FileDB.created_at.asc())
    elif sort == "created_at_desc":
        query = query.order_by(FileDB.created_at.desc())
    elif sort == "updated_at_asc":
        query = query.order_by(FileDB.updated_at.asc())
    elif sort == "updated_at_desc":
        query = query.order_by(FileDB.updated_at.desc())

    return query.all()


# router
def delete_file_by_id(project_id: int, file_id: int, user_id: int, db: Session) -> None:
    file_db = _fetch_file_db_by_id(db, project_id, user_id, file_id)

    _delete_file_from_disk(project_id, file_id)

    db.delete(file_db)
    db.commit()


# router
def read_page_from_file(
    project_id: int,
    file_id: int,
    page: int,
    rows: int,
    user_id: int,
    db: Session,
) -> tuple[FileDB, list[Row]]:
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    file_path = _get_file_path_by_id(project_id, file_id)

    start_idx: int = (page - 1) * rows

    page_rows = list(_get_file_sentences(file_path, start=start_idx, count=rows))

    return file_db, page_rows


# router
def update_file_by_id(
    db: Session,
    project_id: int,
    file_id: int,
    user_id: int,
    name: str | None = None,
    total_rows: int | None = None,
) -> FileDB:
    file_db = _fetch_file_db_by_id(db, project_id, user_id, file_id)

    if name:
        file_db[name] = name

    if total_rows:
        file_db[total_rows] = total_rows

    db.commit()
    db.refresh(file_db)
    return file_db


# router
def update_file_content_by_id(
    project_id: int,
    file_id: int,
    page: int,
    rows: int,
    new_rows: list[Row],
    user_id: int,
    db: Session,
) -> FileDB:
    file_db = _fetch_file_db_by_id(db, project_id, user_id, file_id)

    # file_path = _get_file_path_by_id(project_id, file_id)

    # new_total_rows = write_page_to_file(
    #     file_path=file_path,
    #     page=page,
    #     rows_per_page=rows,
    #     new_rows=new_rows,
    #     total_rows_in_db=file_db.total_rows,
    # )

    # new_total_rows = file_db.total_rows - rows + len(new_rows)
    # if new_total_rows:
    #     file_db.total_rows = new_total_rows

    db.commit()
    db.refresh(file_db)
    return file_db

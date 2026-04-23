import csv
from collections import deque
from itertools import islice
from fastapi import HTTPException
from pathlib import Path
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, BinaryIO, Generator, Literal

from app.core.config import settings
from app.models.db import FileDB
from app.services.project import is_owner_of_project
from app.services.file_normalize import normalize_content_to_csv


def _is_owner_of_file(project_id: int, file_id: int, user_id: int, db: Session) -> None:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

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


class Word(BaseModel):
    token: str
    label: str


class Row(BaseModel):
    words: list[Word]


def _get_file_rows(file_path: Path, page: int, rows: int) -> Generator[Row, Any, None]:
    start_idx = (page - 1) * rows

    with file_path.open(encoding="utf-8", errors="ignore") as file:
        # Пропускаем заголовок + нужное количество строк
        islice(file, start_idx + 1)  # не пропускает строки вообще
        # for _ in range(start + 1):  # +1 — заголовок
        #     # next(file, None)
        #     file.readline()
        deque(islice(file, start_idx + 1), maxlen=0)

        reader = csv.reader(file)

        for row in islice(reader, rows):
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


def _write_new_rows(file_path: Path, page: int, rows: int, new_rows: list[Row]) -> int:
    start_idx = (page - 1) * rows
    end_idx = start_idx + rows
    tmp = file_path.with_suffix(".tmp")

    new_total_rows = 0
    inserted_rows = 0

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

            # Если мы дошли ровно до начала заменяемой страницы -> вываливаем все новые строки разом
            elif i == start_idx:
                for new_row in new_rows:
                    writer.writerow(
                        [
                            " ".join(word.token for word in new_row.words),
                            " ".join(word.label for word in new_row.words),
                        ]
                    )
                    new_total_rows += 1
                    inserted_rows += 1

            # Примечание: если start_idx < i < end_idx, код ничего не делает
            # Старые строки просто пропускаются (удаляются)

        # 3. Подстраховка: если мы добавляли новую страницу в самый конец файла,
        # цикл мог закончиться раньше, чем наступил start_idx. Дописываем в конец.
        if inserted_rows < len(new_rows):
            for new_row in new_rows[inserted_rows:]:
                writer.writerow(
                    [
                        " ".join(word.token for word in new_row.words),
                        " ".join(word.label for word in new_row.words),
                    ]
                )
                new_total_rows += 1

    tmp.replace(file_path)

    return new_total_rows


# router
def create_file_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    file: BinaryIO,
    name: str,
    is_labeled: bool,
) -> FileDB:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    content, total_rows = normalize_content_to_csv(file)

    file_db = FileDB(
        name=name, project_id=project_id, total_rows=total_rows, is_labeled=is_labeled
    )
    db.add(file_db)
    db.flush()

    _create_file_on_disk(project_id, file_db.id, content)

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
def fetch_files_db_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    sort: SortType | None,
    search: str | None,
) -> list[FileDB]:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    files_db = db.query(FileDB).filter(FileDB.project_id == project_id)

    if search:
        files_db = files_db.filter(FileDB.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        files_db = files_db.order_by(FileDB.name.asc())
    elif sort == "name_desc":
        files_db = files_db.order_by(FileDB.name.desc())
    elif sort == "created_at_asc":
        files_db = files_db.order_by(FileDB.created_at.asc())
    elif sort == "created_at_desc":
        files_db = files_db.order_by(FileDB.created_at.desc())
    elif sort == "updated_at_asc":
        files_db = files_db.order_by(FileDB.updated_at.asc())
    elif sort == "updated_at_desc":
        files_db = files_db.order_by(FileDB.updated_at.desc())

    return files_db.all()


# router
def delete_file_by_id(project_id: int, file_id: int, user_id: int, db: Session) -> None:
    file_db = _fetch_file_db_by_id(
        project_id=project_id, file_id=file_id, user_id=user_id, db=db
    )

    _delete_file_from_disk(project_id, file_id)

    db.delete(file_db)
    db.commit()


# router
def update_file_db_by_id(
    project_id: int,
    file_id: int,
    user_id: int,
    db: Session,
    name: str | None,
    is_labeled: bool | None,
) -> FileDB:
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    if name:
        file_db.name = name

    if is_labeled:
        file_db.is_labeled = is_labeled

    db.commit()
    db.refresh(file_db)
    return file_db


# router
def get_page_by_id(
    project_id: int,
    file_id: int,
    user_id: int,
    db: Session,
    page: int,
    rows: int,
) -> tuple[FileDB, list[Row]]:
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    file_path = _get_file_path_by_id(project_id, file_id)

    page_rows = list(_get_file_rows(file_path, page=page, rows=rows))

    return file_db, page_rows


# router
def update_page_by_id(
    project_id: int,
    file_id: int,
    user_id: int,
    db: Session,
    page: int,
    rows: int,
    new_rows: list[Row],
) -> FileDB:
    file_db = _fetch_file_db_by_id(
        project_id=project_id, file_id=file_id, db=db, user_id=user_id
    )

    file_path = _get_file_path_by_id(project_id, file_id)

    new_total_rows = _write_new_rows(
        file_path=file_path,
        page=page,
        rows=rows,
        new_rows=new_rows,
    )

    file_db.total_rows = new_total_rows

    db.commit()
    db.refresh(file_db)

    return file_db

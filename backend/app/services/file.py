import csv
from collections import deque
from itertools import islice
from fastapi import HTTPException
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Any, BinaryIO, Generator, Literal

from app.core.config import settings
from app.models.db import FileDB
from app.services.project import is_owner_of_project, is_viewer_of_project
from app.services.file_normalize import (
    BASE_TAGS,
    Row,
    Word,
    normalize_content_to_csv,
    write_new_rows,
)


def _is_owner_of_file(project_id: int, file_id: int, user_id: int, db: Session) -> None:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(FileDB)
        .filter(FileDB.id == file_id, FileDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=403, detail=f"Нет доступа к файлу {file_id}")


def _is_viewer_of_file(
    project_id: int, file_id: int, user_id: int, db: Session
) -> None:
    is_viewer_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(FileDB)
        .filter(FileDB.id == file_id, FileDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=403, detail=f"Нет доступа к файлу {file_id}")


def _fetch_file_db_by_id(
    project_id: int, file_id: int, user_id: int, db: Session
) -> FileDB:
    _is_viewer_of_file(project_id=project_id, file_id=file_id, user_id=user_id, db=db)

    file_db = db.query(FileDB).filter(FileDB.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail=f"Файл {file_id} не найден")

    return file_db


def get_file_path_by_id(project_id: int, file_id: int) -> Path:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    file_path = base_dir / str(project_id) / "files" / f"{file_id}.csv"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Файл {file_id} не найден")

    return file_path


def create_file_on_disk(project_id: int, file_id: int, content: str) -> None:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    file_path = base_dir / str(project_id) / "files" / f"{file_id}.csv"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_text(
        content,
        encoding="utf-8",
        newline="\n",
    )


def _delete_file_from_disk(project_id: int, file_id: int) -> None:
    file_path = get_file_path_by_id(project_id, file_id)

    if file_path.exists():
        file_path.unlink()


def _get_file_rows(file_path: Path, page: int, limit: int) -> Generator[Row, Any, None]:
    start_idx = (page - 1) * limit

    with file_path.open(encoding="utf-8", errors="ignore") as file:
        # Пропускаем заголовок + нужное количество строк
        islice(file, start_idx + 1)  # не пропускает строки вообще
        # for _ in range(start + 1):  # +1 — заголовок
        #     # next(file, None)
        #     file.readline()
        deque(islice(file, start_idx + 1), maxlen=0)

        reader = csv.reader(file)

        for row in islice(reader, limit):
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
    name: str,
    is_labeled: bool,
    file: BinaryIO,
) -> FileDB:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    content, total_rows, real_tags = normalize_content_to_csv(file)
    # 1) сначала реальные метки
    # 2) если реальных меток нет, то значит файл не размечен

    file_db = FileDB(
        name=name,
        project_id=project_id,
        total_rows=total_rows,
        is_labeled=is_labeled,
        tags=real_tags,  # 1
    )
    if real_tags == []:  # 2
        file_db.is_labeled = False
        file_db.tags = BASE_TAGS
    db.add(file_db)
    db.flush()

    create_file_on_disk(project_id, file_db.id, content)

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
    is_viewer_of_project(project_id=project_id, user_id=user_id, db=db)

    files_db = db.query(FileDB).filter(FileDB.project_id == project_id)

    if search is not None:
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
    _is_owner_of_file(project_id=project_id, file_id=file_id, user_id=user_id, db=db)
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
    _is_owner_of_file(project_id=project_id, file_id=file_id, user_id=user_id, db=db)
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    if name is not None:
        file_db.name = name

    if is_labeled is not None:
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
    limit: int,
) -> tuple[FileDB, list[Row], int]:
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    file_path = get_file_path_by_id(project_id, file_id)

    page_rows = list(_get_file_rows(file_path, page=page, limit=limit))

    real_page = page

    if page_rows == []:
        real_page = (
            file_db.total_rows // limit
            if file_db.total_rows % limit == 0
            else file_db.total_rows // limit + 1
        )
        page_rows = list(_get_file_rows(file_path, page=(real_page), limit=limit))

    return file_db, page_rows, real_page


# router
def get_file_path_by_id_to_download(
    project_id: int, file_id: int, user_id: int, db: Session
) -> tuple[FileDB, Path]:
    file_db = _fetch_file_db_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )

    file_path = get_file_path_by_id(project_id, file_id)

    return file_db, file_path


# router
def update_page_by_id(
    project_id: int,
    file_id: int,
    user_id: int,
    db: Session,
    page: int,
    limit: int,
    new_tags: list[dict[str, str]] | None,
    new_rows: list[Row] | None,
) -> FileDB:
    _is_owner_of_file(project_id=project_id, file_id=file_id, user_id=user_id, db=db)
    file_db = _fetch_file_db_by_id(
        project_id=project_id, file_id=file_id, db=db, user_id=user_id
    )

    new_real_tags: list[dict[str, str]] = []
    # 1) сначала реальные метки
    # 2) потом метки из БД (зачем?)
    # 3) потом метки из запроса
    # 4) и если хоть что-то новое, то обновляем метки
    # 5) если реальных меток нет, то значит файл не размечен

    if new_rows is not None:
        file_path = get_file_path_by_id(project_id, file_id)

        new_total_rows, real_tags = write_new_rows(
            file_path=file_path,
            page=page,
            limit=limit,
            new_rows=new_rows,
        )
        new_real_tags.extend(real_tags)  # 1
        # new_real_tags.extend(file_db.tags)  # 2

        file_db.total_rows = new_total_rows

        if real_tags == []:  # 5
            file_db.is_labeled = False

    if new_tags is not None:
        new_real_tags.extend(new_tags)  # 3

    if new_rows is not None or new_tags is not None:
        file_db.tags = new_real_tags  # 4

    db.commit()
    db.refresh(file_db)

    return file_db

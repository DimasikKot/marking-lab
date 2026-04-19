from io import TextIOWrapper
from fastapi import HTTPException
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Literal, TextIO

from app.core.config import settings
from app.models.db import File
from app.services.project import is_owner_of_project
from app.services.file_normalize import normalize_to_sentence_csv
from app.services.file_frontend_reading import Row


def is_owner_of_file(db: Session, project_id: int, user_id: int, file_id: int) -> None:
    is_owner_of_project(db, project_id, user_id)

    if (
        db.query(File).filter(File.id == file_id, File.project_id == project_id).first()
        is None
    ):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")


def get_file_path(project_id: int, file_id: int) -> Path:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    return base_dir / str(project_id) / "files" / f"{file_id}.csv"


def save_file_to_disk(project_id: int, file_id: int, content: str) -> None:
    file_path: Path = get_file_path(project_id, file_id)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_text(
        content,
        encoding="utf-8",
        newline="\n",
    )


def read_file_from_disk(project_id: int, file_id: int) -> str:
    file_path: Path = get_file_path(project_id, file_id)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file_path.read_text(encoding="utf-8")


def delete_file_from_disk(project_id: int, file_id: int) -> None:
    file_path: Path = get_file_path(project_id, file_id)

    if file_path.exists():
        file_path.unlink()


def get_total_rows(file: TextIO) -> int:
    """Считает количество строк в файле (кроме заголовка)"""
    count = 0
    file.seek(0)  # на всякий случай возвращаем в начало
    next(file, None)  # пропускаем заголовок

    for line in file:
        if line.strip():  # считаем только непустые строки
            count += 1

    return count


def create_file_by_project_id(
    db: Session,
    name: str,
    project_id: int,
    user_id: int,
    file: TextIO,
) -> File:
    is_owner_of_project(db, project_id, user_id)

    text_stream = TextIOWrapper(
        file,
        encoding="utf-8",
        newline="",
    )
    validated_stream = normalize_to_sentence_csv(text_stream)

    file_db = File(name=name, project_id=project_id, total_rows=get_total_rows(file))
    db.add(file_db)
    db.commit()
    db.refresh(file_db)

    save_file_to_disk(project_id, file_db.id, validated_stream)

    return file_db


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


def fetch_files_by_project_id(
    db: Session,
    project_id: int,
    user_id: int,
    search: str | None = None,
    sort: SortType | None = None,
) -> list[File]:
    is_owner_of_project(db, project_id, user_id)

    query = db.query(File).filter(File.project_id == project_id)
    if search:
        query = query.filter(File.name.ilike(f"%{search}%"))
    if sort == "name_asc":
        query = query.order_by(File.name.asc())
    elif sort == "name_desc":
        query = query.order_by(File.name.desc())
    elif sort == "created_at_asc":
        query = query.order_by(File.created_at.asc())
    elif sort == "created_at_desc":
        query = query.order_by(File.created_at.desc())
    elif sort == "updated_at_asc":
        query = query.order_by(File.updated_at.asc())
    elif sort == "updated_at_desc":
        query = query.order_by(File.updated_at.desc())

    return query.all()


def fetch_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> File:
    is_owner_of_file(db, project_id, user_id, file_id)

    file_db = db.query(File).filter(File.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file_db


def update_file_by_id(
    db: Session,
    project_id: int,
    file_id: int,
    user_id: int,
    new_name: str | None,
) -> File:
    is_owner_of_file(db, project_id, user_id, file_id)

    file_db = db.query(File).filter(File.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if new_name:
        file_db.name = new_name

    db.commit()
    db.refresh(file_db)
    return file_db


def update_file_content_by_id(
    db: Session,
    project_id: int,
    file_id: int,
    user_id: int,
    page: int,
    rows: int,
    new_rows: list[Row],
) -> File:
    is_owner_of_file(db, project_id, user_id, file_id)

    file_db = db.query(File).filter(File.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    # TODO сделать сохранение на диск в файле file_frontend_saving.py

    new_total_rows = file_db.total_rows - rows + len(new_rows)
    if new_total_rows:
        file_db.total_rows = new_total_rows

    db.commit()
    db.refresh(file_db)
    return file_db


def delete_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> None:
    is_owner_of_file(db, project_id, user_id, file_id)

    file_db = db.query(File).filter(File.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден или уже удалён")

    delete_file_from_disk(project_id, file_id)
    db.delete(file_db)
    db.commit()

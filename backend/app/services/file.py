from fastapi import HTTPException
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Literal, TextIO
import shutil

from app.core.config import settings
from app.models.db import File
from app.services.project import is_owner_of_project
from app.services.bio_validator import validate_and_normalize_bio


def is_owner_of_file(db: Session, project_id: int, user_id: int, file_id: int) -> None:
    is_owner_of_project(db, project_id, user_id)
    if (
        db.query(File).filter(File.id == file_id, File.project_id == project_id).first()
        is None
    ):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")


def get_file_path(project_id: int, file_id: int) -> Path:
    base_dir = Path(settings.FILE_STORAGE_PATH).resolve()
    return base_dir / str(project_id) / f"{file_id}.tsv"


def save_file_to_disk(project_id: int, file_id: int, content: str) -> None:
    file_path = get_file_path(project_id, file_id)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    file_path.write_text(
        content,
        encoding="utf-8",
        newline="\n",
    )


def save_file_stream_to_disk(
    project_id: int,
    file_id: int,
    stream: TextIO,
) -> None:
    file_path = get_file_path(project_id, file_id)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        shutil.copyfileobj(stream, f)


def read_file_from_disk(project_id: int, file_id: int) -> str:
    file_path = get_file_path(project_id, file_id)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file_path.read_text(encoding="utf-8")


def open_file_stream(project_id: int, file_id: int) -> TextIO:
    file_path = get_file_path(project_id, file_id)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")

    return open(file_path, "r", encoding="utf-8")


def delete_file_from_disk(project_id: int, file_id: int) -> None:
    file_path = get_file_path(project_id, file_id)

    if file_path.exists():
        file_path.unlink()


def create_file_by_project_id(
    db: Session,
    name: str,
    project_id: int,
    user_id: int,
    file: TextIO,
) -> File:
    is_owner_of_project(db, project_id, user_id)
    validated_stream = validate_and_normalize_bio(file)

    file_obj = File(name=name, project_id=project_id)
    db.add(file_obj)
    db.commit()
    db.refresh(file_obj)

    save_file_to_disk(project_id, file_obj.id, validated_stream)

    return file_obj


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

    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file


def update_file_by_id(
    db: Session,
    project_id: int,
    user_id: int,
    file_id: int,
    new_name: str | None,
    new_content: str | None,
) -> File:
    is_owner_of_file(db, project_id, user_id, file_id)

    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if new_name:
        file.name = new_name
    if new_content:
        validated_content = validate_and_normalize_bio(new_content)
        save_file_to_disk(project_id, file_id, validated_content)
    db.commit()
    db.refresh(file)
    return file


def delete_file_by_id(db: Session, project_id: int, user_id: int, file_id: int):
    is_owner_of_file(db, project_id, user_id, file_id)

    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден или уже удалён")

    delete_file_from_disk(project_id, file_id)
    db.delete(file)
    db.commit()

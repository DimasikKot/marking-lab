from pathlib import Path
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import File
from app.services.project import is_owner_of_project


def get_file_storage_path(project_id: int, file_id: int) -> Path:
    """Возвращает путь к файлу на диске: ./files/{project_id}/{file_id}"""
    storage_dir = Path(settings.FILE_STORAGE_PATH).resolve()
    return storage_dir / str(project_id) / str(file_id)


def save_file_to_disk(project_id: int, file_id: int, content: str):
    """Сохраняет содержимое файла на диск"""
    file_path = get_file_storage_path(project_id, file_id)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")


def read_file_from_disk(project_id: int, file_id: int) -> str | None:
    """Читает файл с диска. Возвращает None, если файл не найден."""
    file_path = get_file_storage_path(project_id, file_id)
    if not file_path.exists():
        return None
    return file_path.read_text(encoding="utf-8")


def delete_file_from_disk(project_id: int, file_id: int):
    """Удаляет файл с диска (если существует)"""
    file_path = get_file_storage_path(project_id, file_id)
    if file_path.exists():
        file_path.unlink(missing_ok=True)


def is_owner_of_file(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(File).filter(File.id == file_id, File.project_id == project_id).first() is not None


def create_file_by_project_id(db: Session, name: str, project_id: int, user_id: int, content: str) -> File | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    file: File = File(name=name, project_id=project_id)
    db.add(file)
    db.commit()
    db.refresh(file)
    save_file_to_disk(project_id, file.id, content)
    return file


def fetch_files_by_project_id(
    db: Session,
    project_id: int,
    user_id: int,
    search: str | None = None,
    sort: str | None = None,
) -> list[File] | None:
    if not is_owner_of_project(db, project_id, user_id):
        print("Пользователь не является владельцем проекта")
        return None

    query = db.query(File).filter(File.project_id == project_id)

    if search:
        query = query.filter(File.name.ilike(f"%{search}%"))

    if sort:
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

    if not sort:
        query = query.order_by(File.created_at.desc())

    return query.all()


def fetch_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> File | None:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    return db.query(File).filter(File.id == file_id).first()


def update_file_by_id(
    db: Session,
    project_id: int,
    user_id: int,
    file_id: int,
    new_name: str,
    new_content: str,
) -> File | None:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return None

    file.name = new_name
    save_file_to_disk(project_id, file_id, new_content)

    db.commit()
    db.refresh(file)
    return file


def delete_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return False
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return False
    db.delete(file)
    db.commit()
    delete_file_from_disk(project_id, file_id)
    return True
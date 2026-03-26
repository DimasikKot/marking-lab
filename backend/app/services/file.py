from sqlalchemy.orm import Session

from app.models.db import File
from app.services.project import is_owner_of_project


def is_owner_of_file(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    """Проверяет, является ли пользователь владельцем файла.
    
    Возвращает True, если пользователь является владельцем, иначе False."""

    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(File).filter(File.id == file_id, File.project_id == project_id).first() is not None


def create_file_by_project_id(db: Session, name: str, project_id: int, user_id: int, content: bytes | None = None) -> File | None:
    """Создаёт новый файл и сохраняет его в базе данных"""
    # Проверяем принадлежит ли проект пользователю, если нет - возвращаем пустой список
    if not is_owner_of_project(db, project_id, user_id):
        return None
    file: File = File(name=name, project_id=project_id, content=content)
    db.add(file)
    db.commit()
    db.refresh(file)
    return file


def fetch_files_by_project_id(db: Session, project_id: int, user_id: int) -> list[File] | None:
    """Получает все файлы проекта"""
    if not is_owner_of_project(db, project_id, user_id):
        print("Пользователь не является владельцем проекта")
        return None
    return db.query(File).filter(File.project_id == project_id).all()


def fetch_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> File | None:
    """Получает файл по его ID"""
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    return db.query(File).filter(File.id == file_id).first()


def update_file_by_id(db: Session, project_id: int, user_id: int, file_id: int, new_name: str, new_content: bytes | None = None) -> File | None:
    """Обновляет имя файла с заданным ID.
    
    Возвращает обновлённый объект File, если обновление прошло успешно, иначе None."""
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return None
    if new_content is not None:
        file.content = new_content
    if new_name is not None:
        file.name = new_name
    
    db.commit()
    db.refresh(file)
    return file


def delete_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    """Удаляет файл с заданным ID. Возвращает True, если удаление прошло успешно, иначе False."""
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return False
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return False
    db.delete(file)
    db.commit()
    return True

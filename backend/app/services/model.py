from sqlalchemy.orm import Session

from app.models.db import Model
from app.services.project import is_owner_of_project


def is_owner_of_model(db: Session, project_id: int, user_id: int, model_id: int) -> bool:
    """Проверяет, является ли пользователь владельцем файла.
    
    Возвращает True, если пользователь является владельцем, иначе False."""

    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(Model).filter(Model.id == model_id, Model.project_id == project_id).first() is not None
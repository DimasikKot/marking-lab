from sqlalchemy.orm import Session

from app.models.db import Experiment
from app.services.project import is_owner_of_project


def is_owner_of_experiment(db: Session, project_id: int, user_id: int, experiment_id: int) -> bool:
    """Проверяет, является ли пользователь владельцем файла.
    
    Возвращает True, если пользователь является владельцем, иначе False."""

    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(Experiment).filter(Experiment.id == experiment_id, Experiment.project_id == project_id).first() is not None
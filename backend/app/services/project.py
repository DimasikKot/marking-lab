from requests import Session

from app.models.db import Project


def create_project(db: Session, user_id: int, name: str) -> Project:
    """Создаёт новый проект и сохраняет его в базе данных"""
    project: Project = Project(name=name, user_id=user_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
import datetime

from sqlalchemy.orm import Session

from app.models.db import Project


def is_owner_of_project(db: Session, project_id: int, user_id: int) -> bool:
    """Проверяет, является ли пользователь владельцем проекта.
    
    Возвращает True, если пользователь является владельцем, иначе False."""

    return db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first() is not None


def create_project(db: Session, user_id: int, name: str, description: str) -> Project:
    """Создаёт новый проект и сохраняет его в базе данных"""
    project: Project = Project(name=name, user_id=user_id, description=description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def fetch_projects_by_user_id(db: Session, user_id: int) -> list[Project]:
    """Получает все проекты, принадлежащие пользователю"""
    return db.query(Project).filter(Project.user_id == user_id).all()


def fetch_public_projects_by_user_id(db: Session, user_id: int) -> list[Project]:
    """Получает все публичные проекты, принадлежащие пользователю"""
    return db.query(Project).filter(Project.is_public == True, Project.user_id == user_id).all()


def fetch_project_by_id(db: Session, project_id: int, user_id: int) -> Project | None:
    """Получает проект по его ID"""
    if not is_owner_of_project(db, project_id, user_id):
        return None
    return db.query(Project).filter(Project.id == project_id).first()


def update_project_by_id(db: Session, new_description: str, project_id: int, user_id: int, new_name: str | None = None, new_is_public: bool | None = None) -> Project | None:
    """Обновляет проект с заданным ID. Можно обновить имя и/или статус публичности."""
    if not is_owner_of_project(db, project_id, user_id):
        return None
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None
    if new_name is not None:
        project.name = new_name
    if new_is_public is not None:
        project.is_public = new_is_public
    if new_description is not None:
        project.description = new_description

    db.commit()
    db.refresh(project)
    return project


def delete_project_by_id(db: Session, project_id: int, user_id: int) -> bool:
    """Удаляет проект с заданным ID. Возвращает True, если удаление прошло успешно, иначе False."""
    if not is_owner_of_project(db, project_id, user_id):
        return False
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True

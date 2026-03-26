from sqlalchemy.orm import Session

from app.models.db import Project


def create_project(db: Session, user_id: int, name: str) -> Project:
    """Создаёт новый проект и сохраняет его в базе данных"""
    project: Project = Project(name=name, user_id=user_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def fetch_user_projects(db: Session, user_id: int) -> list[Project]:
    """Получает все проекты, принадлежащие пользователю"""
    return db.query(Project).filter(Project.user_id == user_id).all()


def fetch_public_projects(db: Session) -> list[Project]:
    """Получает все публичные проекты"""
    return db.query(Project).filter(Project.is_public == True).all()


def fetch_project_by_id(db: Session, project_id: int) -> Project | None:
    """Получает проект по его ID"""
    return db.query(Project).filter(Project.id == project_id).first()


def update_project(db: Session, project_id: int, name: str | None = None, is_public: bool | None = None) -> Project | None:
    """Обновляет проект с заданным ID. Можно обновить имя и/или статус публичности."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None
    if name is not None:
        project.name = name
    if is_public is not None:
        project.is_public = is_public
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> bool:
    """Удаляет проект с заданным ID. Возвращает True, если удаление прошло успешно, иначе False."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True

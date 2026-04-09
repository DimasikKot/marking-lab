import shutil
from pathlib import Path
from typing import Literal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import Project


def get_project_path(project_id: int) -> Path:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    return base_dir / str(project_id)


def delete_project_from_disk(project_id: int) -> None:
    project_path = get_project_path(project_id)

    if not project_path.exists():
        # raise HTTPException(
        #     status_code=404, detail="Проект не найден на диске или уже удалён"
        # )
        return

    try:
        shutil.rmtree(project_path)
    except PermissionError as e:
        raise PermissionError(f"Нет прав для удаления {project_path}: {e}")
    except OSError as e:
        raise OSError(f"Ошибка при удалении {project_path}: {e}")


def is_owner_of_project(db: Session, project_id: int, user_id: int) -> None:
    """Проверяет, является ли пользователь владельцем проекта"""

    if (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")


def create_project(db: Session, user_id: int, name: str, description: str) -> Project:
    """Создаёт новый проект и сохраняет его в базе данных"""

    project: Project = Project(name=name, user_id=user_id, description=description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


def fetch_projects_by_user_id(
    db: Session,
    user_id: int,
    is_public: bool | None = None,
    search: str | None = None,
    sort: SortType | None = None,
) -> list[Project]:
    """Получает все проекты, принадлежащие пользователю"""

    query = db.query(Project).filter(Project.user_id == user_id)
    if is_public is not None:
        query = query.filter(Project.is_public == is_public)

    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        query = query.order_by(Project.name.asc())
    elif sort == "name_desc":
        query = query.order_by(Project.name.desc())
    elif sort == "created_at_asc":
        query = query.order_by(Project.created_at.asc())
    elif sort == "created_at_desc":
        query = query.order_by(Project.created_at.desc())
    elif sort == "updated_at_asc":
        query = query.order_by(Project.updated_at.asc())
    elif sort == "updated_at_desc":
        query = query.order_by(Project.updated_at.desc())

    return db.query(Project).filter(Project.user_id == user_id).all()


def fetch_project_by_id(db: Session, project_id: int, user_id: int) -> Project:
    """Получает проект по его ID"""

    is_owner_of_project(db, project_id, user_id)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


def update_project_by_id(
    db: Session,
    new_description: str,
    project_id: int,
    user_id: int,
    new_name: str | None = None,
    new_is_public: bool | None = None,
) -> Project:
    """Обновляет проект с заданным ID"""

    is_owner_of_project(db, project_id, user_id)

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if new_name is not None:
        project.name = new_name
    if new_description is not None:
        project.description = new_description
    if new_is_public is not None:
        project.is_public = new_is_public

    db.commit()
    db.refresh(project)
    return project


def delete_project_by_id(db: Session, project_id: int, user_id: int) -> None:
    """Удаляет проект с заданным ID и все связанные с ним данные"""

    is_owner_of_project(db, project_id, user_id)

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден или уже удалён")

    delete_project_from_disk(project_id)
    db.delete(project)
    db.commit()

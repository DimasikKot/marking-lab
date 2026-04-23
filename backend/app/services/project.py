import shutil
from pathlib import Path
from typing import Literal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import ProjectDB


def _get_project_path(project_id: int) -> Path:
    base_dir = Path(settings.STORAGE_PATH).resolve()
    return base_dir / str(project_id)


def _delete_project_from_disk(project_id: int) -> None:
    project_path = _get_project_path(project_id)

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


def is_owner_of_project(project_id: int, user_id: int, db: Session) -> None:
    """Проверяет, является ли пользователь владельцем проекта"""

    project_db = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()

    if project_db is None:
        raise HTTPException(status_code=404, detail="Проект не найден")

    if project_db.user_id != user_id and not project_db.is_public:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")


# router
def create_project(user_id: int, db: Session, name: str, description: str) -> ProjectDB:
    project_db: ProjectDB = ProjectDB(
        name=name, user_id=user_id, description=description
    )

    db.add(project_db)
    db.commit()
    db.refresh(project_db)

    return project_db


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


# router
def fetch_projects_db_by_user_id(
    user_id: int,
    db: Session,
    sort: SortType | None,
    search: str | None,
    is_public: bool | None,
) -> list[ProjectDB]:
    """Получает все проекты, принадлежащие пользователю"""

    projects_db = db.query(ProjectDB).filter(ProjectDB.user_id == user_id)

    if search is not None:
        projects_db = projects_db.filter(ProjectDB.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        projects_db = projects_db.order_by(ProjectDB.name.asc())
    elif sort == "name_desc":
        projects_db = projects_db.order_by(ProjectDB.name.desc())
    elif sort == "created_at_asc":
        projects_db = projects_db.order_by(ProjectDB.created_at.asc())
    elif sort == "created_at_desc":
        projects_db = projects_db.order_by(ProjectDB.created_at.desc())
    elif sort == "updated_at_asc":
        projects_db = projects_db.order_by(ProjectDB.updated_at.asc())
    elif sort == "updated_at_desc":
        projects_db = projects_db.order_by(ProjectDB.updated_at.desc())

    if is_public is not None:
        projects_db = projects_db.filter(ProjectDB.is_public == is_public)

    return projects_db.all()


# router
def fetch_project_db_by_id(project_id: int, user_id: int, db: Session) -> ProjectDB:
    is_owner_of_project(project_id, user_id, db)

    project_db = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not project_db:
        raise HTTPException(status_code=404, detail="Проект не найден")

    return project_db


# router
def update_project_by_id(
    project_id: int,
    user_id: int,
    db: Session,
    new_name: str | None,
    new_description: str | None,
    new_is_public: bool | None,
) -> ProjectDB:
    """Обновляет проект с заданным ID"""

    project_db = fetch_project_db_by_id(project_id=project_id, user_id=user_id, db=db)

    if new_name is not None:
        project_db.name = new_name

    if new_description is not None:
        project_db.description = new_description

    if new_is_public is not None:
        project_db.is_public = new_is_public

    db.commit()
    db.refresh(project_db)

    return project_db


# router
def delete_project_by_id(project_id: int, user_id: int, db: Session) -> None:
    project_db = fetch_project_db_by_id(project_id=project_id, user_id=user_id, db=db)

    _delete_project_from_disk(project_id)

    db.delete(project_db)
    db.commit()

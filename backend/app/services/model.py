from typing import Literal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.db import ModelDB
from app.services.project import is_owner_of_project


def is_owner_of_model(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к модели")


# router
def _fetch_model_db_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    model = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    return model


# router
def create_model(
    project_id: int,
    user_id: int,
    db: Session,
    name: str,
) -> ModelDB:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    model_db = ModelDB(name=name, project_id=project_id)

    db.add(model_db)
    db.commit()
    db.refresh(model_db)

    return model_db


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


# router
def fetch_models_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    sort: SortType | None = None,
    search: str | None = None,
) -> list[ModelDB]:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    models_db = db.query(ModelDB).filter(ModelDB.project_id == project_id)

    if search:
        models_db = models_db.filter(ModelDB.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        models_db = models_db.order_by(ModelDB.name.asc())
    elif sort == "name_desc":
        models_db = models_db.order_by(ModelDB.name.desc())
    elif sort == "created_at_asc":
        models_db = models_db.order_by(ModelDB.created_at.asc())
    elif sort == "created_at_desc":
        models_db = models_db.order_by(ModelDB.created_at.desc())
    elif sort == "updated_at_asc":
        models_db = models_db.order_by(ModelDB.updated_at.asc())
    elif sort == "updated_at_desc":
        models_db = models_db.order_by(ModelDB.updated_at.desc())

    return models_db.all()


# router
def delete_model_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    model_db = _fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    db.delete(model_db)
    db.commit()

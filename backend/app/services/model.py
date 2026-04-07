from pathlib import Path
from typing import List
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import Model, File
from app.services.project import is_owner_of_project
from app.services.file import read_file_from_disk, is_owner_of_file


def is_owner_of_model(db: Session, project_id: int, user_id: int, model_id: int) -> bool:
    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(Model).filter(Model.id == model_id, Model.project_id == project_id).first() is not None


def create_model(
    db: Session,
    project_id: int,
    user_id: int,
    name: str,
    training_file_ids: List[int] | None = None,
) -> Model | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    model = Model(name=name, project_id=project_id)
    db.add(model)
    db.commit()
    db.refresh(model)

    if training_file_ids:
        files = db.query(File).filter(
            File.id.in_(training_file_ids),
            File.project_id == project_id
        ).all()
        model.files = files
        db.commit()
    return model


def fetch_models_by_project_id(
    db: Session,
    project_id: int,
    user_id: int,
    search: str | None = None,
    sort: str | None = None,
) -> List[Model] | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    query = db.query(Model).filter(Model.project_id == project_id)

    if search:
        query = query.filter(Model.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        query = query.order_by(Model.name.asc())
    elif sort == "name_desc":
        query = query.order_by(Model.name.desc())
    else:
        query = query.order_by(Model.created_at.desc())

    return query.all()


def fetch_model_by_id(db: Session, project_id: int, user_id: int, model_id: int) -> Model | None:
    if not is_owner_of_model(db, project_id, user_id, model_id):
        return None
    return db.query(Model).filter(Model.id == model_id).first()


async def train_model(
    db: Session,
    project_id: int,
    user_id: int,
    model_id: int,
) -> Model | None:
    """Обучение NER-модели из выбранных training files"""
    if not is_owner_of_model(db, project_id, user_id, model_id):
        return None

    model = fetch_model_by_id(db, project_id, user_id, model_id)
    if not model or not model.files:
        return None

    # Подготавливаем данные для ML-контейнера
    training_data = []
    for f in model.files:
        content = read_file_from_disk(project_id, f.id)
        if content:
            training_data.append({"name": f.name, "content": content})

    async with AsyncClient(timeout=300.0) as client: # 5 минут на обучение
        response = await client.post(
            f"{settings.ML_URL}/ner/train",
            json={
                "training_data": training_data,
                "model_id": model.id, # можно использовать внутри ML
                "existing_parameters": model.parameters or {}
            }
        )
        result = response.json()

    # Сохраняем результат обучения
    model.parameters = result.get("parameters")
    model.is_draft = False
    model.saved_in_memory = True
    db.commit()
    db.refresh(model)
    return model
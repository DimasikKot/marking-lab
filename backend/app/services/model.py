from typing import List
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import ModelDB, FileDB
from app.services.project import is_owner_of_project


def is_owner_of_model(
    db: Session, project_id: int, user_id: int, model_id: int
) -> None:
    is_owner_of_project(db, project_id, user_id)

    if (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к модели")


def create_model(
    db: Session,
    project_id: int,
    user_id: int,
    name: str,
    training_file_ids: List[int] | None = None,
) -> ModelDB:
    is_owner_of_project(db, project_id, user_id)

    model = ModelDB(name=name, project_id=project_id)
    db.add(model)
    db.commit()
    db.refresh(model)

    if training_file_ids:
        files = (
            db.query(FileDB)
            .filter(FileDB.id.in_(training_file_ids), FileDB.project_id == project_id)
            .all()
        )
        model.files = files
        db.commit()
    return model


def fetch_models_by_project_id(
    db: Session,
    project_id: int,
    user_id: int,
    search: str | None = None,
    sort: str | None = None,
) -> List[ModelDB]:
    is_owner_of_project(db, project_id, user_id)

    query = db.query(ModelDB).filter(ModelDB.project_id == project_id)

    if search:
        query = query.filter(ModelDB.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        query = query.order_by(ModelDB.name.asc())
    elif sort == "name_desc":
        query = query.order_by(ModelDB.name.desc())
    else:
        query = query.order_by(ModelDB.created_at.desc())

    return query.all()


def fetch_model_by_id(
    db: Session, project_id: int, user_id: int, model_id: int
) -> ModelDB:
    is_owner_of_model(db, project_id, user_id, model_id)

    model = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    return model


# Нужно переделать
async def train_model(
    project_id: int,
    file_id: int,
) -> None:
    """Обучение NER-модели из выбранных training files"""

    # Подготавливаем данные для ML-контейнера
    training_data = []
    # content = read_file_from_disk(project_id, file_id)
    # if content:
    #     training_data.extend(parse_bio_csv(content))  # list[dict]

    # Разделяем на два списка
    text: list[] = [item["text"] for item in training_data]
    labels = [item["labels"] for item in training_data]

    async with AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{settings.ML_URL}/models/",
            json={
                "text": text[:1000],
                "labels": labels[:1000],
            },
        )
        result = response.json()

    return result


async def delete_model_by_id(
    db: Session, project_id: int, user_id: int, model_id: int
) -> None:
    is_owner_of_model(db, project_id, user_id, model_id)

    model = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    db.delete(model)
    db.commit()

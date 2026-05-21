import json
from typing import Any, Literal
from fastapi import HTTPException
import httpx
import redis
from sqlalchemy.orm import Session

from app.models.db import FileDB, ModelDB, ModelFileDB
from app.services.project import is_owner_of_project, is_viewer_of_project
from app.services.train import encode_train_access_token


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
        raise HTTPException(status_code=404, detail=f"Нет доступа к модели {model_id}")


def is_viewer_of_model(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    is_viewer_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail=f"Нет доступа к модели {model_id}")


async def _train_model_request(model_db: ModelDB, db: Session):
    # Формируем запрос к внешнему сервису
    async with httpx.AsyncClient() as client:
        model_db.progress = 2
        db.commit()
        db.refresh(model_db)

        try:
            redis_class = redis.Redis(
                host="redis",  # имя сервиса в docker-compose
                port=6379,
                decode_responses=True,
            )

            redis_id = redis_class.xadd(
                "ml_train_tasks",
                {
                    "model_id": model_db.id,
                    "project_id": model_db.project_id,
                    "parameters": json.dumps(model_db.parameters),
                    "train_access_token": encode_train_access_token(
                        project_id=model_db.project_id, model_id=model_db.id
                    ),
                },
            )

            model_db.redis_id = str(redis_id)

            model_db.progress = 5
            db.commit()
            db.refresh(model_db)

        except Exception as _:
            model_db.progress = 0
            db.commit()
            db.refresh(model_db)

            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при страрте обучения модели: {model_db.id}",
            )


def _update_files_by_role(
    db: Session,
    model_db: ModelDB,
    files_ids: list[int],
    role: str,
):
    # Текущие связи модели с данным role
    current_links = {
        link.file_id: link for link in model_db.file_links if link.role == role
    }

    # Загружаем файлы из БД
    new_files = db.query(FileDB).filter(FileDB.id.in_(files_ids)).all()
    new_files_dict = {file.id: file for file in new_files}

    # Удаляем старые связи
    for file_id, link in list(current_links.items()):
        if file_id not in new_files_dict:
            model_db.file_links.remove(link)

    # Добавляем новые связи
    for file_id, file_db in new_files_dict.items():
        if file_id not in current_links:
            model_db.file_links.append(
                ModelFileDB(
                    file=file_db,
                    role=role,
                )
            )


# router
def create_model(
    project_id: int,
    user_id: int,
    db: Session,
    name: str,
    parameters: dict[str, Any] | None,
    training_files_ids: list[int] | None,
    prediction_files_ids: list[int] | None,
) -> ModelDB:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    model_db = ModelDB(project_id=project_id, name=name)

    if parameters is not None:
        model_db.parameters = parameters

    # ---------- TRAINING FILES ----------
    if training_files_ids is not None:
        _update_files_by_role(
            db=db,
            model_db=model_db,
            files_ids=training_files_ids,
            role="training",
        )

    # ---------- PREDICTION FILES ----------
    if prediction_files_ids is not None:
        _update_files_by_role(
            db=db,
            model_db=model_db,
            files_ids=prediction_files_ids,
            role="for_prediction",
        )

    db.add(model_db)
    db.commit()
    db.refresh(model_db)

    return model_db


# router
def fetch_model_db_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> ModelDB:
    is_viewer_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    model_db = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )

    if not model_db:
        raise HTTPException(status_code=404, detail="Модель не найдена")

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
def fetch_models_db_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    sort: SortType | None,
    search: str | None,
) -> list[ModelDB]:
    is_viewer_of_project(project_id=project_id, user_id=user_id, db=db)

    models_db = db.query(ModelDB).filter(ModelDB.project_id == project_id)

    if search is not None:
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
def update_model_db_by_id(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
    name: str | None,
    parameters: dict[str, Any] | None,
    training_files_ids: list[int] | None,
    prediction_files_ids: list[int] | None,
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    if name is not None:
        model_db.name = name

    if parameters is not None:
        if 0 < model_db.progress < 100:
            raise HTTPException(
                status_code=400, detail="Нельзя изменять параметры обучаемой модели"
            )

        model_db.parameters = parameters

    # ---------- TRAINING FILES ----------
    if training_files_ids is not None:
        if 0 < model_db.progress < 100:
            raise HTTPException(
                status_code=400, detail="Нельзя изменять параметры обучаемой модели"
            )

        _update_files_by_role(
            db=db,
            model_db=model_db,
            files_ids=training_files_ids,
            role="training",
        )

    # ---------- PREDICTION FILES ----------
    if prediction_files_ids is not None:
        if 0 < model_db.progress < 100:
            raise HTTPException(
                status_code=400, detail="Нельзя изменять параметры обучаемой модели"
            )

        _update_files_by_role(
            db=db,
            model_db=model_db,
            files_ids=prediction_files_ids,
            role="for_prediction",
        )

    db.commit()
    db.refresh(model_db)
    return model_db


# router
async def train_model_by_id(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    # -------- TRAINING FILES --------
    training_files = [
        link.file for link in model_db.file_links if link.role == "training"
    ]

    if len(training_files) == 0:
        raise HTTPException(
            status_code=400,
            detail="Выберите файлы для обучения",
        )

    if 0 < model_db.progress < 100:
        raise HTTPException(
            status_code=400, detail="Нельзя изменять параметры обучаемой модели"
        )

    model_db.progress = 1
    db.commit()
    db.refresh(model_db)

    await _train_model_request(
        model_db=model_db,
        db=db,
    )

    return model_db


# router
def stop_train_model_by_id(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    redis_class = redis.Redis(
        host="redis",  # имя сервиса в docker-compose
        port=6379,
        decode_responses=True,
    )

    if model_db.redis_id is not None:
        redis_class.xdel("train_stream", str(model_db.redis_id))
        model_db.redis_id = None

    model_db.progress = 0
    db.commit()
    db.refresh(model_db)

    return model_db


# router
def delete_model_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    db.delete(model_db)
    db.commit()

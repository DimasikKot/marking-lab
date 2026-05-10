import io
import json
from pathlib import Path
from typing import Any, Literal
from fastapi import HTTPException
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import FileDB, ModelDB, ModelFileDB
from app.services.project import is_owner_of_project
from app.services.file import get_file_path_by_id


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
            role="prediction",
        )

    db.add(model_db)
    db.commit()
    db.refresh(model_db)

    return model_db


# router
def fetch_model_db_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

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
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

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
            role="prediction",
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

    training_files_paths: set[Path] = {
        get_file_path_by_id(
            project_id=file_db.project_id,
            file_id=file_db.id,
        )
        for file_db in training_files
    }

    # -------- PREDICTION FILES --------
    prediction_files = [
        link.file for link in model_db.file_links if link.role == "prediction"
    ]

    # TODO Сделать отправку с тренировочными данными
    prediction_files_paths: set[Path] = {
        get_file_path_by_id(
            project_id=file_db.project_id,
            file_id=file_db.id,
        )
        for file_db in prediction_files
    }

    model_db.progress = 2
    db.commit()
    db.refresh(model_db)

    # Формируем запрос к внешнему сервису
    # Мы используем context manager, чтобы гарантированно закрыть файлы
    async with httpx.AsyncClient() as client:
        files_to_send: list[tuple[str, tuple[str, io.BufferedReader, str]]] = []
        opened_files: list[io.BufferedReader] = []

        try:
            for path in training_files_paths:
                file_stream: io.BufferedReader = open(path, "rb")
                opened_files.append(file_stream)
                # Формат: (название_поля, (имя_файла, объект_файла, content_type))
                files_to_send.append(("files", (path.name, file_stream, "text/plain")))

            response = await client.post(
                settings.ML_URL + "/models/train",  # URL обучающего сервиса
                data={"parameters": json.dumps(model_db.parameters)},
                files=files_to_send,
                timeout=None,  # Обучение может длиться долго
            )

            for file_stream in opened_files:
                file_stream.close()

            if response.status_code != 200:
                model_db.progress = 0
                db.commit()
                db.refresh(model_db)

                raise response.json()

            # Метрики забираем из заголовка
            # metrics_raw = response.headers.get("X-Metrics")
            # graphs_raw = response.headers.get("X-Graphs")
            # metrics: dict[str, Any] = json.loads(metrics_raw) if metrics_raw else {}
            # graphs: dict[str, Any] = json.loads(graphs_raw) if graphs_raw else {}
            # Проверить можно на https://products.aspose.app/imaging/ru/conversion/base64-to-image

            data = response.json()
            metrics = json.loads(data["metrics"])
            graphs = json.loads(data["graphs"])
            model_db.metrics = metrics
            model_db.graphs = graphs

            # Содержимое результирующего файла (если нужно сохранить)
            # result_content = response.content
            # _create_model_on_disk(
            #     project_id=model_db.project_id,
            #     model_id=model_db.id,
            #     content=response.content,  # content=response.content.decode("utf-8"),
            # )

            model_db.progress = 100
            db.commit()
            db.refresh(model_db)

        except Exception as e:
            model_db.progress = 0
            db.commit()
            db.refresh(model_db)

            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при обучении модели: {e}",
            )

        finally:
            for file_stream in opened_files:
                file_stream.close()

    return model_db


# router
def delete_model_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    db.delete(model_db)
    db.commit()

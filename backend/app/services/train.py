from pathlib import Path
from typing import Any, BinaryIO
from fastapi import HTTPException
from jose import jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import FileDB, ModelDB
from app.services.file import create_file_on_disk, get_file_path_by_id
from app.services.file_normalize import normalize_content_to_csv


def encode_train_access_token(project_id: int, model_id: int) -> str:
    """Создаёт JWT-токен с данными из словаря и временем истечения, если указано"""
    to_encode: dict[Any, Any] = {"project_id": project_id, "model_id": model_id}
    expire: datetime = datetime.now(tz=timezone.utc) + timedelta(hours=48)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.TRAIN_ACCESS_TOKEN_SECRET, algorithm="HS256")


def _decode_train_access_token(token: str) -> dict[str, Any] | None:
    """Возвращает payload из JWT-токена или None, если токен недействителен/просрочен"""
    try:
        payload = jwt.decode(
            token,
            settings.TRAIN_ACCESS_TOKEN_SECRET,
            algorithms=["HS256"],
            options={"verify_signature": True, "verify_exp": True, "require": ["exp"]},
        )
        return payload
    except Exception as e:
        print(f"Ошибка при декодировании токена: {e}")


def _get_info_from_train_access_token(token: str) -> tuple[int, int]:
    decoded_token = _decode_train_access_token(token)

    if not decoded_token:
        raise HTTPException(
            status_code=401, detail="Недействительный или просроченный токен"
        )

    project_id = decoded_token.get("project_id")
    if not project_id:
        raise HTTPException(
            status_code=401, detail="В токене отсутствует идентификатор модели"
        )

    model_id = decoded_token.get("model_id")
    if not model_id:
        raise HTTPException(
            status_code=401, detail="В токене отсутствует идентификатор модели"
        )

    try:
        return int(project_id), int(model_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Неверные данные в токене")


# router
def set_progress_model_db_by_id(
    train_access_token: str,
    progress: int,
    metrics: dict[str, Any] | None,
    graphs: dict[str, Any] | None,
    db: Session,
) -> ModelDB:
    project_id, model_id = _get_info_from_train_access_token(train_access_token)

    model_db = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )

    if not model_db:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    if metrics is not None:
        metrics_new = {}
        if 0 < progress < 100:
            metrics_new.update(model_db.metrics)
        metrics_new.update(metrics)
        model_db.metrics = metrics_new

    if graphs is not None:
        model_db.graphs = graphs

    model_db.progress = progress

    db.commit()
    db.refresh(model_db)
    return model_db


# router
def get_prediction_files_by_id(train_access_token: str, db: Session) -> set[Path]:
    project_id, model_id = _get_info_from_train_access_token(train_access_token)

    model_db = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )

    if not model_db:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    prediction_files = [
        link.file for link in model_db.file_links if link.role == "prediction"
    ]

    prediction_files_paths: set[Path] = {
        get_file_path_by_id(
            project_id=file_db.project_id,
            file_id=file_db.id,
        )
        for file_db in prediction_files
    }

    return prediction_files_paths


# router
def create_prediction_file_by_project_id(
    train_access_token: str, name: str, file: BinaryIO, db: Session
) -> FileDB:
    project_id, model_id = _get_info_from_train_access_token(train_access_token)

    content, total_rows = normalize_content_to_csv(file)

    file_db = FileDB(
        name=name, project_id=project_id, total_rows=total_rows, is_labeled=True
    )
    db.add(file_db)
    db.flush()

    create_file_on_disk(project_id, file_db.id, content)

    db.commit()
    db.refresh(file_db)

    return file_db

from pathlib import Path
from typing import Any, BinaryIO
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import FileDB, ModelDB
from app.services.file import _create_file_on_disk, get_file_path_by_id
from app.services.file_normalize import normalize_content_to_csv


# router
def set_progress_model_db_by_id(
    project_id: int,
    model_id: int,
    db: Session,
    progress: int,
    metrics: dict[str, Any] | None,
    graphs: dict[str, Any] | None,
) -> ModelDB:
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
def get_prediction_files_by_id(
    project_id: int, model_id: int, db: Session
) -> set[Path]:

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
    project_id: int,
    db: Session,
    name: str,
    file: BinaryIO,
) -> FileDB:
    content, total_rows = normalize_content_to_csv(file)

    file_db = FileDB(
        name=name, project_id=project_id, total_rows=total_rows, is_labeled=True
    )
    db.add(file_db)
    db.flush()

    _create_file_on_disk(project_id, file_db.id, content)

    db.commit()
    db.refresh(file_db)

    return file_db

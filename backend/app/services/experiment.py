from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.db import ExperimentDB, ModelDB, FileDB
from app.services.project import is_owner_of_project
from app.services.model import is_owner_of_model


def _is_owner_of_experiment(
    project_id: int, experiment_id: int, user_id: int, db: Session
) -> None:
    is_owner_of_project(db, project_id, user_id)

    if (
        db.query(ExperimentDB)
        .filter(ExperimentDB.id == experiment_id, ExperimentDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к эксперименту")


def _fetch_experiment_db_by_id(
    db: Session, project_id: int, user_id: int, file_id: int
) -> FileDB:
    _is_owner_of_experiment(db, project_id, user_id, file_id)

    file_db = db.query(FileDB).filter(FileDB.id == file_id).first()
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return file_db


def create_experiment(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
    name: str,
    test_file_ids: List[int] | None = None,
) -> ExperimentDB:
    is_owner_of_model(db, project_id, user_id, model_id)

    model = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    experiment = ExperimentDB(name=name, project_id=project_id, model_id=model_id)
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    if test_file_ids:
        files = (
            db.query(FileDB)
            .filter(FileDB.id.in_(test_file_ids), FileDB.project_id == project_id)
            .all()
        )
        experiment.test_files = files
        db.commit()
    return experiment


def delete_experiment_by_id(
    project_id: int, experiment_id: int, user_id: int, db: Session
) -> None:
    _is_owner_of_experiment(
        project_id=project_id, experiment_id=experiment_id, user_id=user_id, db=db
    )

    experiment = (
        db.query(ExperimentDB)
        .filter(ExperimentDB.id == experiment_id, ExperimentDB.project_id == project_id)
        .first()
    )
    if not experiment:
        raise HTTPException(status_code=404, detail="Эксперимент не найден")

    db.delete(experiment)
    db.commit()

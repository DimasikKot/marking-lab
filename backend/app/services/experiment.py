from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.db import ExperimentDB
from app.services.project import is_owner_of_project
from app.services.model import is_owner_of_model


def _is_owner_of_experiment(
    project_id: int, experiment_id: int, user_id: int, db: Session
) -> None:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(ExperimentDB)
        .filter(ExperimentDB.id == experiment_id, ExperimentDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к эксперименту")


# router
def fetch_experiment_db_by_id(
    project_id: int, experiment_id: int, user_id: int, db: Session
) -> ExperimentDB:
    _is_owner_of_experiment(
        project_id=project_id, experiment_id=experiment_id, user_id=user_id, db=db
    )

    experiment_db = (
        db.query(ExperimentDB).filter(ExperimentDB.id == experiment_id).first()
    )
    if not experiment_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return experiment_db


# router
def create_experiment(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
    name: str,
) -> ExperimentDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    experiment_db = ExperimentDB(name=name, project_id=project_id, model_id=model_id)

    db.add(experiment_db)
    db.commit()
    db.refresh(experiment_db)

    return experiment_db


# router
def delete_experiment_by_id(
    project_id: int, experiment_id: int, user_id: int, db: Session
) -> None:
    experiment_db = fetch_experiment_db_by_id(
        project_id=project_id, experiment_id=experiment_id, user_id=user_id, db=db
    )

    db.delete(experiment_db)
    db.commit()

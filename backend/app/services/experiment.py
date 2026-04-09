from typing import List
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import Experiment, Model, File
from app.services.project import is_owner_of_project
from app.services.file import read_file_from_disk
from app.services.model import is_owner_of_model


def is_owner_of_experiment(
    db: Session, project_id: int, user_id: int, experiment_id: int
) -> None:
    is_owner_of_project(db, project_id, user_id)

    if (
        db.query(Experiment)
        .filter(Experiment.id == experiment_id, Experiment.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к эксперименту")


def create_experiment(
    db: Session,
    project_id: int,
    user_id: int,
    name: str,
    model_id: int,
    test_file_ids: List[int] | None = None,
) -> Experiment:
    is_owner_of_model(db, project_id, user_id, model_id)

    model = (
        db.query(Model)
        .filter(Model.id == model_id, Model.project_id == project_id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    experiment = Experiment(name=name, project_id=project_id, model_id=model_id)
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    if test_file_ids:
        files = (
            db.query(File)
            .filter(File.id.in_(test_file_ids), File.project_id == project_id)
            .all()
        )
        experiment.test_files = files
        db.commit()
    return experiment


# Нужно переделать
async def run_experiment(
    db: Session,
    project_id: int,
    user_id: int,
    experiment_id: int,
) -> Experiment:
    """Тестирование модели на test_files"""
    is_owner_of_experiment(db, project_id, user_id, experiment_id)

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Эксперимент не найден")

    test_data = []
    # for f in experiment.test_files:
    #     content = read_file_from_disk(project_id, f.id)
    #     if content:
    #         test_data.extend(parse_bio_csv(content))  # flat list of sentences

    async with AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{settings.ML_URL}/ner/evaluate",
            json={
                "test_data": test_data,
                "model_parameters": experiment.model.parameters or {},
            },
        )
        result = response.json()

    experiment.results = result.get("results")
    experiment.graphs = result.get("graphs")
    experiment.is_draft = False
    db.commit()
    db.refresh(experiment)
    return experiment


async def delete_experiment_by_id(
    db: Session, project_id: int, user_id: int, experiment_id: int
) -> None:
    is_owner_of_experiment(db, project_id, user_id, experiment_id)

    experiment = (
        db.query(Experiment)
        .filter(Experiment.id == experiment_id, Experiment.project_id == project_id)
        .first()
    )
    if not experiment:
        raise HTTPException(status_code=404, detail="Эксперимент не найден")

    db.delete(experiment)
    db.commit()

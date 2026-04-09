from pyexpat import model
from typing import List
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import Experiment, Model, File
from app.services.project import is_owner_of_project
from app.services.file import parse_bio_csv, read_file_from_disk


def is_owner_of_experiment(db: Session, project_id: int, user_id: int, experiment_id: int) -> bool:
    if not is_owner_of_project(db, project_id, user_id):
        return False
    return db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project_id
    ).first() is not None


def create_experiment(
    db: Session,
    project_id: int,
    user_id: int,
    name: str,
    model_id: int,
    test_file_ids: List[int] | None = None,
) -> Experiment | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    # Проверяем, что модель принадлежит проекту
    model = db.query(Model).filter(Model.id == model_id, Model.project_id == project_id).first()
    if not model:
        return None

    experiment = Experiment(name=name, project_id=project_id, model_id=model_id)
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    if test_file_ids:
        files = db.query(File).filter(
            File.id.in_(test_file_ids),
            File.project_id == project_id
        ).all()
        experiment.test_files = files
        db.commit()
    return experiment


async def run_experiment(
    db: Session,
    project_id: int,
    user_id: int,
    experiment_id: int,
) -> Experiment | None:
    """Тестирование модели на test_files"""
    if not is_owner_of_experiment(db, project_id, user_id, experiment_id):
        return None

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment or not experiment.model or not experiment.test_files:
        return None

    test_data = []
    for f in experiment.test_files:
        content = read_file_from_disk(project_id, f.id)
        if content:
            test_data.extend(parse_bio_csv(content))   # flat list of sentences

    async with AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{settings.ML_URL}/ner/evaluate",
            json={
                "test_data": test_data,
                "model_parameters": experiment.model.parameters or {}
            }
        )
        result = response.json()

    experiment.results = result.get("results")
    experiment.graphs = result.get("graphs")
    experiment.is_draft = False
    db.commit()
    db.refresh(experiment)
    return experiment
from fastapi import APIRouter, Depends, Form, Form, HTTPException, Path
from pydantic import BaseModel
from datetime import datetime
from typing import List

from app.services.get_current_user_id import get_current_user_id
from app.services.experiment import (
    create_experiment,
    delete_experiment_by_id,
    run_experiment,
)
from app.core.database import get_db
from sqlalchemy.orm import Session


router = APIRouter()


class ExperimentResponse(BaseModel):
    id: int
    name: str
    model_id: int | None
    is_draft: bool
    results: dict | None = None
    graphs: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=ExperimentResponse)
async def post_create_experiment(
    project_id: int = Path(...),
    name: str = Form(...),
    model_id: int = Form(...),
    test_file_ids: List[int] | None = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    exp = create_experiment(db, project_id, user_id, name, model_id, test_file_ids)
    if not exp:
        raise HTTPException(status_code=400, detail="Ошибка создания эксперимента")
    return exp


@router.post("/{experiment_id}/run", response_model=ExperimentResponse)
async def post_run_experiment(
    project_id: int = Path(...),
    experiment_id: int = Path(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    exp = await run_experiment(db, project_id, user_id, experiment_id)
    if not exp:
        raise HTTPException(status_code=400, detail="Не удалось запустить тестирование")
    return exp


class DeleteResponse(BaseModel):
    detail: str
    success: bool


# Нужно переделать
@router.delete("/{experiment_id}", response_model=DeleteResponse)
async def delete_experiment(
    experiment_id: int = Path(...),
    project_id: int = Path(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    delete_experiment_by_id(
        db, experiment_id=experiment_id, project_id=project_id, user_id=user_id
    )
    return DeleteResponse(detail="Эксперимент успешно удален", success=True)

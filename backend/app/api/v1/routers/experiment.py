from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel

from app.services.get_user_id import get_user_id
from app.services.experiment import (
    delete_experiment_by_id,
)
from app.core.database import get_db
from sqlalchemy.orm import Session


router = APIRouter()


class DeleteExperimentResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{experiment_id}", response_model=DeleteExperimentResponse)
async def delete_experiment(
    project_id: int = Path(...),
    experiment_id: int = Path(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_experiment_by_id(
        project_id=project_id, experiment_id=experiment_id, user_id=user_id, db=db
    )

    return DeleteExperimentResponse(detail="Эксперимент успешно удален", success=True)

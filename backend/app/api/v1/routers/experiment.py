from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.api.v1.routers.echo import GetEchoResponse
from app.services.get_user_id import get_user_id
from app.core.database import get_db
from app.services.experiment import (
    delete_experiment_by_id,
)


router = APIRouter()


@router.delete("/{experiment_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int = Path(...),
    experiment_id: int = Path(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_experiment_by_id(
        project_id=project_id, experiment_id=experiment_id, user_id=user_id, db=db
    )

    return GetEchoResponse(detail="Эксперимент успешно удален", success=True)

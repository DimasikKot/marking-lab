from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Form, Path
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.get_user_id import get_user_id
from app.services.model import (
    create_model,
    delete_model_by_id,
    fetch_models_by_project_id,
)
from app.core.database import get_db


router = APIRouter()


class ModelResponse(BaseModel):
    id: int
    name: str
    is_draft: bool
    saved_in_memory: bool
    created_at: datetime
    updated_at: datetime
    parameters: dict[str, Any] | None = None

    class Config:
        from_attributes = True


@router.post("/", response_model=ModelResponse)
async def post_create_model(
    project_id: int = Path(...),
    name: str = Form(...),
    training_file_ids: list[int] | None = None,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = create_model(
        project_id=project_id,
        user_id=user_id,
        db=db,
        name=name,
        training_file_ids=training_file_ids,
    )
    return model_db


@router.get("/", response_model=list[ModelResponse])
async def get_models(
    project_id: int,
    sort: str | None,
    search: str | None,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    models_db = fetch_models_by_project_id(
        project_id=project_id, user_id=user_id, db=db, sort=sort, search=search
    )
    return models_db


class DeleteResponse(BaseModel):
    detail: str
    success: bool


# Нужно переделать
@router.delete("/{model_id}", response_model=DeleteResponse)
async def delete_model(
    model_id: int = Path(...),
    project_id: int = Path(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return DeleteResponse(detail="Модель успешно удалена", success=True)

from fastapi import APIRouter, Depends, Form, HTTPException, Path, Query
from pydantic import BaseModel
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.services.get_current_user_id import get_current_user_id
from app.services.model import (
    create_model,
    delete_model_by_id,
    fetch_models_by_project_id,
    train_model,
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
    parameters: dict | None = None

    class Config:
        from_attributes = True


@router.post("/", response_model=ModelResponse)
async def post_create_model(
    project_id: int = Path(...),
    name: str = Form(...),
    training_file_ids: List[int] | None = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    model = create_model(db, project_id, user_id, name, training_file_ids)
    return model


@router.get("/", response_model=list[ModelResponse])
async def get_models(
    project_id: int,
    search: str | None = Query(None),
    sort: str | None = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    models = fetch_models_by_project_id(db, project_id, user_id, search, sort)
    return models


@router.post("/train")
async def post_train_model(
    project_id: int = Path(...),
    file_id: int = Form(...),
):
    model = await train_model(project_id, file_id)
    if not model:
        raise HTTPException(status_code=400, detail="Не удалось запустить обучение")
    return model


class DeleteResponse(BaseModel):
    detail: str
    success: bool


# Нужно переделать
@router.delete("/{model_id}", response_model=DeleteResponse)
async def delete_model(
    model_id: int = Path(...),
    project_id: int = Path(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(db, model_id=model_id, project_id=project_id, user_id=user_id)
    return DeleteResponse(detail="Модель успешно удалена", success=True)

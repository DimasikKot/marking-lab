from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.get_user_id import get_user_id
from app.core.database import get_db
from app.services.model import (
    SortType,
    create_model,
    delete_model_by_id,
    fetch_models_by_project_id,
)


router = APIRouter()


class PostModelRequest(BaseModel):
    name: str


class PostModelResponse(BaseModel):
    id: int
    name: str
    is_draft: bool
    saved_in_memory: bool
    created_at: datetime
    updated_at: datetime
    parameters: dict[str, Any] | None = None

    class Config:
        from_attributes = True


@router.post("/", response_model=PostModelResponse)
async def post(
    project_id: int,
    data: PostModelRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = create_model(
        project_id=project_id,
        user_id=user_id,
        db=db,
        name=data.name,
    )

    return model_db


class GetResponse(BaseModel):
    files: list[PostModelResponse]


@router.get("/", response_model=GetResponse)
async def get(
    project_id: int,
    sort: SortType | None = Query(
        None,
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени файла"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    models_db = fetch_models_by_project_id(
        project_id=project_id, user_id=user_id, db=db, sort=sort, search=search
    )

    return models_db


class DeleteModelResponse(BaseModel):
    detail: str
    success: bool


# Нужно переделать
@router.delete("/{model_id}", response_model=DeleteModelResponse)
async def delete_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return DeleteModelResponse(detail="Модель успешно удалена", success=True)

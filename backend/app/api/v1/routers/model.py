from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.routers.echo import GetEchoResponse
from app.services.get_user_id import get_user_id
from app.core.database import get_db
from app.services.model import (
    SortType,
    create_model,
    delete_model_by_id,
    fetch_model_db_by_id,
    fetch_models_db_by_project_id,
    train_model_by_id,
    update_model_db_by_id,
)


router = APIRouter()


class ModelDbResponse(BaseModel):
    id: int
    name: str
    is_draft: bool
    saved_in_memory: bool
    parameters: dict[str, Any]
    metrics: dict[str, Any]
    files_ids: list[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostModelRequest(BaseModel):
    name: str
    files_ids: list[int] | None = None


@router.post("", response_model=ModelDbResponse)
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
        files_ids=data.files_ids,
    )

    return ModelDbResponse(
        files_ids=[file.id for file in model_db.files], **model_db.__dict__
    )


class GetModelsResponse(BaseModel):
    data: list[ModelDbResponse]


@router.get("", response_model=GetModelsResponse)
async def get(
    project_id: int,
    sort: SortType | None = Query(
        "updated_at_desc",
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени модели"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
) -> GetModelsResponse:
    models_db = fetch_models_db_by_project_id(
        project_id=project_id, user_id=user_id, db=db, sort=sort, search=search
    )

    return GetModelsResponse(
        data=[
            ModelDbResponse(
                files_ids=[file.id for file in model_db.files], **model_db.__dict__
            )
            for model_db in models_db
        ]
    )


@router.get("/{model_id}", response_model=ModelDbResponse)
async def get_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    return ModelDbResponse(
        files_ids=[file.id for file in model_db.files], **model_db.__dict__
    )


class PatchModelDbRequest(BaseModel):
    name: str | None = None
    parameters: dict[str, Any] | None = None
    files_ids: list[int] | None = None


@router.patch("/{model_id}", response_model=ModelDbResponse)
async def patch_by_id(
    project_id: int,
    model_id: int,
    data: PatchModelDbRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = update_model_db_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
        name=data.name,
        parameters=data.parameters,
        files_ids=data.files_ids,
    )

    return ModelDbResponse(
        files_ids=[file.id for file in model_db.files], **model_db.__dict__
    )


@router.get("/{model_id}/train", response_model=ModelDbResponse)
async def get_by_id_train(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = train_model_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    return ModelDbResponse(
        files_ids=[file.id for file in model_db.files], **model_db.__dict__
    )


@router.delete("/{model_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Модель успешно удалена", success=True)

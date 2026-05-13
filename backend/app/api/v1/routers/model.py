from datetime import datetime
from typing import Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.api.v1.routers.echo import GetEchoResponse
from app.models.db import ModelDB
from app.services.user import get_user_id
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
    progress: int
    parameters: dict[str, Any]
    metrics: dict[str, Any]
    graphs: dict[str, Any]

    training_files_ids: list[int]
    prediction_files_ids: list[int]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def ModelDbToResponse(model_db: ModelDB) -> ModelDbResponse:
    training_files_ids = [
        link.file_id for link in model_db.file_links if link.role == "training"
    ]

    prediction_files_ids = [
        link.file_id for link in model_db.file_links if link.role == "prediction"
    ]

    return ModelDbResponse(
        id=model_db.id,
        name=model_db.name,
        progress=model_db.progress,
        parameters=model_db.parameters,
        metrics=model_db.metrics,
        graphs=model_db.graphs,
        training_files_ids=training_files_ids,
        prediction_files_ids=prediction_files_ids,
        created_at=model_db.created_at,
        updated_at=model_db.updated_at,
    )


class PostModelRequest(BaseModel):
    name: str
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None


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
        parameters=data.parameters,
        training_files_ids=data.training_files_ids,
        prediction_files_ids=data.prediction_files_ids,
    )

    return ModelDbToResponse(model_db=model_db)


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
        data=[ModelDbToResponse(model_db=model_db) for model_db in models_db]
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

    return ModelDbToResponse(model_db=model_db)


class PatchModelDbRequest(BaseModel):
    name: str | None = None
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None


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
        training_files_ids=data.training_files_ids,
        prediction_files_ids=data.prediction_files_ids,
    )

    return ModelDbToResponse(model_db=model_db)


@router.get("/{model_id}/train", response_model=ModelDbResponse)
async def get_by_id_train(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = await train_model_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
    )

    return ModelDbToResponse(model_db=model_db)


@router.delete("/{model_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Модель успешно удалена", success=True)

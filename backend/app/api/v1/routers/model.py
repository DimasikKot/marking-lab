from datetime import datetime
import json
import tempfile
from typing import Any
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from app.api.v1.routers.echo import GetEchoResponse
from app.api.v1.routers.file import FileDbResponse
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
    stop_train_model_by_id,
    update_model_db_by_id,
)

router = APIRouter()


class ModelListResponse(BaseModel):
    id: int
    name: str
    progress: int
    parameters: dict[str, Any]
    metrics: dict[str, Any]

    training_files: list[FileDbResponse]
    prediction_files: list[FileDbResponse]
    predicted_files: list[FileDbResponse]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def ToModelListResponse(model_db: ModelDB) -> ModelListResponse:
    training_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "training" and link.file is not None
    ]

    prediction_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "for_prediction" and link.file is not None
    ]

    predicted_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "predicted" and link.file is not None
    ]

    return ModelListResponse(
        id=model_db.id,
        name=model_db.name,
        progress=model_db.progress,
        parameters=model_db.parameters,
        metrics=model_db.metrics,
        training_files=training_files,
        prediction_files=prediction_files,
        predicted_files=predicted_files,
        created_at=model_db.created_at,
        updated_at=model_db.updated_at,
    )


class ModelFullResponse(ModelListResponse):
    graphs: dict[str, str]

    class Config:
        from_attributes = True


def ToModelFullResponse(model_db: ModelDB) -> ModelFullResponse:
    model_list_response = ToModelListResponse(model_db)

    return ModelFullResponse(
        id=model_list_response.id,
        name=model_list_response.name,
        progress=model_list_response.progress,
        parameters=model_list_response.parameters,
        metrics=model_list_response.metrics,
        graphs=model_db.graphs,
        training_files=model_list_response.training_files,
        prediction_files=model_list_response.prediction_files,
        predicted_files=model_list_response.predicted_files,
        created_at=model_list_response.created_at,
        updated_at=model_list_response.updated_at,
    )


class PostModelRequest(BaseModel):
    name: str
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise HTTPException(
                status_code=400,
                detail="Название модели не должно превышать 255 символов",
            )
        return v

    @field_validator("training_files_ids")
    def validate_training_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 тренировочных файлов")
        return v

    @field_validator("prediction_files_ids")
    def validate_prediction_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 файлов, которые будут размечены")
        return v


@router.post("", response_model=ModelListResponse)
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

    return ToModelListResponse(model_db=model_db)


class GetModelsResponse(BaseModel):
    data: list[ModelListResponse]


@router.get("", response_model=GetModelsResponse)
async def get(
    project_id: int,
    sort: SortType | None = Query(
        "created_at_desc",
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
        data=[ToModelListResponse(model_db=model_db) for model_db in models_db]
    )


@router.get("/{model_id}", response_model=ModelFullResponse)
async def get_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    return ToModelFullResponse(model_db=model_db)


class PatchModelFullRequest(BaseModel):
    name: str | None = None
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise ValueError("Название модели не должно превышать 255 символов")
        return v

    @field_validator("training_files_ids")
    def validate_training_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 тренировочных файлов")
        return v

    @field_validator("prediction_files_ids")
    def validate_prediction_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 файлов, которые будут размечены")
        return v


@router.patch("/{model_id}", response_model=ModelFullResponse)
async def patch_by_id(
    project_id: int,
    model_id: int,
    data: PatchModelFullRequest,
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

    return ToModelFullResponse(model_db=model_db)


@router.get("/{model_id}/train", response_model=ModelFullResponse)
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

    return ToModelFullResponse(model_db=model_db)


@router.get("/{model_id}/download")
def download_model(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    # -------- parameters --------
    params = model_db.parameters

    # -------- files --------
    training_files = [
        f'BASE_DIR / "{link.file.name}.csv"'
        for link in model_db.file_links
        if link.role == "training" and link.file is not None
    ]

    prediction_files = [
        f'BASE_DIR / "{link.file.name}_prediction.csv"'
        for link in model_db.file_links
        if link.role == "for_prediction" and link.file is not None
    ]

    # -------- load template --------
    with open("app/models/model_worker.py", "r", encoding="utf-8") as f:
        template = f.read()

    TRAINING_FILES = ("{TRAINING_FILES}",)
    PREDICTING_FILES = ("{PREDICTING_FILES}",)

    # -------- render --------
    rendered = template.format(
        EPOCHS=params.get("Эпохи", 2),
        BATCH_SIZE=params.get("Размер батчей", 16),
        BASE_MODEL=params.get("Базовая модель", "albert-base-v2"),
        LEARNING_RATE=params.get("Скорость обучения", 2e-5),
        TRAINING_SIZE=params.get("Размер тренировочного набора", 0.8),
        MAX_LINE_LENGTH=params.get("Максимальная длина предложения", 128),
        TRAINING_FILES=",\n    ".join(training_files),
        PREDICTING_FILES=",\n    ".join(prediction_files),
    )

    # -------- write temp file --------
    tmp = tempfile.NamedTemporaryFile(
        mode="w", delete=False, suffix=".py", encoding="utf-8"
    )
    tmp.write(rendered)
    tmp.close()

    return FileResponse(
        tmp.name,
        filename=model_db.name + "_worker.py",
        media_type="text/x-python",
    )


@router.delete("/{model_id}/train", response_model=ModelFullResponse)
async def stop_train_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = stop_train_model_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
    )

    return ToModelFullResponse(model_db=model_db)


@router.delete("/{model_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Модель успешно удалена", success=True)

from datetime import datetime
import io
from typing import Any
import zipfile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    UploadFile,
)

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.routers.file import FileDbResponse
from app.api.v1.routers.model import ModelDbToResponse
from app.services.train import (
    create_prediction_file_by_project_id,
    get_prediction_files_by_id,
    set_progress_model_db_by_id,
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


class PostProgressRequest(BaseModel):
    uuid: str
    progress: int
    metrics: dict[str, Any] | None = None
    graphs: dict[str, Any] | None = None


@router.post("/progress", response_model=ModelDbResponse)
async def set_progress_by_id(
    project_id: int,
    model_id: int,
    data: PostProgressRequest,
    db: Session = Depends(get_db),
):
    if data.uuid != str(project_id - model_id) + settings.TRAIN_ACCESS_TOKEN_SECRET:
        raise HTTPException(status_code=400, detail="Неверный uuid")

    model_db = set_progress_model_db_by_id(
        project_id=project_id,
        model_id=model_id,
        db=db,
        progress=data.progress,
        metrics=data.metrics,
        graphs=data.graphs,
    )

    return ModelDbToResponse(model_db=model_db)


@router.get("/prediction")
async def get_by_id_predict(
    project_id: int,
    model_id: int,
    uuid: str,
    db: Session = Depends(get_db),
):
    if uuid != str((project_id - 51) * 2 - model_id + 231) * 3:
        raise HTTPException(status_code=400, detail="Неверный uuid")

    prediction_files_paths = get_prediction_files_by_id(
        project_id=project_id,
        model_id=model_id,
        db=db,
    )

    if not prediction_files_paths:
        raise HTTPException(status_code=404, detail="Файлы не найдены")

    # zip в памяти
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w") as zipf:
        for file_path in prediction_files_paths:
            zipf.write(file_path, arcname=file_path.name)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=prediction_files.zip"},
    )


@router.post("/prediction", response_model=FileDbResponse)
async def post_file(
    project_id: int = Path(...),
    model_id: int = Path(...),
    uuid: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if uuid != str((project_id - 51) * 2 - model_id + 231) * 3:
        raise HTTPException(status_code=400, detail="Неверный uuid")

    file_db = create_prediction_file_by_project_id(
        project_id=project_id,
        db=db,
        name=name,
        file=file.file,
    )

    return file_db

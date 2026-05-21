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
    UploadFile,
)

from app.core.database import get_db
from app.api.v1.routers.file import FileDbResponse
from app.api.v1.routers.model import ModelFullResponse, ToModelFullResponse
from app.services.train import (
    create_prediction_file_by_project_id,
    get_prediction_files_by_id,
    get_training_files_by_id,
    set_progress_model_db_by_id,
)

router = APIRouter()


class GetTrainFilesRequest(BaseModel):
    train_access_token: str


@router.post("/train/get_files", response_class=StreamingResponse)
async def get_train_files(
    data: GetTrainFilesRequest,
    db: Session = Depends(get_db),
):
    training_files_paths = get_training_files_by_id(
        train_access_token=data.train_access_token, db=db
    )

    if not training_files_paths:
        raise HTTPException(status_code=404, detail="Файлы не найдены")

    # zip в памяти
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w") as zipf:
        for file_path in training_files_paths:
            zipf.write(file_path, arcname=file_path.stem)  # Было file_path.name

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=prediction_files.zip"},
    )


class PostTrainProgressRequest(BaseModel):
    train_access_token: str
    progress: int
    parameters: dict[str, Any] | None = None
    metrics: dict[str, Any] | None = None
    graphs: dict[str, Any] | None = None


@router.post("/train/post_progress", response_model=ModelFullResponse)
async def post_train_progress(
    data: PostTrainProgressRequest,
    db: Session = Depends(get_db),
):
    model_db = set_progress_model_db_by_id(
        train_access_token=data.train_access_token,
        progress=data.progress,
        parameters=data.parameters,
        metrics=data.metrics,
        graphs=data.graphs,
        db=db,
    )

    return ToModelFullResponse(model_db=model_db)


class GetPredictionFilesRequest(BaseModel):
    train_access_token: str


@router.post("/predict/get_files", response_class=StreamingResponse)
async def get_prediction_files(
    data: GetPredictionFilesRequest,
    db: Session = Depends(get_db),
):
    prediction_files_paths = get_prediction_files_by_id(
        train_access_token=data.train_access_token, db=db
    )

    if not prediction_files_paths:
        raise HTTPException(status_code=404, detail="Файлы не найдены")

    # zip в памяти
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w") as zipf:
        for file_path in prediction_files_paths:
            zipf.write(file_path, arcname=file_path.stem)  # Было file_path.name

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=prediction_files.zip"},
    )


@router.post("/predict/post_file", response_model=FileDbResponse)
async def post_prediction_file(
    train_access_token: str = Form(...),
    origin_file_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_db = create_prediction_file_by_project_id(
        train_access_token=train_access_token,
        origin_file_id=origin_file_id,
        file=file.file,
        db=db,
    )

    return file_db

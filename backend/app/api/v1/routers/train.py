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
    UploadFile,
)

from app.core.database import get_db
from app.api.v1.routers.file import FileDbResponse
from app.api.v1.routers.model import ModelDbResponse, ModelDbToResponse
from app.services.train import (
    create_prediction_file_by_project_id,
    get_prediction_files_by_id,
    set_progress_model_db_by_id,
)

router = APIRouter()


class PostProgressRequest(BaseModel):
    train_access_token: str
    progress: int
    metrics: dict[str, Any] | None = None
    graphs: dict[str, Any] | None = None


@router.post("/progress", response_model=ModelDbResponse)
async def set_progress_by_id(
    data: PostProgressRequest,
    db: Session = Depends(get_db),
):
    model_db = set_progress_model_db_by_id(
        train_access_token=data.train_access_token,
        progress=data.progress,
        metrics=data.metrics,
        graphs=data.graphs,
        db=db,
    )

    return ModelDbToResponse(model_db=model_db)


class GetPredictionRequest(BaseModel):
    train_access_token: str


@router.get("/prediction")
async def get_by_id_predict(
    data: GetPredictionRequest,
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
            zipf.write(file_path, arcname=file_path.name)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=prediction_files.zip"},
    )


@router.post("/prediction", response_model=FileDbResponse)
async def post_file(
    train_access_token: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_db = create_prediction_file_by_project_id(
        train_access_token=train_access_token,
        name=name,
        file=file.file,
        db=db,
    )

    return file_db

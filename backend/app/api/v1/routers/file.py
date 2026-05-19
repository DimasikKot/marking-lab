from datetime import datetime
from typing import Any
from numpy import ceil
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    Form,
    Path,
    Query,
    UploadFile,
)

from app.api.v1.routers.echo import GetEchoResponse
from app.models.db import FileDB, ModelDB
from app.services.user import get_user_id
from app.core.database import get_db
from app.services.file import (
    Row,
    SortType,
    create_file_by_project_id,
    delete_file_by_id,
    fetch_files_db_by_project_id,
    get_page_by_id,
    update_page_by_id,
    update_file_db_by_id,
)

router = APIRouter()


class FileDbResponse(BaseModel):
    id: int
    name: str
    total_rows: int
    is_labeled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PredictionModelDbResponse(BaseModel):
    id: int
    name: str
    parameters: dict[str, Any]

    training_files: list[FileDbResponse]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FileDbListResponse(FileDbResponse):
    origin_file: FileDbResponse | None
    prediction_model: PredictionModelDbResponse | None

    class Config:
        from_attributes = True


def FileDbListToResponse(file_db: FileDB, db: Session) -> FileDbListResponse:
    def ModelDbToPredictionResponse(model_db: ModelDB) -> PredictionModelDbResponse:
        training_files = [
            FileDbResponse.model_validate(link.file)
            for link in model_db.file_links
            if link.role == "training" and link.file is not None
        ]

        return PredictionModelDbResponse(
            id=model_db.id,
            name=model_db.name,
            parameters=model_db.parameters,
            training_files=training_files,
            created_at=model_db.created_at,
            updated_at=model_db.updated_at,
        )

    prediction_model = next(
        (
            ModelDbToPredictionResponse(link.model)
            for link in file_db.model_links
            if link.role == "predicted"
        ),
        None,
    )

    origin_file_db = (
        db.query(FileDB).filter(FileDB.id == file_db.origin_file_id).first()
    )

    return FileDbListResponse(
        id=file_db.id,
        name=file_db.name,
        total_rows=file_db.total_rows,
        is_labeled=file_db.is_labeled,
        origin_file=(
            FileDbResponse.model_validate(origin_file_db) if origin_file_db else None
        ),
        prediction_model=prediction_model,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
    )


@router.post("", response_model=FileDbResponse)
async def post(
    project_id: int = Path(...),
    # name: str = Form(...) - используем `Form(...)``,
    # тк если передаются файлы, то только с этим атрибутом работает
    name: str = Form(...),
    is_labeled: bool = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db = create_file_by_project_id(
        project_id=project_id,
        user_id=user_id,
        db=db,
        name=name,
        is_labeled=is_labeled,
        file=file.file,
    )

    return file_db


class GetFilesResponse(BaseModel):
    data: list[FileDbListResponse]


@router.get("", response_model=GetFilesResponse)
async def get(
    project_id: int,
    sort: SortType | None = Query(
        "created_at_desc",
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени модели"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
) -> GetFilesResponse:
    files_db = fetch_files_db_by_project_id(
        project_id=project_id,
        user_id=user_id,
        db=db,
        sort=sort,
        search=search,
    )

    return GetFilesResponse(
        data=[FileDbListToResponse(file_db, db) for file_db in files_db]
    )


class GetFilePageResponse(BaseModel):
    id: int
    name: str
    total_rows: int
    total_pages: int
    page: int
    origin_file: FileDbResponse | None
    is_labeled: bool
    tags: dict[str, str]
    colors: dict[str, str]
    rows: list[Row]
    created_at: datetime
    updated_at: datetime


@router.get("/{file_id}", response_model=GetFilePageResponse)
async def get_by_id(
    project_id: int,
    file_id: int,
    page: int = Query(1, description="Номер страницы"),
    limit: int = Query(40, description="Количество строк на странице"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db, page_rows = get_page_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        page=page,
        limit=limit,
    )
    total_pages = ceil(file_db.total_rows / limit)

    def parse_labels(tags):
        labels = {}

        for tag in tags:
            labels[f"B-{tag['value']}"] = tag["label"]

        return labels

    def decrease_tailwind_shade(color: str) -> str:
        component, base, shade = color.split("-")
        new_shade = max(50, int(shade) - 100)
        return f"{component}-{base}-{new_shade}"

    def parse_colors(tags):
        colors = {}

        for tag in tags:
            colors[f"B-{tag['value']}"] = tag["color"]
            colors[f"I-{tag['value']}"] = decrease_tailwind_shade(tag["color"])

        return colors

    origin_file_db = (
        db.query(FileDB).filter(FileDB.id == file_db.origin_file_id).first()
    )

    return GetFilePageResponse(
        id=file_db.id,
        name=file_db.name,
        total_rows=file_db.total_rows,
        total_pages=total_pages,
        page=page,
        origin_file=(
            FileDbResponse.model_validate(origin_file_db) if origin_file_db else None
        ),
        is_labeled=file_db.is_labeled,
        tags=parse_labels(file_db.tags),
        colors=parse_colors(file_db.tags),
        rows=page_rows,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
    )


class PatchFileDbRequest(BaseModel):
    name: str | None = None
    is_labeled: bool | None = None


@router.patch("/{file_id}", response_model=FileDbResponse)
async def patch_by_id(
    project_id: int,
    file_id: int,
    data: PatchFileDbRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db = update_file_db_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        name=data.name,
        is_labeled=data.is_labeled,
    )

    return file_db


class PatchFilePageRequest(BaseModel):
    new_rows: list[Row]


@router.patch("/{file_id}/content", response_model=FileDbResponse)
async def patch_by_id_content(
    project_id: int = Path(...),
    file_id: int = Path(...),
    page: int = Query(1, description="Номер страницы"),
    count: int = Query(40, description="Количество строк на странице"),
    data: PatchFilePageRequest = Body(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db = update_page_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        page=page,
        count=count,
        new_rows=data.new_rows,
    )

    return file_db


@router.delete("/{file_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    file_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_file_by_id(project_id=project_id, file_id=file_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Файл успешно удалён", success=True)

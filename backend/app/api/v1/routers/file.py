from datetime import datetime
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
    data: list[FileDbResponse]


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
        data=[FileDbResponse.model_validate(file_db) for file_db in files_db]
    )


class GetFilePageResponse(BaseModel):
    id: int
    name: str
    total_rows: int
    total_pages: int
    page: int
    rows: list[Row]
    is_labeled: bool
    tags: dict[str, str]
    colors: dict[str, str]
    created_at: datetime
    updated_at: datetime


@router.get("/{file_id}", response_model=GetFilePageResponse)
async def get_by_id(
    project_id: int,
    file_id: int,
    page: int = Query(1, description="Номер страницы"),
    rows: int = Query(40, description="Количество строк на странице"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db, page_rows = get_page_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        page=page,
        rows=rows,
    )
    total_pages = ceil(file_db.total_rows / rows)

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

    return GetFilePageResponse(
        id=file_db.id,
        name=file_db.name,
        total_rows=file_db.total_rows,
        total_pages=total_pages,
        page=page,
        rows=page_rows,
        is_labeled=file_db.is_labeled,
        tags=parse_labels(file_db.tags),
        colors=parse_colors(file_db.tags),
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

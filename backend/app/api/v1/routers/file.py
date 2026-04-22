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

from app.services.get_user_id import get_user_id
from app.core.database import get_db
from app.services.file import (
    Row,
    SortType,
    create_file_by_project_id,
    delete_file_by_id,
    fetch_files_db_by_project_id,
    read_page_by_id,
    update_page_by_id,
    update_file_db_by_id,
)


router = APIRouter()


class PostResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=PostResponse)
async def post_create_file(
    project_id: int = Path(...),
    file: UploadFile = File(...),
    # name: str = Form(...) - используем `Form(...)``,
    # тк если передаются файлы, то только с этим атрибутом работает
    name: str = Form(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file = create_file_by_project_id(
        project_id=project_id,
        user_id=user_id,
        db=db,
        file=file.file,
        name=name,
    )

    return file


class GetResponse(BaseModel):
    data: list[PostResponse]


@router.get("/", response_model=GetResponse)
async def get_files(
    project_id: int,
    sort: SortType | None = Query(
        "updated_at_desc",
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени модели"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    files_db = fetch_files_db_by_project_id(
        project_id=project_id,
        user_id=user_id,
        db=db,
        sort=sort,
        search=search,
    )

    return GetResponse(
        data=[PostResponse.model_validate(file_db) for file_db in files_db]
    )


class GetFileResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    page: int
    total_pages: int
    total_rows: int
    rows: list[Row]


@router.get("/{file_id}", response_model=GetFileResponse)
async def get_file(
    project_id: int,
    file_id: int,
    page: int = Query(1, description="Номер страницы"),
    rows: int = Query(40, description="Количество строк на странице"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db, page_rows = read_page_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        page=page,
        rows=rows,
    )
    total_pages = ceil(file_db.total_rows / rows)

    return GetFileResponse(
        id=file_db.id,
        name=file_db.name,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
        page=page,
        total_pages=total_pages,
        total_rows=file_db.total_rows,
        rows=page_rows,
    )


class PatchFileRequest(BaseModel):
    name: str | None = None


@router.patch("/{file_id}", response_model=PostResponse)
async def patch_file(
    project_id: int,
    file_id: int,
    data: PatchFileRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db = update_file_db_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        name=data.name,
    )

    return file_db


class PatchFileContentRequest(BaseModel):
    new_rows: list[Row]


@router.patch("/{file_id}/content", response_model=PostResponse)
async def patch_file_content(
    project_id: int = Path(...),
    file_id: int = Path(...),
    page: int = Query(1, description="Номер страницы"),
    rows: int = Query(40, description="Количество строк на странице"),
    data: PatchFileContentRequest = Body(...),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    file_db = update_page_by_id(
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        db=db,
        page=page,
        rows=rows,
        new_rows=data.new_rows,
    )

    return file_db


class DeleteFileResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{file_id}")
async def delete_file(
    project_id: int,
    file_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_file_by_id(project_id=project_id, file_id=file_id, user_id=user_id, db=db)

    return DeleteFileResponse(detail="Файл успешно удалён", success=True)

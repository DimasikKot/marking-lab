from datetime import datetime
from numpy import ceil
from pydantic import BaseModel
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    Query,
    UploadFile,
)

from app.services.get_user_id import get_user_id
from app.core.database import get_db
from app.services.file_frontend_reading import Row, read_page_from_file
from app.services.file import (
    create_file_by_project_id,
    delete_file_by_id,
    fetch_file_by_id,
    fetch_files_by_project_id,
    get_file_path,
    update_file_content_by_id,
    update_file_by_id,
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
    name: str = Form(...),
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    file_obj = create_file_by_project_id(
        db=db,
        project_id=project_id,
        name=name,
        file=file.file,
        user_id=user_id,
    )
    return file_obj


class GetResponse(BaseModel):
    data: list[PostResponse]


@router.get("/", response_model=GetResponse)
async def get_files(
    project_id: int,
    search: str | None = Query(None, description="Поиск по имени файла"),
    sort: str | None = Query(
        None,
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    files = fetch_files_by_project_id(
        db=db,
        project_id=project_id,
        user_id=user_id,
        search=search,
        sort=sort,
    )
    return GetResponse(data=files)


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
    file_id: int,
    project_id: int,
    page: int | None = 1,
    rows: int | None = 40,
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    file_db = fetch_file_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    file_path = get_file_path(project_id, file_id)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден на диске")

    page_rows = read_page_from_file(file_path, page, rows)
    total_rows = file_db.total_rows
    total_pages = ceil(total_rows / rows) if total_rows else 1

    return GetFileResponse(
        id=file_db.id,
        name=file_db.name,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
        page=page,
        total_pages=total_pages,
        total_rows=total_rows,
        rows=page_rows,
    )


@router.patch("/{file_id}", response_model=PostResponse)
async def patch_file(
    project_id: int = Path(...),
    file_id: int = Path(...),
    name: str = Form(...),
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    file_db = update_file_by_id(
        db=db,
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        new_name=name,
    )

    if not file_db:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении файла")

    return file_db


@router.patch("/{file_id}/content", response_model=PostResponse)
async def patch_file_content(
    project_id: int = Path(...),
    file_id: int = Path(...),
    file: UploadFile = File(...),
    page: int = Form(...),
    rows: int = Form(...),
    new_rows: list[Row] = Form(...),
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    file_db = update_file_content_by_id(
        db=db,
        project_id=project_id,
        file_id=file_id,
        user_id=user_id,
        page=page,
        rows=rows,
        new_rows=new_rows,
    )

    if not file_db:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении файла")

    return file_db


class DeleteResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    project_id: int,
    user_id: int = Depends(get_user_id),
    db=Depends(get_db),
):
    delete_file_by_id(db=db, project_id=project_id, user_id=user_id, file_id=file_id)
    return DeleteResponse(detail="Файл успешно удалён", success=True)

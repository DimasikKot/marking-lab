from datetime import datetime
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
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

from app.services.bio_validator import Line, parse_tsv_to_lines
from app.services.get_current_user_id import get_current_user_id
from app.core.database import get_db
from app.services.file import (
    create_file_by_project_id,
    delete_file_by_id,
    fetch_file_by_id,
    fetch_files_by_project_id,
    read_file_from_disk,
    stream_file_as_json,
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
    user_id: int = Depends(get_current_user_id),
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
    user_id: int = Depends(get_current_user_id),
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
    lines: list[Line]

    class Config:
        from_attributes = True


@router.get("/{file_id}", response_model=GetFileResponse)
async def get_file(
    file_id: int,
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    file_db = fetch_file_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )
    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    content = read_file_from_disk(project_id, file_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Файл не найден на диске")

    lines = parse_tsv_to_lines(content)

    return GetFileResponse(
        id=file_db.id,
        name=file_db.name,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
        lines=lines[:50],
    )


@router.get("/{file_id}/stream")
def get_file_stream(
    file_id: int,
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    file_db = fetch_file_by_id(
        db=db,
        project_id=project_id,
        user_id=user_id,
        file_id=file_id,
    )

    if not file_db:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return StreamingResponse(
        stream_file_as_json(project_id, file_id),
        media_type="application/json",
    )


@router.patch("/{file_id}", response_model=GetFileResponse)
async def patch_file(
    file_id: int = Path(...),
    project_id: int = Path(...),
    file: UploadFile = File(...),
    name: str = Form(...),
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    contents = await file.read()
    try:
        content = contents.decode("utf-8")
    except UnicodeDecodeError:
        content = contents.decode("latin-1")

    file_db = update_file_by_id(
        db=db,
        project_id=project_id,
        user_id=user_id,
        file_id=file_id,
        new_name=name,
        new_content=content,
    )
    if not file_db:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении файла")

    return GetFileResponse(
        id=file_db.id,
        name=file_db.name,
        content=content,
        created_at=file_db.created_at,
        updated_at=file_db.updated_at,
    )


class DeleteResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    delete_file_by_id(db=db, project_id=project_id, user_id=user_id, file_id=file_id)
    return DeleteResponse(detail="Файл успешно удалён", success=True)

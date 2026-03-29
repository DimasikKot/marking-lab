from datetime import datetime
from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, UploadFile
from pydantic import BaseModel

from app.services.get_current_user_id import get_current_user_id
from app.services.file import (
    create_file_by_project_id,
    delete_file_by_id,
    fetch_file_by_id,
    fetch_files_by_project_id,
    update_file_by_id,
)
from app.core.database import get_db


router = APIRouter()


class PostResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=PostResponse)
# При передаче файла в виде multipart/form-data, FastAPI не может автоматически
# извлечь имя файла из заголовков, поэтому мы добавляем его как отдельное поле формы name.
async def post_create_file(
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

    file = create_file_by_project_id(
        db=db, project_id=project_id, name=name, content=content, user_id=user_id
    )
    if file is None:
        raise HTTPException(status_code=400, detail="Ошибка при создании файла")
    return file


class GetResponse(BaseModel):
    data: list[PostResponse]


@router.get("/", response_model=GetResponse)
async def get_files(
    project_id: int, user_id: int = Depends(get_current_user_id), db=Depends(get_db)
):
    files = fetch_files_by_project_id(db=db, project_id=project_id, user_id=user_id)
    if not files:
        print("Ошибка при получении файлов")
        raise HTTPException(status_code=400, detail="Ошибка при получении файлов")
    return GetResponse(data=files)


class GetFileResponse(BaseModel):
    id: int
    name: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/{file_id}", response_model=GetFileResponse)
async def get_file(
    file_id: int,
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    file = fetch_file_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )
    print(file, file_id, project_id, user_id)
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    return file


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

    file = update_file_by_id(
        db=db,
        project_id=project_id,
        user_id=user_id,
        file_id=file_id,
        new_name=name,
        new_content=content,
    )
    if not file:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении файла")
    return file


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
    success = delete_file_by_id(
        db=db, project_id=project_id, user_id=user_id, file_id=file_id
    )
    if not success:
        raise HTTPException(status_code=400, detail="Ошибка при удалении файла")
    return DeleteResponse(detail="Файл успешно удалён", success=True)

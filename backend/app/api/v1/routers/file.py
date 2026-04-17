from datetime import datetime
from numpy import ceil
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

from app.services.get_current_user_id import get_current_user_id
from app.core.database import get_db
from app.services.file import (
    create_file_by_project_id,
    delete_file_by_id,
    fetch_file_by_id,
    fetch_files_by_project_id,
    get_file_path,
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


class Word(BaseModel):
    token: str
    label: str


class Line(BaseModel):
    words: list[Word]


class GetFileResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    page: int
    total_pages: int
    total_rows: int
    rows: list[Line]


def iter_tsv_lines(file_path: Path):
    current_words: list[Word] = []

    with file_path.open("r", encoding="utf-8") as f:
        for raw_line in f:
            raw_line = raw_line.strip()

            # граница предложения
            if not raw_line:
                if current_words:
                    yield Line(words=current_words)
                    current_words = []
                continue

            parts = raw_line.split("\t")

            # пропуск заголовка
            if (
                parts[0].lower() == "token"
                and len(parts) > 1
                and parts[1].lower() == "label"
            ):
                continue

            if len(parts) < 2:
                continue

            token, label = parts[0], parts[1]
            current_words.append(Word(token=token, label=label))

        # последний блок
        if current_words:
            yield Line(words=current_words)


def read_page_from_file(
    file_path: Path,
    page: int,
    rows_per_page: int,
):
    start = (page - 1) * rows_per_page
    end = start + rows_per_page

    result: list[Line] = []
    total_rows = 0

    for idx, line in enumerate(iter_tsv_lines(file_path)):
        if start <= idx < end:
            result.append(line)
        total_rows += 1

        if idx >= end:
            break

    return result, total_rows


@router.get("/{file_id}", response_model=GetFileResponse)
async def get_file(
    file_id: int,
    project_id: int,
    page: int | None = 1,
    rows: int | None = 40,
    user_id: int = Depends(get_current_user_id),
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

    page_rows, total_rows = read_page_from_file(
        file_path=file_path,
        page=page,
        rows_per_page=rows,
    )

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


# @router.get("/{file_id}/stream")
# def get_file_stream(
#     file_id: int,
#     project_id: int,
#     user_id: int = Depends(get_current_user_id),
#     db=Depends(get_db),
# ):
#     file_db = fetch_file_by_id(
#         db=db,
#         project_id=project_id,
#         user_id=user_id,
#         file_id=file_id,
#     )

#     if not file_db:
#         raise HTTPException(status_code=404, detail="Файл не найден")

#     return StreamingResponse(
#         stream_file_as_json(project_id, file_id),
#         media_type="application/json",
#     )


# @router.patch("/{file_id}", response_model=GetFileResponse)
# async def patch_file(
#     file_id: int = Path(...),
#     project_id: int = Path(...),
#     file: UploadFile = File(...),
#     name: str = Form(...),
#     user_id: int = Depends(get_current_user_id),
#     db=Depends(get_db),
# ):
#     contents = await file.read()
#     try:
#         content = contents.decode("utf-8")
#     except UnicodeDecodeError:
#         content = contents.decode("latin-1")

#     file_db = update_file_by_id(
#         db=db,
#         project_id=project_id,
#         user_id=user_id,
#         file_id=file_id,
#         new_name=name,
#         new_content=content,
#     )
#     if not file_db:
#         raise HTTPException(status_code=400, detail="Ошибка при обновлении файла")

#     return GetFileResponse(
#         id=file_db.id,
#         name=file_db.name,
#         content=content,
#         created_at=file_db.created_at,
#         updated_at=file_db.updated_at,
#     )


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

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.get_current_user_id import get_current_user_id
from app.services.project import (
    create_project,
    delete_project_by_id,
    fetch_project_by_id,
    fetch_projects_by_user_id,
    update_project_by_id,
)


router = APIRouter()


class PostProjectsRequest(BaseModel):
    name: str
    description: str


class PostResponse(BaseModel):
    id: int
    name: str
    description: str
    is_public: bool
    created_at: datetime
    updated_at: datetime

    # Возвращаем только нужные поля из модели Project, игнорируя user_id
    class Config:
        from_attributes = True


@router.post("/", response_model=PostResponse)
async def post_create_project(
    data: PostProjectsRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    project = create_project(
        db, user_id=user_id, name=data.name, description=data.description
    )
    return project


class GetResponse(BaseModel):
    data: list[PostResponse]

    class Config:
        from_attributes = True


@router.get("/", response_model=GetResponse)
async def get_projects(
    is_public: bool = Query(
        False, description="Получать только публичные проекты или приватные"
    ),
    search: str | None = Query(None, description="Поиск по имени файла"),
    sort: str | None = Query(
        None,
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    projects = fetch_projects_by_user_id(
        db, user_id=user_id, is_public=is_public, search=search, sort=sort
    )
    return GetResponse(data=projects)


@router.get("/{project_id}", response_model=PostResponse)
async def get_project(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    project = fetch_project_by_id(db, user_id=user_id, project_id=project_id)
    return project


class UpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


@router.patch("/{project_id}", response_model=PostResponse)
async def patch_project(
    project_id: int,
    data: UpdateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if len(data.name) > 255:
        raise HTTPException(status_code=400, detail="Название проекта слишком длинное")
    if len(data.description) > 255:
        raise HTTPException(status_code=400, detail="Описание проекта слишком длинное")

    updated_project = update_project_by_id(
        db,
        project_id=project_id,
        user_id=user_id,
        new_name=data.name,
        new_is_public=data.is_public,
        new_description=data.description,
    )
    return updated_project


class DeleteResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{project_id}", response_model=DeleteResponse)
async def delete_project(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    delete_project_by_id(db, project_id=project_id, user_id=user_id)
    return DeleteResponse(detail="Проект успешно удалён", success=True)


from app.api.v1.routers import file
from app.api.v1.routers import model
from app.api.v1.routers import experiment


router.include_router(file.router, prefix="/{project_id}/files", tags=["Files"])
router.include_router(model.router, prefix="/{project_id}/models", tags=["Models"])
router.include_router(
    experiment.router, prefix="/{project_id}/experiments", tags=["Experiments"]
)

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.get_user_id import get_user_id
from app.services.project import (
    SortType,
    create_project,
    delete_project_by_id,
    fetch_project_db_by_id,
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
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    project_db = create_project(
        user_id=user_id, db=db, name=data.name, description=data.description
    )

    return project_db


class GetResponse(BaseModel):
    data: list[PostResponse | Any]

    class Config:
        from_attributes = True


@router.get("/", response_model=GetResponse)
async def get_projects(
    sort: SortType | None = Query(
        None,
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени проекта"),
    is_public: bool | None = Query(
        None, description="Получать только публичные проекты или приватные"
    ),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    projects_db = fetch_projects_by_user_id(
        db=db,
        user_id=user_id,
        sort=sort,
        search=search,
        is_public=is_public,
    )

    return GetResponse(data=projects_db)


@router.get("/{project_id}", response_model=PostResponse)
async def get_project(
    project_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    project_db = fetch_project_db_by_id(project_id=project_id, user_id=user_id, db=db)

    return project_db


class UpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


@router.patch("/{project_id}", response_model=PostResponse)
async def patch_project(
    project_id: int,
    data: UpdateRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    project_db = update_project_by_id(
        project_id=project_id,
        user_id=user_id,
        db=db,
        new_name=data.name,
        new_description=data.description,
        new_is_public=data.is_public,
    )

    return project_db


class DeleteResponse(BaseModel):
    detail: str
    success: bool


@router.delete("/{project_id}", response_model=DeleteResponse)
async def delete_project(
    project_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_project_by_id(project_id=project_id, user_id=user_id, db=db)

    return DeleteResponse(detail="Проект успешно удалён", success=True)


from app.api.v1.routers import file
from app.api.v1.routers import model
from app.api.v1.routers import experiment


router.include_router(file.router, prefix="/{project_id}/files", tags=["Files"])
router.include_router(model.router, prefix="/{project_id}/models", tags=["Models"])
router.include_router(
    experiment.router, prefix="/{project_id}/experiments", tags=["Experiments"]
)

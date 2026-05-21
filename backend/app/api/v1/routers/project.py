from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from datetime import datetime

from app.api.v1.routers.echo import GetEchoResponse
from app.core.database import get_db
from app.services.user import get_user_id
from app.services.project import (
    SortType,
    create_project,
    delete_project_by_id,
    fetch_project_db_by_id,
    fetch_projects_db_by_user_id,
    update_project_by_id,
)

router = APIRouter()


class PostRequest(BaseModel):
    name: str
    description: str

    @field_validator("name")
    def validate_name(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Название проекта не должно превышать 255 символов",
            )
        return value

    @field_validator("description")
    def validate_description(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Описание проекта не должно превышать 255 символов",
            )
        return value


class PostResponse(BaseModel):
    id: int
    name: str
    description: str
    is_public: bool
    created_at: datetime
    updated_at: datetime

    # Возвращаем только нужные поля из модели Project, игнорируя user_id
    # Вместе с этим нужно использовать model_validate (если где-то список)
    class Config:
        from_attributes = True


@router.post("", response_model=PostResponse)
async def post(
    data: PostRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    project_db = create_project(
        user_id=user_id, db=db, name=data.name, description=data.description
    )

    return project_db


class GetResponse(BaseModel):
    data: list[PostResponse]


@router.get("", response_model=GetResponse)
async def get(
    sort: SortType | None = Query(
        "created_at_desc",
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени проекта"),
    is_public: bool | None = Query(
        None, description="Получать только публичные проекты или приватные"
    ),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    projects_db = fetch_projects_db_by_user_id(
        user_id=user_id,
        db=db,
        sort=sort,
        search=search,
        is_public=is_public,
    )

    return GetResponse(
        data=[PostResponse.model_validate(project_db) for project_db in projects_db]
    )


@router.get("/{project_id}", response_model=PostResponse)
async def get_by_id(
    project_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    project_db = fetch_project_db_by_id(project_id=project_id, user_id=user_id, db=db)

    return project_db


class PatchProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None

    @field_validator("name")
    def validate_name(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Название проекта не должно превышать 255 символов",
            )
        return value

    @field_validator("description")
    def validate_description(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Описание проекта не должно превышать 255 символов",
            )
        return value


@router.patch("/{project_id}", response_model=PostResponse)
async def patch_by_id(
    project_id: int,
    data: PatchProjectRequest,
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


@router.delete("/{project_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_project_by_id(project_id=project_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Проект успешно удалён", success=True)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.api.v1.routers import file
from app.core.database import get_db
from app.services.get_current_user_id import get_current_user_id
from app.services.project import create_project, delete_project_by_id, fetch_project_by_id, fetch_projects_by_user_id, fetch_public_projects_by_user_id, update_project_by_id


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
    db: Session = Depends(get_db)
):
    project = create_project(db, user_id=user_id, name=data.name, description=data.description)
    if project is None:
        raise HTTPException(status_code=400, detail="Ошибка при создании проекта")
    return project


class GetResponse(BaseModel):
    data: list[PostResponse]
    class Config:
        from_attributes = True

@router.get("/", response_model=GetResponse)
async def get_projects(
    public: bool = False,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if public:
        projects = fetch_public_projects_by_user_id(db, user_id=user_id)
    else:
        projects = fetch_projects_by_user_id(db, user_id=user_id)
    return GetResponse(data=projects)


@router.get("/{project_id}", response_model=PostResponse)
async def get_project(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    project = fetch_project_by_id(db, user_id=user_id, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Ошибка при получении проекта")
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
    db: Session = Depends(get_db)
):
    updated_project = update_project_by_id(db, project_id=project_id, user_id=user_id, new_name=data.name, new_is_public=data.is_public, new_description=data.description)
    if updated_project is None:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении проекта")
    return updated_project


class DeleteResponse(BaseModel):
    detail: str

@router.delete("/{project_id}", response_model=DeleteResponse)
async def delete_project(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    success = delete_project_by_id(db, project_id=project_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Ошибка при удалении проекта")
    return DeleteResponse(detail="Проект успешно удалён")


router.include_router(file.router, prefix="/{project_id}/files", tags=["Files"])

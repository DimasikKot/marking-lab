from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.get_current_user_id import get_current_user_id
from app.services.project import create_project, delete_project, fetch_project_by_id, fetch_public_user_projects, fetch_user_projects, update_project


router = APIRouter()


class PostProjectsRequest(BaseModel):
    name: str

class PostProjectsResponse(BaseModel):
    id: int
    name: str
    is_public: bool
    created_at: datetime
    updated_at: datetime

    # Возвращаем только нужные поля из модели Project, игнорируя user_id
    class Config:
        from_attributes = True

@router.post("/projects", response_model=PostProjectsResponse)
async def post_create_project(
    data: PostProjectsRequest, 
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    project = create_project(db, user_id=user_id, name=data.name)
    if project is None:
        raise HTTPException(status_code=400, detail="Ошибка при создании проекта")
    return project


class GetProjectsResponse(BaseModel):
    data: list[PostProjectsResponse]
    class Config:
        from_attributes = True

@router.get("/projects", response_model=GetProjectsResponse)
async def get_user_projects(
    public: bool = False,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if public:
        projects = fetch_public_user_projects(db, user_id=user_id)
    else:
        projects = fetch_user_projects(db, user_id=user_id)
    return GetProjectsResponse(data=projects)


@router.get("/projects/{project_id}", response_model=PostProjectsResponse)
async def get_project_by_id(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    project = fetch_project_by_id(db, user_id=user_id, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Ошибка при получении проекта")
    return project


class DeleteProjectResponse(BaseModel):
    detail: str

@router.delete("/projects/{project_id}", response_model=DeleteProjectResponse)
async def delete_project_by_id(
    project_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    success = delete_project(db, project_id=project_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ошибка при удалении проекта")
    return DeleteProjectResponse(detail="Проект успешно удалён")


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    is_public: bool | None = None

@router.patch("/projects/{project_id}", response_model=PostProjectsResponse)
async def update_project_by_id(
    project_id: int,
    data: UpdateProjectRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    updated_project = update_project(db, project_id=project_id, user_id=user_id, name=data.name, is_public=data.is_public)
    if updated_project is None:
        raise HTTPException(status_code=400, detail="Ошибка при обновлении проекта")

    db.commit()
    db.refresh(updated_project)
    return updated_project
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.db import Project
from app.core.database import get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Annotated
from app.services.user import decode_access_token
from datetime import datetime
router = APIRouter()
security = HTTPBearer(auto_error=False)


class ProjectCreateRequest(BaseModel):
    name: str

class ProjectCreateResponse(BaseModel):
    project_id: int
    is_public: bool
    name: str
    created_at: datetime
    updated_at: datetime


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> int:
    """Возвращает только user_id из токена"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не предоставлен токен авторизации",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный или просроченный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="В токене отсутствует идентификатор пользователя",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        return int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный формат идентификатора пользователя",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/simple-data")
async def get_simple_data(user_id: int = Depends(get_current_user_id)):
    return {"user_id": user_id, "data": "some data"}



@router.post("/projects", response_model=ProjectCreateResponse)
async def create_project(
    project_data: ProjectCreateRequest, 
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    project = Project(
        user_id=current_user_id,
        name=project_data.name
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Явно возвращаем Pydantic-модель с нужными полями
    return ProjectCreateResponse(
        project_id=project.id,
        is_public=project.is_public,   # предполагаем, что поле есть
        name=project.name,
        created_at=project.created_at,
        updated_at=project.updated_at
    )
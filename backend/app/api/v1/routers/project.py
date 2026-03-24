from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.get_current_user_id import get_current_user_id


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
async def create_project(
    project: PostProjectsRequest, 
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    new_project = create_project(db, user_id=user_id, name=project.name)
    return new_project
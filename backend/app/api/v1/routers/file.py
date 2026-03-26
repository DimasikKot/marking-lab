from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel

from app.services.get_current_user_id import get_current_user_id


router = APIRouter()


class PostRequest(BaseModel):
    name: str
    content: int

class PostResponse(BaseModel):
    name: str
    content: str
    class Config:
        from_attributes = True

@router.post("/", response_model=PostResponse)
# При передаче файла в виде multipart/form-data, FastAPI не может автоматически
# извлечь имя файла из заголовков, поэтому мы добавляем его как отдельное поле формы name.
async def post_file(file: UploadFile = File(...), name: str = Form(...), user_id: int = Depends(get_current_user_id)):
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")
    
    data = PostRequest(name=name, content=text)
    return data


class GetFileResponse(BaseModel):
    id: int
    name: str
    content: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class GetResponse(BaseModel):
    data: list[GetFileResponse]

@router.get("/", response_model=GetResponse)
async def get_files(project_id: int, user_id: int = Depends(get_current_user_id)):
    
    
    return GetResponse(data=[])
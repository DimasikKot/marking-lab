from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel

from app.services.get_current_user_id import get_current_user_id


router = APIRouter()


class PostUploadResponse(BaseModel):
    content: str
    filename: str

@router.post("/upload", response_model=PostUploadResponse)
# При передаче файла в виде multipart/form-data, FastAPI не может автоматически
# извлечь имя файла из заголовков, поэтому мы добавляем его как отдельное поле формы name.
async def upload_file(file: UploadFile = File(...), name: str = Form(...), user_id: int = Depends(get_current_user_id)):
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    # Дополнительная обработка в зависимости от расширения
    if file.filename.endswith('.json'):
        import json
        try:
            content = json.loads(text)
            return PostUploadResponse(content=content, filename=name)
        except:
            pass

    return PostUploadResponse(content=text, filename=name)
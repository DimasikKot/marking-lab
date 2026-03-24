from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel


router = APIRouter()


class PostUploadResponse(BaseModel):
    content: str

@router.post("/upload", response_model=PostUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    # Дополнительная обработка в зависимости от расширения
    if file.filename.endswith('.json'):
        import json
        try:
            data = json.loads(text)
            return PostUploadResponse(content=data)
        except:
            pass

    return PostUploadResponse(content=text)
from fastapi import APIRouter, File, UploadFile

router = APIRouter()


@router.post("/upload")
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
            return {"content": data}
        except:
            pass

    return {"content": text}
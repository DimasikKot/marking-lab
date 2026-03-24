from fastapi import APIRouter
from app.core.config import settings
import httpx
from pydantic import BaseModel


router: APIRouter = APIRouter()


class GetBackendResponse(BaseModel):
    detail: str
    status: str = "success"

@router.get("/backend", response_model=GetBackendResponse)
def test_backend():
    return GetBackendResponse(detail="Backend контейнер исправно работает")


@router.get("/ml", response_model=GetBackendResponse)
async def test_ml():
    async with httpx.AsyncClient() as client:
        response_dict = await client.get(settings.ML_URL + "/echos/ml")
        response_json = response_dict.json()

    return GetBackendResponse.model_validate(response_json)


class PostMlRequest(BaseModel):
    text: str

class PostMlResponse(BaseModel):
    words: list[str]

@router.get("/ml_post", response_model=PostMlResponse)
async def test_ml_post():
    async with httpx.AsyncClient() as client:
        response_dict = await client.post(
            settings.ML_URL + "/echos/ml",

            # Преобразуем модель в словарь и отправляем в POST методе
            json=PostMlRequest(text="ML контейнер разделяет слова в методе POST").model_dump()
        )

        # Преобразуем словарь в json
        response_json = response_dict.json()
    
    # Преобразуем json в модель (чтобы взаимодействовать напрямую как с объектом)
    return PostMlResponse.model_validate(response_json)

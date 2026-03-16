from fastapi import APIRouter
from app.schemas.echo import *
from app.core.config import settings
import httpx


router: APIRouter = APIRouter()


@router.get("/backend", response_model=EchoResponse)
def test_backend():
    return EchoResponse(detail="Backend контейнер исправно работает")


@router.get("/ml", response_model=EchoResponse)
async def test_ml():
    async with httpx.AsyncClient() as client:
        response_dict = await client.get(settings.ML_URL + "/echos/ml")
        response_json = response_dict.json()

    return response_json


@router.get("/ml_post", response_model=MLPostResponse)
async def test_ml_post():
    async with httpx.AsyncClient() as client:
        response_dict = await client.post(
            settings.ML_URL + "/echos/ml",

            # Преобразуем модель в словарь и отправляем в POST методе
            json=MLPostRequest(text="ML контейнер разделяет слова в методе POST").model_dump()
        )

        # Преобразуем словарь в json
        response_json = response_dict.json()
    
    # Преобразуем json в модель (чтобы взаимодействовать напрямую как с объектом)
    # В данном случае ничего не делаем, но на будущее знайте, что будем делать так
    return MLPostResponse.model_validate(response_json)

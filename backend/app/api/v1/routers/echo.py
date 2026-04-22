from fastapi import APIRouter, Depends
from pydantic import BaseModel
from httpx import AsyncClient

from app.core.config import settings
from app.services.get_user_id import get_user_id


router: APIRouter = APIRouter()


class GetBackendResponse(BaseModel):
    detail: str
    status: bool


@router.get("/backend", response_model=GetBackendResponse)
async def get_backend():
    return GetBackendResponse(detail="Backend контейнер исправно работает", status=True)


class GetMlResponse(BaseModel):
    detail: str
    status: bool


@router.get("/ml", response_model=GetMlResponse)
async def get_ml():
    async with AsyncClient() as client:
        response_dict = await client.get(settings.ML_URL + "/echos/ml")
        response_json = response_dict.json()

    return GetMlResponse.model_validate(response_json)


class GetMlPostResponse(BaseModel):
    words: list[str]


class PostEchosMlRequest(BaseModel):
    text: str


@router.get("/ml_post", response_model=GetMlResponse)
async def get_ml_post():
    async with AsyncClient() as client:
        response_dict = await client.post(
            settings.ML_URL + "/echos/ml",
            # Преобразуем модель в словарь и отправляем в POST методе
            json=PostEchosMlRequest(
                text="ML контейнер разделяет слова в методе POST"
            ).model_dump(),
        )

        # Преобразуем словарь в json
        response_json = response_dict.json()

    # Преобразуем json в модель (чтобы взаимодействовать напрямую как с объектом)
    return GetMlResponse.model_validate(response_json)


class GetUserResponse(BaseModel):
    user_id: int


@router.get("/user", response_model=GetUserResponse)
async def get_user(user_id: int = Depends(get_user_id)):
    return GetUserResponse(user_id=user_id)

from fastapi import APIRouter
from pydantic import BaseModel
from httpx import AsyncClient

from app.core.config import settings


router: APIRouter = APIRouter()


class GetEchoResponse(BaseModel):
    detail: str
    success: bool


@router.get("/backend", response_model=GetEchoResponse)
async def get_backend():
    return GetEchoResponse(detail="Backend контейнер исправно работает", success=True)


@router.get("/ml", response_model=GetEchoResponse)
async def get_ml():
    async with AsyncClient() as client:
        response_dict = await client.get(settings.ML_URL + "/echos/ml")
        response_json = response_dict.json()

    return response_json

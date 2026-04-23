from fastapi import APIRouter
from pydantic import BaseModel
from httpx import AsyncClient

from app.core.config import settings


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

    return response_json

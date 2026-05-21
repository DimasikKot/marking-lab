from fastapi import APIRouter, HTTPException
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

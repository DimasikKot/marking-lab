from fastapi import APIRouter
from pydantic import BaseModel


router: APIRouter = APIRouter()


class GetEchoResponse(BaseModel):
    detail: str
    success: bool


@router.get("/ml", response_model=GetEchoResponse)
def test_ml():
    return GetEchoResponse(detail="ML контейнер исправно работает", success=True)

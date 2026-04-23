from fastapi import APIRouter
from pydantic import BaseModel


router: APIRouter = APIRouter()


class MlGetResponse(BaseModel):
    detail: str
    status: bool


@router.get("/ml", response_model=MlGetResponse)
def test_ml():
    return MlGetResponse(detail="ML контейнер исправно работает", status=True)

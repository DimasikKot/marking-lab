from fastapi import APIRouter
from pydantic import BaseModel


router: APIRouter = APIRouter()


class MlGetResponse(BaseModel):
    detail: str
    status: str = "success"

@router.get("/ml", response_model=MlGetResponse)
def test_ml():
    return MlGetResponse(detail="ML контейнер исправно работает")


class MlPostRequest(BaseModel):
    text: str

class MlPostResponse(BaseModel):
    words: list[str]

@router.post("/ml", response_model=MlPostResponse)
def test_ml_post(request: MlPostRequest):
    words = request.text.split()
    return MlPostResponse(words=words)

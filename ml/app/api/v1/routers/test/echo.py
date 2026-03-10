from fastapi import APIRouter
from app.schemas.test.echo import *


router: APIRouter = APIRouter()


@router.get("/ml", response_model=EchoResponse)
def test_ml():
    return EchoResponse(detail="ML контейнер исправно работает")


@router.post("/ml", response_model=PostResponse)
def test_ml_post(request: PostRequest):
    words = request.text.split()
    return PostResponse(words=words)

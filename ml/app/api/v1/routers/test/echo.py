from pydantic import BaseModel
from fastapi import APIRouter
from app.schemas.test.echo import EchoResponse, MLRequest, MLResponse


router: APIRouter = APIRouter()


class MLRequest(BaseModel):
    text: str


class EchoResponse(BaseModel):
    detail: str
    status: str = "success"


@router.get("/ml", response_model=EchoResponse)
def test_backend():
    return EchoResponse(detail="ML контейнер исправно работает")


@router.post("/process")
def process(request: MLRequest):
    return {
        "tokens": [t for t in [request.text]]
    }

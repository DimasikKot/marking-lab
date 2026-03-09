from pydantic import BaseModel
from fastapi import APIRouter
import httpx


router: APIRouter = APIRouter()


class MLRequest(BaseModel):
    text: str


class MLResponse(BaseModel):
    tokens: list[str]


class EchoResponse(BaseModel):
    detail: str
    status: str = "success"


@router.get("/backend", response_model=EchoResponse)
def test_backend():
    return EchoResponse(detail="Backend контейнер исправно работает")


@router.get("/ml", response_model=EchoResponse)
async def test_ml():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://ml:8001/process",
            # Преобразуем модель в словарь
            json=MLRequest(text="ML контейнер исправно работает").model_dump()
        )
        # Преобразуем ответ (словарь) в json
        response_data = response.json()
        
        # Преобразуем ответ (json) в модель (чтобы взаимодействовать напрямую как с объектом)
        ml_response = MLResponse.model_validate(response_data)

    # Возвращаем ответ
    return EchoResponse(detail=ml_response.tokens[0])

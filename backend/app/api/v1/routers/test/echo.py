from fastapi import APIRouter
from app.core.config import settings
import httpx
from app.schemas.test.echo import EchoResponse, MLRequest, MLResponse


router: APIRouter = APIRouter()


@router.get("/backend", response_model=EchoResponse)
def test_backend():
    return EchoResponse(detail="Backend контейнер исправно работает")


@router.get("/ml", response_model=EchoResponse)
async def test_ml():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            settings.ML_URL + "api/v1/test/echo/process",
            # Преобразуем модель в словарь
            json=MLRequest(text="ML контейнер исправно работает").model_dump()
        )
        # Преобразуем ответ (словарь) в json
        response_data = response.json()
        
        # Преобразуем ответ (json) в модель (чтобы взаимодействовать напрямую как с объектом)
        ml_response = MLResponse.model_validate(response_data)

    # Возвращаем ответ
    return EchoResponse(detail=ml_response.tokens[0])

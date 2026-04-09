from fastapi import APIRouter
from pydantic import BaseModel

from app.services.model import token_level_accuracy, train_ner_model


router = APIRouter()

class PostRequest(BaseModel):
    text: list[str]
    labels: list[str]

class PostResponse(BaseModel):
    acc: float

@router.post("/", response_model=PostResponse)
async def file_to_model(data: PostRequest) -> PostResponse:
    """
    Принимает данные в формате BIO, обучает модель и возвращает accuracy.
    """
    if len(data.text) != len(data.labels):
        raise ValueError("Количество текстов и строк с метками не совпадает")
    # Обучаем модель
    nlp, docs, gold_tags = train_ner_model(data.text, data.labels, n_iter=5, batch_size=4)
    # Оцениваем accuracy на тех же данных
    acc = token_level_accuracy(nlp, docs, gold_tags)
    return PostResponse(acc=acc)
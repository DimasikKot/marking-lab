from fastapi import APIRouter, Depends, HTTPException

# Создаём сессию для работы с БД
from sqlalchemy.orm import Session

# Модели для валидации данных, которые мы будем получать от клиента и отправлять ему в ответ
from pydantic import BaseModel

# Методы взаимодействия с БД
from app.services.user import (
    create_user,
    authenticate_user,
    encode_access_token,
)

# Подключение к БД
from app.core.database import get_auth_db

# Модель пользователя хранящаяся в БД
from app.models.db_auth import User


router = APIRouter()


# Сначала всегда модель для получаемых данных, потом для отправляемых данных
class PostRequest(BaseModel):
    username: str
    email: str
    password: str


class PostResponse(BaseModel):
    username: str
    access_token: str
    token_type: str


# Пишем метод, путь и какие данные будем возвращать
@router.post("/", response_model=PostResponse)
# Пишем получаемые данные и создаём сессию с БД
async def register_user(data: PostRequest, db: Session = Depends(get_auth_db)):
    existing_username: User | None = (
        db.query(User).filter(User.username == data.username).first()
    )
    if existing_username:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")

    # Ищем пользователя по email, тк это уникальный атрибут
    existing_email: User | None = (
        db.query(User).filter(User.email == data.email).first()
    )

    # Если пользователь существует, то возвращаем ошибку
    if existing_email:
        # Всегда делаем обработки ошибок
        raise HTTPException(status_code=400, detail="Email уже зарегестрирован")

    # Иначе создаём и возвращаем созданного пользователя
    user: User = create_user(db, data.username, data.email, data.password)

    access_token: str = encode_access_token({"sub": str(user.id)})

    return PostResponse(
        username=user.username, access_token=access_token, token_type="bearer"
    )


class PostLoginRequest(BaseModel):
    login: str
    password: str


# Совершение авторизации
@router.post("/login", response_model=PostResponse)
# Пишем получаемые данные и создаём сессию с БД для проверки
async def login_user(data: PostLoginRequest, db: Session = Depends(get_auth_db)):
    user: User = authenticate_user(db, data.login, data.password)

    # Создаём токен авторизации ("sub" - это стандартный параметр для задания id пользователя)
    access_token: str = encode_access_token({"sub": str(user.id)})

    return PostResponse(
        username=user.username, access_token=access_token, token_type="bearer"
    )

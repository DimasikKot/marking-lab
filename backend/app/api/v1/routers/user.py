import re
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


class ValidateUsernameRequest(BaseModel):
    username: str


class ValidateEmailRequest(BaseModel):
    email: str


class ValidateResponse(BaseModel):
    status: bool


username_patt = r"^[a-zA-Z][a-zA-Z0-9_]{4,31}$"
email_patt = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.(ru|com)$"


@router.post("/validate-username", response_model=ValidateResponse)
async def validate_username(
    data: ValidateUsernameRequest, db: Session = Depends(get_auth_db)
):
    if not re.match(username_patt, data.username):
        raise HTTPException(
            status_code=400,
            detail="Имя пользователя должно начинаться с буквы, "
            "содержать только буквы, цифры и подчёркивания и быть "
            "длиной от 5 до 32 символов",
        )

    existing_username: User | None = (
        db.query(User).filter(User.username == data.username).first()
    )
    if existing_username:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")

    return ValidateResponse(status=True)


@router.post("/validate-email", response_model=ValidateResponse)
async def validate_email(
    data: ValidateEmailRequest, db: Session = Depends(get_auth_db)
):
    if not re.match(email_patt, data.email):
        raise HTTPException(status_code=400, detail="Неверный формат электронной почты")

    existing_email: User | None = (
        db.query(User).filter(User.email == data.email).first()
    )
    if existing_email:
        raise HTTPException(
            status_code=400, detail="Электронная почта уже зарегестрирована"
        )

    return ValidateResponse(status=True)

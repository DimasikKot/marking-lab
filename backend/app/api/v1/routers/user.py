import re
from fastapi import APIRouter, Depends, HTTPException

# Создаём сессию для работы с БД
from sqlalchemy.orm import Session

# Модели для валидации данных, которые мы будем получать от клиента и отправлять ему в ответ
from pydantic import BaseModel, field_validator

# Подключение к БД
from app.core.database import get_auth_db

# Модель пользователя хранящаяся в БД
from app.models.db_auth import User

# Методы взаимодействия с БД
from app.services.user import (
    create_user,
    authenticate_user,
    encode_user_access_token,
)

router = APIRouter()


# Сначала модель для получаемых данных, потом для возвращаемых данных
class PostRequest(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("email")
    def validate_email(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Электронная почта не должна превышать 255 символов",
            )

    @field_validator("password")
    def validate_password(cls, value):
        if len(value) > 255:
            raise HTTPException(
                status_code=400,
                detail="Пароль не должен превышать 255 символов",
            )
        return value

    @field_validator("username")
    def validate_username(cls, value):
        if len(value) > 32 or len(value) < 4:
            raise HTTPException(
                status_code=400,
                detail="Имя пользователя должно быть от 4 до 32 символов",
            )
        return value


class PostResponse(BaseModel):
    username: str
    access_token: str
    token_type: str


# Пишем метод, путь и какие данные будем возвращать
@router.post("", response_model=PostResponse)
# Пишем получаемые данные и создаём сессию с БД
async def post(data: PostRequest, db: Session = Depends(get_auth_db)):
    user: User = create_user(db, data.username, data.email, data.password)

    access_token: str = encode_user_access_token(user_id=user.id)

    return PostResponse(
        username=user.username, access_token=access_token, token_type="bearer"
    )


class PostLoginRequest(BaseModel):
    login: str
    password: str


# Совершение авторизации
@router.post("/login", response_model=PostResponse)
# Пишем получаемые данные и создаём сессию с БД для проверки
async def post_login(data: PostLoginRequest, db: Session = Depends(get_auth_db)):
    user: User = authenticate_user(db, data.login, data.password)

    # Создаём токен авторизации ("sub" - это стандартный параметр для задания id пользователя)
    access_token: str = encode_user_access_token(user_id=user.id)

    return PostResponse(
        username=user.username, access_token=access_token, token_type="bearer"
    )


class PostValidateUsernameRequest(BaseModel):
    username: str


class PostValidateResponse(BaseModel):
    success: bool


@router.post("/validate-username", response_model=PostValidateResponse)
async def post_validate_username(
    data: PostValidateUsernameRequest, db: Session = Depends(get_auth_db)
):
    username_patt = r"^[a-zA-Z][a-zA-Z0-9_]"
    if not re.match(username_patt, data.username):
        raise HTTPException(
            status_code=400,
            detail="Имя пользователя должно начинаться с буквы, "
            "содержать только буквы, цифры и подчёркивания",
        )

    existing_username: User | None = (
        db.query(User).filter(User.username == data.username).first()
    )
    if existing_username:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")

    return PostValidateResponse(success=True)


class PostValidateEmailRequest(BaseModel):
    email: str


@router.post("/validate-email", response_model=PostValidateResponse)
async def post_validate_email(
    data: PostValidateEmailRequest, db: Session = Depends(get_auth_db)
):
    email_patt = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.(ru|com)$"
    if not re.match(email_patt, data.email):
        raise HTTPException(status_code=400, detail="Неверный формат электронной почты")

    existing_email: User | None = (
        db.query(User).filter(User.email == data.email).first()
    )
    if existing_email:
        raise HTTPException(
            status_code=400, detail="Электронная почта уже зарегестрирована"
        )

    return PostValidateResponse(success=True)


class PostValidateLoginRequest(BaseModel):
    login: str


@router.post("/validate-login", response_model=PostValidateResponse)
async def post_validate_login(
    data: PostValidateLoginRequest, db: Session = Depends(get_auth_db)
):
    user: User = db.query(User).filter(User.email == data.login).first()
    if not user:
        # Также проверяем по имени пользователя, если пользователь не найден по email,
        # тк в нашем случае можно использовать и email и имя пользователя для авторизации
        user: User = db.query(User).filter(User.username == data.login).first()
        if not user:
            raise HTTPException(status_code=401, detail="Пользователь не найден")

    return PostValidateResponse(success=True)

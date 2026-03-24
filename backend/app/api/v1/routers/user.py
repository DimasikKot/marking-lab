from fastapi import APIRouter, Depends, HTTPException

# Создаём сессию для работы с БД
from sqlalchemy.orm import Session

# Методы взаимодействия с БД
from app.services.user import create_user, authenticate_user, encode_access_token, print_access_token_data

# Подключение к БД
from app.core.database import get_auth_db

# Модель пользователя хранящаяся в БД
from app.models.db_auth import User

# Время для задания срока действия токена и тип данных времени
from datetime import datetime, timedelta

# Модели для валидации данных, которые мы будем получать от клиента и отправлять ему в ответ
from pydantic import BaseModel


router = APIRouter()


# Сначала всегда модель для получаемых данных, потом для отправляемых данных
class PostRequest(BaseModel):
    username: str
    email: str
    password: str

class PostResponse(BaseModel):
    username: str
    email: str
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Пишем метод, путь и какие данные будем возвращать
@router.post("/", response_model=PostResponse)
# Пишем получаемые данные и создаём сессию с БД
def register_user(user: PostRequest, db: Session = Depends(get_auth_db)) -> PostResponse:
    # Ищем пользователя по email, тк это уникальный атрибут
    existing_user: User | None = db.query(User).filter(User.email == user.email).first()

    # Если пользователь существует, то возвращаем ошибку
    if existing_user:
        # Всегда делаем обработки ошибок
        raise HTTPException(status_code=400, detail="User already registered")

    # Иначе создаём и возвращаем созданного пользователя
    new_user: User = create_user(db, user.username, user.email, user.password)
    return new_user


class PostLoginRequest(BaseModel):
    login: str
    password: str

class PostLoginResponse(BaseModel):
    username: str
    access_token: str
    token_type: str

# Совершение авторизации
@router.post("/login", response_model=PostLoginResponse)
# Пишем получаемые данные и создаём сессию с БД для проверки
def login_user(user: PostLoginRequest, db: Session = Depends(get_auth_db)) -> PostLoginResponse:
    user: User | None = authenticate_user(db, user.login, user.password)
    if not user:
        # Ни в коем случае не пишем в чем именно проблема, возвращаем ошибку, что данные неправильно введены
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Создаём токен авторизации ("sub" - это стандартный параметр для задания id пользователя)
    access_token: str = encode_access_token({"sub": str(user.id)}, expires_delta=timedelta(hours=1))

    print_access_token_data(access_token)

    return PostLoginResponse(username=user.username, access_token=access_token, token_type="bearer")

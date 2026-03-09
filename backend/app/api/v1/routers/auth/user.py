from fastapi import APIRouter, Depends, HTTPException

# Создаём сессию для работы с БД
from sqlalchemy.orm import Session

# Модели используемые для создания пользователя и ответа в роутере
from app.schemas.auth.user import UserCreate, UserResponse

# Методы взаимодействия с БД
from app.services.auth.user import create_user, authenticate_user, create_access_token

# Подключение к БД
from app.core.database import get_auth_db

# Модель пользователя хранящаяся в БД
from app.models.auth.user import User
from datetime import timedelta


router = APIRouter()


# Регистрация пользователей
# Пишем метод, путь и какие данные будем возвращать
@router.post("/", response_model=UserResponse)
# Пишем получаемые данные и создаём сессию с БД
def register_user(user: UserCreate, db: Session = Depends(get_auth_db)) -> User:
    # Ищем пользователя по email, тк это уникальный атрибут
    existing_user: User | None = db.query(User).filter(User.email == user.email).first()

    # Если пользователь существует, то возвращаем ошибку
    if existing_user:
        # Всегда делаем обработки ошибок
        raise HTTPException(status_code=400, detail="User already registered")

    # Иначе создаём и возвращаем созданного пользователя
    new_user: User = create_user(db, user.email, user.password)
    return new_user


# Совершение авторизации
@router.get("/login")
# Пишем получаемые данные и создаём сессию с БД для проверки
def login_user(email: str, password: str, db: Session = Depends(get_auth_db)) -> dict[str, str]:
    user: User | None = authenticate_user(db, email, password)
    if not user:
        # Ни в коем случае не пишем в чем именно проблема, возвращаем ошибку, что данные неправильно введены
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Создаём токен авторизации ("sub" - это стандартный параметр для задания id пользователя)
    access_token: str = create_access_token({"sub": user.id}, expires_delta=timedelta(hours=1))
    return {"access_token": access_token, "token_type": "bearer"}

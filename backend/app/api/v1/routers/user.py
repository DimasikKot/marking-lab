from fastapi import APIRouter, Depends, HTTPException

# Создаём сессию для работы с БД
from sqlalchemy.orm import Session

# Модели используемые для создания пользователя и ответа в роутере
from app.schemas.user import UserCreate, UserResponse

# Методы взаимодействия с БД
from app.services.user import create_user, authenticate_user, encode_access_token, print_access_token_data

# Подключение к БД
from app.core.database import get_auth_db

# Модель пользователя хранящаяся в БД
from backend.app.models.db_auth import User
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
    new_user: User = create_user(db, user.username, user.email, user.password)
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
    access_token: str = encode_access_token({"sub": str(user.id)}, expires_delta=timedelta(hours=1))

    print_access_token_data(access_token)

    return {"access_token": access_token, "token_type": "bearer"}

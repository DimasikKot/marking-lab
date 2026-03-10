from sqlalchemy.orm import Session
from app.models.user import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings


password_crypt_context: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return password_crypt_context.hash(password)


def verify_password(plain_password, hashed_password) -> bool:
    return password_crypt_context.verify(plain_password, hashed_password)


def create_user(db: Session, email: str, password: str) -> User:
    hashed_password: str = get_password_hash(password)
    user: User = User(email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user: User = db.query(User).filter(User.email == email).first()

    # Ни в коем случае не возвращаем в чем именно проблема, возвращаем ошибку и всё
    if not user or not verify_password(password, user.hashed_password):
        return None
    
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    # Копируем, чтобы не изменять передаваемый словарь
    # Данные в словаре будут зашифрованы, но их можно прочитать зная секретный ключ из параметров среды
    to_encode: dict = data.copy()

    # expire - дата истечения токена (expires_delta - время действия токена)
    expire: datetime = datetime.now(tz=timezone.utc) + (expires_delta if expires_delta else timedelta(hours=1))

    # Добавляем параметр истечения токена ("exp" - это стандартный параметр для задания времени истечения)
    to_encode.update({"exp": expire})
    
    # Создаём токен используя данные из словаря и секретный ключ из параметров среды, и пишем используемый аргоритм
    return jwt.encode(to_encode, settings.JWT_ACCESS_TOKEN_SECRET, algorithm="HS256")

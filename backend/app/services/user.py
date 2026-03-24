from sqlalchemy.orm import Session
from app.models.user import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings


password_crypt_context: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Хеширует пароль с помощью bcrypt и возвращает хешированную строку"""
    return password_crypt_context.hash(password)


def verify_password(plain_password, hashed_password) -> bool:
    """Проверяет, соответствует ли открытый пароль хешу пароля"""
    return password_crypt_context.verify(plain_password, hashed_password)


def create_user(db: Session, username: str, email: str, password: str) -> User:
    """Создаёт нового пользователя с хешированным паролем и сохраняет его в базе данных"""
    hashed_password: str = get_password_hash(password)
    user: User = User(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Проверяет email и пароль, возвращает пользователя, если аутентификация успешна, иначе None"""
    user: User = db.query(User).filter(User.email == email).first()

    # Ни в коем случае не возвращаем в чем именно проблема, возвращаем ошибку и всё
    if not user or not verify_password(password, user.hashed_password):
        user: User = db.query(User).filter(User.username == email).first()

        # Также проверяем по имени пользователя, если пользователь не найден по email,
        # тк в нашем случае можно использовать и email и имя пользователя для авторизации
        if not user or not verify_password(password, user.hashed_password):
            return None
    
    return user


def encode_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Создаёт JWT-токен с данными из словаря и временем истечения, если указано"""
    # Копируем, чтобы не изменять передаваемый словарь
    # Данные в словаре будут зашифрованы, но их можно прочитать зная секретный ключ из параметров среды
    to_encode: dict = data.copy()

    # expire - дата истечения токена (expires_delta - время действия токена)
    expire: datetime = datetime.now(tz=timezone.utc) + (expires_delta if expires_delta else timedelta(hours=1))

    # Добавляем параметр истечения токена ("exp" - это стандартный параметр для задания времени истечения)
    to_encode.update({"exp": expire})
    
    # Создаём токен используя данные из словаря и секретный ключ из параметров среды, и пишем используемый аргоритм
    return jwt.encode(to_encode, settings.JWT_ACCESS_TOKEN_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> dict[str, any] | None:
    """Возвращает payload из JWT-токена или None, если токен недействителен/просрочен"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_ACCESS_TOKEN_SECRET,     # тот же самый секрет, что при создании
            algorithms=["HS256"],                 # тот же алгоритм
            options={
                "verify_signature": True,
                "verify_exp": True,               # проверять срок действия
                "require": ["exp"],               # обязательно должен быть exp
            }
        )
        return payload

    except Exception as e:
        print(f"Ошибка при декодировании токена: {e}")
        return None

def print_access_token_data(token: str) -> None:
    """Печатает данные из токена, если он действителен, иначе сообщает, что токен недействителен/просрочен"""
    data = decode_access_token(token)

    if data:
        print("Данные из токена:", data)
        print("ID пользователя:", data.get("sub"))
        print("Дата истечения:", datetime.fromtimestamp(data["exp"], tz=timezone.utc))
    else:
        print("Токен недействителен или просрочен")
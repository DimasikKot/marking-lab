from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func

from app.core.database import AuthBase


class User(AuthBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(255), default='user')  # 'user', 'moderator', 'admin'
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

from sqlalchemy import Column, Integer, String, TIMESTAMP
from app.core.database import AuthBase
from sqlalchemy.sql import func


class User(AuthBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

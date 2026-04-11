from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import api_router


app: FastAPI = FastAPI()


origins: list[str] = [
    "http://localhost:8000",  # Бэкенд на FastAPI
    "http://127.0.0.1:8000",  # Альтернативный локальный хост
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Кто может делать запросы
    allow_credentials=True,
    allow_methods=["*"],  # Разрешенные методы (GET, POST и т.д.)
    allow_headers=["*"],  # Разрешенные заголовки
)

app.include_router(api_router, prefix="/api/v1")

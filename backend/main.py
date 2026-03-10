from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import api_router


app: FastAPI = FastAPI()


# Разрешённые источники (добавь свой фронтенд)
origins: list[str] = [
    "http://localhost:5173",  # Фронтенд на Vite
    "http://127.0.0.1:5173",  # Альтернативный локальный хост
]

# Добавляем CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Кто может делать запросы
    allow_credentials=True,
    allow_methods=["*"],  # Разрешенные методы (GET, POST и т.д.)
    allow_headers=["*"],  # Разрешенные заголовки
)


# Подключение всех роутеров API
app.include_router(api_router, prefix="/api/v1")

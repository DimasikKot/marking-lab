from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from database import init_db

app = FastAPI()

# Разрешённые источники (добавь свой фронтенд)
origins = [
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

@app.on_event("startup")
def startup_event():
    init_db()  # Таблицы создадутся сами при старте контейнера
    print("Database tables created!")

@app.get("/")
def home():
    return {"message": "NLP Platforma API is ready"}

@app.get("/ml")
async def test_ml():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://ml:8001/process",
            json={"text": "Apple was founded by Steve Jobs"}
        )

    return response.json()

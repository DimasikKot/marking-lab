import httpx
import redis
import json
import socket
from redis.exceptions import ResponseError

from app.core.config import settings
from app.services.model_router import model_router

REDIS_HOST = "redis"
STREAM = "ml_train_tasks"
GROUP = "ml_trainers"
WORKER = socket.gethostname()

r = redis.Redis(host=REDIS_HOST, decode_responses=True)

# создаём группу (один раз)
try:
    r.xgroup_create(STREAM, GROUP, mkstream=True)
except ResponseError:
    pass

print(f"[{WORKER}] ML worker started")

while True:
    resp = r.xreadgroup(
        groupname=GROUP, consumername=WORKER, streams={STREAM: ">"}, count=1, block=0
    )

    _, messages = resp[0]  # type: ignore
    msg_id, data = messages[0]

    try:
        params = json.loads(data["parameters"])

        model_router(
            EPOCHS=int(params["Эпохи"]),
            BATCH_SIZE=int(params["Размер батчей"]),
            BASE_MODEL=params["Базовая модель"],
            LEARNING_RATE=float(params["Скорость обучения"]),
            TESTING_SIZE=float(params["Размер тренировочного набора"]),
            MAX_LINE_LENGHT=int(params["Максимальная длина предложения"]),
            train_access_token=data["train_access_token"],
        )

        # обучение полностью завершено
        r.xack(STREAM, GROUP, msg_id)
        print(f"[{WORKER}] done {msg_id}")

    except Exception as error:
        httpx.post(
            settings.POST_PROGRESS_URL,
            json={"progress": 0, "train_access_token": data["train_access_token"]},
            timeout=300,
        )
        print(f"[{WORKER}] error {error}")
        # НЕ xack → retry

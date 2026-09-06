import httpx
import redis
import json
import socket
import time
from redis.exceptions import ResponseError, ConnectionError

from app.core.config import settings
from app.services.model_router import model_router

STREAM = "ml_train_tasks"
GROUP = "ml_trainers"
WORKER = socket.gethostname()


def current_time() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time()))


def get_redis_connection():
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
        socket_keepalive=True,  # добавляем keepalive
        socket_timeout=30,  # таймаут на чтение
        socket_connect_timeout=10,
    )


redis_class = get_redis_connection()

# создаём группу (один раз)
try:
    redis_class.xgroup_create(STREAM, GROUP, mkstream=True)
except ResponseError:
    pass

print(f"[{current_time()}] {WORKER}: ML worker started")

while True:
    print(f"[{current_time()}] WAITING 30 SEC")
    time.sleep(30)  # пауза перед началом попыток

    # пересоздаём соединение если оно упало
    try:
        resp = redis_class.xreadgroup(
            groupname=GROUP,
            consumername=WORKER,
            streams={STREAM: ">"},
            count=1,
            block=5000,  # таймаут 5 сек вместо 0
        )
    except (ConnectionError, redis.exceptions.ConnectionError):
        print(f"[{current_time()}] Reconnecting to Redis...")
        redis_class = get_redis_connection()
        continue

    if not resp:
        continue

    _, messages = resp[0]
    if not messages:
        continue

    msg_id, data = messages[0]

    for attempt in range(5):
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
            redis_class.xack(STREAM, GROUP, msg_id)
            print(f"[{current_time()}] {WORKER}: done {msg_id}")
            break  # успех - выходим из цикла попыток

        except Exception as error:
            print(
                f"[{current_time()}] {WORKER}: attempt {attempt + 1}/5 failed: {error}"
            )

            print(f"[{current_time()}] WAITING 30 SEC AGAIN")
            time.sleep(30)  # пауза перед следующей попыткой

            if attempt == 4:  # последняя попытка
                httpx.post(
                    settings.POST_PROGRESS_URL,
                    json={
                        "progress": 0,
                        "train_access_token": data["train_access_token"],
                    },
                    timeout=300,
                )
                print(f"[{current_time()}] {WORKER}: error after 5 attempts: {error}")
                # НЕ xack → retry

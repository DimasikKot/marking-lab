import time
import redis
import json
import socket

REDIS_HOST = "redis"
STREAM = "ml_train_tasks"
GROUP = "ml_trainers"
WORKER = socket.gethostname()

r = redis.Redis(host=REDIS_HOST, decode_responses=True)

# создать группу (один раз)
try:
    r.xgroup_create(STREAM, GROUP, id="$", mkstream=True)
except redis:
    pass  # уже существует

print(f"[{WORKER}] ML worker started")

while True:
    resp = r.xreadgroup(
        groupname=GROUP, consumername=WORKER, streams={STREAM: ">"}, count=1, block=0
    )

    if not resp:
        continue

    _, messages = resp[0]
    msg_id, data = messages[0]

    try:
        print(f"[{WORKER}] training task {msg_id}")

        experiment_id = data["experiment_id"]
        dataset_path = data["dataset_path"]
        model = data["model"]
        epochs = int(data["epochs"])
        lr = float(data["lr"])

        # ===== ОБУЧЕНИЕ =====
        train_model(
            experiment_id=experiment_id,
            dataset_path=dataset_path,
            model=model,
            epochs=epochs,
            lr=lr,
        )
        # ===================

        r.xack(STREAM, GROUP, msg_id)
        print(f"[{WORKER}] done {msg_id}")

    except Exception as e:
        print(f"[{WORKER}] error {e}")
        # НЕ делаем XACK → задача останется pending
        time.sleep(5)


def train_model(*, experiment_id, dataset_path, model, epochs, lr):
    print(f"Training {model} on {dataset_path}")
    time.sleep(500)  # имитация обучения
    print(f"Experiment {experiment_id} finished")


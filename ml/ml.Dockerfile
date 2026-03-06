FROM python:3.13-slim
WORKDIR /app

# Установка системных зависимостей для тяжелых либ
# RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && rm -rf /var/lib/apt/lists/*

# Отключение буферизации команды print()
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

# RUN pip install --no-cache-dir torch tensorflow --extra-index-url https://download.pytorch.org

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Запуск воркера (просто скрипт-слушатель)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

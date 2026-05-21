FROM nvidia/cuda:12.6.1-runtime-ubuntu24.04

RUN apt-get update && apt-get install -y \
    python3.12 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Флаг --break-system-packages отключает защиту
# RUN pip install --break-system-packages torch==2.6.0 torchaudio==2.6.0 torchvision==0.21.0
RUN pip install --break-system-packages torch==2.6.0 torchaudio==2.6.0 torchvision==0.21.0 

COPY requirements.txt .
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
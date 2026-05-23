FROM nvidia/cuda:12.6.1-runtime-ubuntu24.04

RUN apt-get update && apt-get install -y \
    python3.12 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# PyTorch с CUDA
RUN pip install --break-system-packages \
    torch==2.6.0 \
    torchaudio==2.6.0 \
    torchvision==0.21.0 \
    --index-url https://download.pytorch.org/whl/cu126

# PyTorch без CUDA
# RUN pip install --break-system-packages \
#     torch==2.6.0 \
#     torchaudio==2.6.0 \
#     torchvision==0.21.0

COPY requirements.txt .
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["python3", "-m", "main"]
## Действия перед запуском

### Настройте `git`

1. Установите `vscode` / `cursor`
2. Установите `git`

https://git-scm.com/

3. Зайти в `GitHub` в `vscode` / `cursor`

4. Привязать почту к коммитам (обязательно)

```bash
git config --global user.email ЭЛЕКТРОННАЯ-ПОЧТА
```

5. Установить отображаеммое при коммите имя (обязательно)

```bash
git config --global user.name ФАМИЛИЯ-ИМЯ
```

6. Скопируйте репозиторий с `GitHub`'а

```bash
git clone https://github.com/DimasikKot/marking-lab.git

```

### Настройте `Docker`

1. Установите `docker`

2. Выдайте `docker`'у права супер-пользователя, чтобы не вводить постоянно `sudo` (если на `Linux`)

```bash
sudo usermod -aG docker $USER
```

3. Создайте общие сети

```bash
docker network create ml-back
docker network create front-back

```

### Настройте `PostgreSQL`

1. Установите `PostgreSQL` на хост (ваш ПК/ноутбук)

2. Подтвердите установку `pgAdmin 4`

3. Создайте две базы данных, советую данные названия:

- `marking-lab`
- `marking-lab-auth`

4. Активируйте два скрипта для создания таблиц, они в корне проекта с расширением `.sql`

5. Добавьте в сервис `backend`'а данную строку если вы запускаете на `Linux` (нельзя коммитить в основную ветку)

```yaml
extra_hosts:
  - "host.docker.internal:172.17.0.1"
```

Должно получится как-то так:

```yaml
services:
  backend:
    ...
    # \/ Вот сюда
    extra_hosts:
      - "host.docker.internal:172.17.0.1"
...
```

### Задание своих переменных среды

1. Создайте `.env.local` файлы в папках `backend` и `frontend` сервисов

2. Заполните `.env.local` по примерам `.env.example`

`backend`

```bash
REDIS_HOST="redis"
REDIS_PORT=6379

DB_HOST="host.docker.internal"
DB_PORT=5432
DB_USERNAME="postgres"
DB_PASSWORD="password"
DB_NAME="marking-lab"

AUTH_DB_HOST="host.docker.internal"
AUTH_DB_PORT=5432
AUTH_DB_USERNAME="postgres"
AUTH_DB_PASSWORD="password"
AUTH_DB_NAME="marking-lab-auth"

USER_JWT_ACCESS_TOKEN_SECRET="w3NWlz4BSf6j6TwwEEXK0pT5yPY4AJzt"
USER_JWT_ACCESS_TOKEN_EXPIRATION_HOURS=240
# USER_JWT_REFRESH_TOKEN_SECRET="v4m9mCNqrIjiNdYiarb4SwUBH5mxCe4O"
# USER_JWT_REFRESH_TOKEN_EXPIRATION_HOURS=720

TRAIN_JWT_ACCESS_TOKEN_SECRET="r1yGRupzNCNGwEstj5fL0c5NFfjtON2B"
TRAIN_JWT_ACCESS_TOKEN_EXPIRATION_HOURS=12
# Также отвечает за максимальное время, которое может обучаться модель

STORAGE_PATH="./projects"

MAX_TRAINING_FILES=5
MAX_PREDICTION_FILES=5
```

`frontend`

```bash
VITE_BACKEND_URL="http://localhost:8000/api/v1"

VITE_BASE_MODELS = ["DeepPavlov/rubert-base-cased","albert-base-v2","distilbert-base-uncased","bert-base-multilingual-cased","xlm-roberta-base"]

VITE_CLEAR_PARAMETERS = {"Эпохи": 2,"Размер батчей": 16,"Базовая модель": "DeepPavlov/rubert-base-cased","Скорость обучения": 0.00002,"Размер тренировочного набора": 0.8,"Максимальная длина предложения": 128}
```

`ml`

```bash
BACKEND_URL="http://backend:8000/api/v1"

REDIS_HOST="redis"
REDIS_PORT=6379

TRAIN_LOGGING_STEPS=8
# Количесво шагов, необходимое для обратной связи обучения модели

MIN_EPOCHS=1
MAX_EPOCHS=30

MIN_BATCH_SIZE=8
MAX_BATCH_SIZE=128

MIN_LEARNING_RATE=1e-7
MAX_LEARNING_RATE=1e-3

MIN_TESTING_SIZE=0.1
MAX_TESTING_SIZE=0.9

MIN_MAX_LINE_LENGHT=32
MAX_MAX_LINE_LENGHT=512

MAX_TRAINING_LINES_FOR_FILE=2000
MAX_PREDICTION_LINES_FOR_FILE=2000
```

## Запуск проекта

```bash
docker-compose up --build

```

На `Linux`:

```bash
docker compose up --build

```

> Чтобы освободить консоль нажмите `D`

> или при запуске добавьте флаг `-d`

## URLs

### frontend

http://localhost:5173/

### backend

http://localhost:8000/docs

### ml

http://localhost:8000/docs

## Скрыть лишние папки в `vscode`

1. Откройте настройки (`File` > `Preferences` > `Settings` ИЛИ `F1` > `>Preferences: Open Settings (UI)`);
2. Поищите `exclude` в строке поиска по настройкам ИЛИ `Files` > `Exclude`;
3. Нажмите кнопку `Add Pattern` и добавьте `**/__pycache__` паттерн;
4. По желанию добавьте `**/node_modules` паттерн для `frontend`'a;
5. По желанию добавьте `.venv` паттерн для виртуальной среды `python`'a;

## Включение подсветки синтаксиса в `vscode` / `cursor`

### `extensions`

Во вкладке дополнений в `vscode` напишите текст ниже и установите все дополнения

```bash
@recommended
```

### `backend` / `ml`

1. Установите `Python` (советую 3.13)

2. Загрузите библиотеки из `requirements.txt`

```bash
pip install --no-cache-dir -r requirements.txt

```

> Эта же команда используется для добавления и обновления уже установленных библиотек

### `frontend`

1. Установите `node.js`

2. Активируйте переменные среды (если на `Windows`)

Вводить в `PowerShell`

```bash
Set-ExecutionPolicy RemoteSigned

```

3. Загрузите библиотеки из `package.json`

```bash
npm install

```

> Эта же команда используется для добавления и обновления уже установленных библиотек

> Перед перезагрузкой контейнеров после установки зависимостей ВСЕГДА УДАЛЯЙТЕ СТАРЫЙ `volumes` в `docker`'е

### Установка новых библиотек:

1. Установить нужные библиотеки:

```bash
npm install НАЗВАНИЕ
```

2. Обновить зависимости:

```bash
npm audit fix

```

3. Остановить все контенеры:

```bash
docker-compose down

```

4. Удалить volumes:

```bash
docker volume prune -a

```

5. Перезапустить контейнеры:

```bash
docker-compose up --build

```

6. Увеличить память контейнера (по желанию):

```bash
docker update --memory 4g ml

```

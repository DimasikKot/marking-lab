
## Действия перед запуском

### Настройте `git`

1) Установите `vscode` / `cursor`
2) Установите `git`

https://git-scm.com/

3) Зайти в `GitHub` в `vscode` / `cursor`

4) Настроийте `git` на устройстве

```bash
git config --global user.name ваш-ник
```

```bash
git config --global user.email ваша-почта
```

5) Скопируйте репозиторий с `GitHub`'а

```bash
git clone https://github.com/DimasikKot/marking-lab.git

```

### Настройте `Docker`

1) Установите `docker`

2) Выдайте `docker`'у права супер-пользователя, чтобы не вводить постоянно `sudo` (если на `Linux`)

```bash
sudo usermod -aG docker $USER
```

3) Создайте общие сети

```bash
docker network create ml-back
docker network create front-back

```

### Настройте `PostgreSQL`

1) Установите `PostgreSQL` на хост (ваш ПК/ноутбук)

2) Подтвердите установку `pgAdmin 4`

3) Создайте две базы данных, советую данные названия:

- `marking-lab`
- `marking-lab-auth`

4) Активируйте два скрипта для создания таблиц, они в корне проекта с расширением `.sql`

5) Добавьте в сервис `backend`'а данную строку если вы запускаете на `Linux` (нельзя коммитить в основную ветку)

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

1) Создайте `.env` файл в корне проекта

2) Заполните `.env` по примеру `.env.example`

```js
PROJECT_NAME="marking-lab"
BACKEND_URL="http://localhost:8000"
ML_URL="http://ml:8001"

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

JWT_ACCESS_TOKEN_SECRET="dAwvW_fzdrmqA_hsdi_pequ"
JWT_ACCESS_TOKEN_EXPIRATION="24h"
JWT_REFRESH_TOKEN_SECRET="dAwvW_fzdrmqA_hsdi_pequ"
JWT_REFRESH_TOKEN_EXPIRATION="168h"
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

http://localhost:8000/

### ml

http://localhost:8000/

## Включение подсветки синтаксиса в `vscode` / `cursor`

### `backend` / `ml`

1) Установите `Python` (советую 3.13)

2) Загрузите библиотеки из `requirements.txt`

```bash
pip install --no-cache-dir -r requirements.txt
```

> Эта же команда используется для добавления и обновления уже установленных библиотек

### `frontend`

1) Установите `node.js`

2) Активируйте переменные среды (если на `Windows`)

Вводить в `PowerShell`

```bash
Set-ExecutionPolicy RemoteSigned
```

3) Загрузите библиотеки из `package.json`

```bash
npm install
```

> Эта же команда используется для добавления и обновления уже установленных библиотек

> Перед перезагрузкой контейнеров после установки зависимостей ВСЕГДА УДАЛЯЙТЕ СТАРЫЙ `volumes` в `docker`'е

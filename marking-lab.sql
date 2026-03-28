DROP TABLE IF EXISTS projects CASCADE; -- удаляем таблицу, если она существует
CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL          PRIMARY KEY,
    user_id         INTEGER         NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    description     VARCHAR(255),
    is_public       BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS files CASCADE;
CREATE TABLE IF NOT EXISTS files (
    id              SERIAL          PRIMARY KEY,
    project_id      INTEGER         REFERENCES projects(id) ON DELETE CASCADE,  -- если проект удаляется, удаляются и файлы
    name            VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    content         JSONB           -- текст/разметка/JSON-структура
);

DROP TABLE IF EXISTS models CASCADE;
CREATE TABLE IF NOT EXISTS models (
    id                SERIAL        PRIMARY KEY,
    project_id        INTEGER       REFERENCES projects(id) ON DELETE CASCADE,
    name              VARCHAR(255)  NOT NULL,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    is_draft          BOOLEAN       DEFAULT TRUE,
    saved_in_memory   BOOLEAN       DEFAULT FALSE,
    parameters        JSONB
);

DROP TABLE IF EXISTS experiments CASCADE;
CREATE TABLE IF NOT EXISTS experiments (
    id          SERIAL          PRIMARY KEY,
    project_id  INTEGER         REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    is_draft    BOOLEAN         DEFAULT TRUE,
    model_id    INTEGER         REFERENCES models(id) ON DELETE SET NULL,   -- если модель удаляется, эксперимент сохраняется, но без модели
    results     JSONB,          -- численные метрики
    graphs      JSONB           -- графики обучения
);

DROP TABLE IF EXISTS model_training_files;
CREATE TABLE IF NOT EXISTS model_training_files (
    model_id   INTEGER  REFERENCES models(id) ON DELETE CASCADE, -- если модель удаляется, удаляются и связи с файлами
    file_id    INTEGER  REFERENCES files(id) ON DELETE CASCADE,  -- если файл удаляется, удаляются и связи с моделями
    PRIMARY KEY (model_id, file_id)
);

DROP TABLE IF EXISTS experiment_testing_files;
CREATE TABLE IF NOT EXISTS experiment_testing_files (
    experiment_id  INTEGER  REFERENCES experiments(id) ON DELETE CASCADE,    -- если эксперимент удаляется, удаляются и связи с файлами
    file_id        INTEGER  REFERENCES files(id) ON DELETE CASCADE,          -- если файл удаляется, удаляются и связи с экспериментами
    PRIMARY KEY (experiment_id, file_id)
);
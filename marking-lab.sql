DROP TABLE IF EXISTS projects CASCADE;  -- удаляем таблицу, если она существует
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
    total_rows      INTEGER         NOT NULL,
    is_labeled      BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS models CASCADE;
CREATE TABLE IF NOT EXISTS models (
    id              SERIAL          PRIMARY KEY,
    project_id      INTEGER         REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    is_draft        BOOLEAN         DEFAULT TRUE,
    saved_in_memory BOOLEAN         DEFAULT FALSE,
    parameters      JSONB           DEFAULT '{}', -- параметры модели
    metrics         JSONB           DEFAULT '{}', -- численные метрики на тестовом наборе
    graphs          JSONB           DEFAULT '{}', -- графики обучения
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS model_files;
DROP TYPE IF EXISTS model_file_role;
CREATE TYPE model_file_role AS ENUM ('training', 'prediction');

CREATE TABLE IF NOT EXISTS model_files (
    model_id        INTEGER         REFERENCES models(id) ON DELETE CASCADE,    -- если модель удаляется, удаляются и связи с файлами
    file_id         INTEGER         REFERENCES files(id) ON DELETE CASCADE,     -- если файл удаляется, удаляются и связи с моделями
        role     model_file_role NOT NULL,
    PRIMARY KEY (model_id, file_id, role)
);
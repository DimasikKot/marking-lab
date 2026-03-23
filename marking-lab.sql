DROP TABLE IF EXISTS tasks; -- удаляем тестовую таблицу, если она существует

CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL          PRIMARY KEY,
    user_id         INTEGER         NOT NULL,
    is_public       BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_accessed   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    project_id      INTEGER         REFERENCES projects(id) ON DELETE CASCADE,  -- если проект удаляется, удаляются и файлы
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    content         JSONB           -- текст/разметка/JSON-структура
);

CREATE TABLE IF NOT EXISTS models (
    id                SERIAL        PRIMARY KEY,
    name              VARCHAR(255)  NOT NULL,
    project_id        INTEGER       REFERENCES projects(id) ON DELETE CASCADE,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    is_draft          BOOLEAN       DEFAULT TRUE,
    saved_in_memory   BOOLEAN       DEFAULT FALSE,
    model_type        VARCHAR(50),  -- 'NER' или 'Classifier'
    parameters        JSONB
);

CREATE TABLE IF NOT EXISTS experiments (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    project_id  INTEGER         REFERENCES projects(id) ON DELETE CASCADE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    is_draft    BOOLEAN         DEFAULT TRUE,
    model_id    INTEGER         REFERENCES models(id) ON DELETE SET NULL,   -- если модель удаляется, эксперимент сохраняется, но без модели
    test_type   VARCHAR(50),
    results     JSONB,          -- численные метрики
    graphs      JSONB           -- графики обучения
);      

CREATE TABLE IF NOT EXISTS model_files (
    model_id   INTEGER  REFERENCES models(id) ON DELETE CASCADE, -- если модель удаляется, удаляются и связи с файлами
    file_id    INTEGER  REFERENCES files(id) ON DELETE CASCADE,  -- если файл удаляется, удаляются и связи с моделями
    PRIMARY KEY (model_id, file_id)
);

CREATE TABLE IF NOT EXISTS experiment_test_files (
    experiment_id  INTEGER  REFERENCES experiments(id) ON DELETE CASCADE,    -- если эксперимент удаляется, удаляются и связи с файлами
    file_id        INTEGER  REFERENCES files(id) ON DELETE CASCADE,          -- если файл удаляется, удаляются и связи с экспериментами
    PRIMARY KEY (experiment_id, file_id)
);
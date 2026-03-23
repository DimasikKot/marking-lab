DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,
    role            VARCHAR(255)    DEFAULT 'user',     -- 'user', 'moderator', 'admin'
    username        VARCHAR(255)    NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    hashed_password VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
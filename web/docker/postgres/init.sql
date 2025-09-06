-- Инициализация базы данных для HR-Аватар

-- Создание дополнительных расширений если нужны
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Создание схемы приложения (опционально)
-- CREATE SCHEMA IF NOT EXISTS app;

-- Настройка прав доступа
GRANT ALL PRIVILEGES ON DATABASE vtbhack_db TO vtbhack_user;

-- Настройки производительности для разработки
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
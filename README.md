# VTB Hack - HR Система

HR-платформа для управления вакансиями, резюме и проведения видеоинтервью с ИИ.

## Демо

[hireready](https://hireready.ru/)

## Быстрый запуск

### Требования
- Node.js 18+
- pnpm
- Docker & Docker Compose
- Linux 
- Множество апи ключей и настройка енв, пишите админу!!! тг: DukhaninDY

### Настройка переменных окружения

```bash
# Для веб-приложения
cd web
cp env.example .env.local

# Для Python агента
cd agent  
cp env.example .env
```

Настройте API ключи в `.env.local` и `.env`:
- LIVEKIT_* - для видеоинтервью
- GEMINI_API_KEY/GOOGLE_API_KEY - для ИИ
- GOOGLE_APPLICATION_CREDENTIALS - путь к JSON файлу с креденшалами

### Установка и запуск

```bash
# Перейти в папку web
cd web

# Быстрая настройка (автоматически настраивает всё)
./setup.sh

# Запуск приложения
pnpm dev
```

Приложение будет доступно на `http://localhost:3000`

### Сервисы

- **Веб-приложение**: http://localhost:3000
- **База данных**: PostgreSQL на порту 5432
- **Adminer** (админ-панель БД): http://localhost:8080

### Тестовые аккаунты

- **Админ**: admin@vtbhack.ru / admin123456
- **HR**: hr1@vtbhack.ru / hr123456  
- **Соискатель**: applicant1@example.com / applicant123456

## Python Агент (LiveKit)

```bash
cd agent
# Настроить переменные окружения
cp env.example .env

# Установка зависимостей и запуск
pip install -r requirements.txt
python3 agent.py download-files
python3 agent.py dev
```

## Полезные команды

```bash
# Остановка Docker контейнеров
pnpm docker:down

# Сброс базы данных
pnpm db:reset

# Логи контейнеров
pnpm docker:logs
```
#!/bin/bash

# Скрипт для быстрого развертывания HR-Аватар с Docker

echo "🚀 Запуск настройки HR-Аватар..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и Docker Compose."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose."
    exit 1
fi

# Создание .env.local файла
echo "📝 Создание файла переменных окружения..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ Файл .env.local создан из env.example"
else
    echo "ℹ️  Файл .env.local уже существует"
fi

# Запуск Docker Compose
echo "🐳 Запуск Docker контейнеров..."
docker-compose up -d

# Ожидание готовности базы данных
echo "⏳ Ожидание готовности PostgreSQL..."
sleep 10

# Проверка доступности базы данных
for i in {1..30}; do
    if docker exec vtbhack_postgres pg_isready -U vtbhack_user -d vtbhack_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL готов!"
        break
    fi
    echo "⏳ Ожидание PostgreSQL... ($i/30)"
    sleep 2
done

# Установка зависимостей (если не установлены)
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    pnpm install
fi

# Генерация Prisma клиента
echo "⚙️  Генерация Prisma клиента..."
pnpm db:generate

# Применение миграций
echo "🗄️  Применение миграций к базе данных..."
pnpm db:push

# Заполнение базы тестовыми данными
echo "🌱 Заполнение базы тестовыми данными..."
pnpm db:seed

echo ""
echo "🎉 Настройка завершена успешно!"
echo ""
echo "📋 Информация о сервисах:"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo "   • Adminer (БД админка): http://localhost:8080"
echo ""
echo "🔑 Данные для подключения к БД через Adminer:"
echo "   • Сервер: postgres"
echo "   • Пользователь: vtbhack_user"
echo "   • Пароль: vtbhack_password123"
echo "   • База данных: vtbhack_db"
echo ""
echo "👥 Тестовые аккаунты:"
echo "   • Админ: admin@vtbhack.ru / admin123456"
echo "   • HR: hr1@vtbhack.ru / hr123456"
echo "   • Соискатель: applicant1@example.com / applicant123456"
echo ""
echo "🚀 Для запуска приложения выполните:"
echo "   pnpm dev"
echo ""
echo "📚 Полезные команды:"
echo "   pnpm docker:logs     - логи Docker контейнеров"
echo "   pnpm docker:down     - остановка контейнеров"
echo "   pnpm db:reset        - сброс и пересоздание БД"
echo ""
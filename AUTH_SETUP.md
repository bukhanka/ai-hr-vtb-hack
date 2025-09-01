# Система авторизации HR-Аватар

Система авторизации успешно реализована со следующими возможностями:

## 🚀 Функционал
- ✅ Регистрация пользователей с ролями (ADMIN, HR, APPLICANT)
- ✅ Авторизация по JWT токенам
- ✅ Защищенные маршруты с middleware
- ✅ Seed файл с тестовыми пользователями
- ✅ API endpoints для всех операций авторизации
- ✅ Хеширование паролей с bcrypt

## 📁 Структура файлов

### API Routes
- `/api/auth/register` - Регистрация пользователей
- `/api/auth/login` - Авторизация
- `/api/auth/logout` - Выход
- `/api/auth/me` - Получение текущего пользователя

### Страницы
- `/login` - Страница входа
- `/register` - Страница регистрации (обновлена)
- `/dashboard` - Защищенная страница дашборда

### Утилиты
- `src/lib/auth.ts` - Утилиты для работы с JWT и паролями
- `middleware.ts` - Защита маршрутов
- `prisma/seed.ts` - Заполнение БД тестовыми данными

## 🔧 Запуск системы

### 1. Настройка переменных окружения
Создайте файл `.env.local`:

\`\`\`bash
# Настройки базы данных  
DATABASE_URL="postgresql://username:password@localhost:5432/vtbhack_db"

# JWT Secret для авторизации
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js настройки
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 2. Генерация Prisma клиента и миграции
\`\`\`bash
pnpm db:generate
pnpm db:push
\`\`\`

### 3. Заполнение базы тестовыми данными
\`\`\`bash
pnpm db:seed
\`\`\`

### 4. Запуск приложения
\`\`\`bash
pnpm dev
\`\`\`

## 👥 Тестовые аккаунты

После выполнения seed скрипта будут созданы следующие аккаунты:

| Роль        | Email                  | Пароль         | Имя         |
|-------------|------------------------|----------------|-------------|
| ADMIN       | admin@vtbhack.ru       | admin123456    | Системный   |
| HR          | hr1@vtbhack.ru         | hr123456       | Анна        |
| HR          | hr2@vtbhack.ru         | hr123456       | Михаил      |
| APPLICANT   | applicant1@example.com | applicant123456| Иван        |
| APPLICANT   | applicant2@example.com | applicant123456| Мария       |
| APPLICANT   | applicant3@example.com | applicant123456| Александр   |
| APPLICANT   | applicant4@example.com | applicant123456| Елена       |
| APPLICANT   | applicant5@example.com | applicant123456| Дмитрий     |

## 🔐 Безопасность

- Пароли хешируются с bcrypt (12 раундов)
- JWT токены подписываются секретным ключом
- HTTP-only cookies для веб-интерфейса
- Bearer токены для API
- Middleware проверяет права доступа

## 🛡️ Права доступа

### Публичные маршруты (не требуют авторизации):
- `/`, `/login`, `/register`
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`

### Защищенные маршруты:
- `/dashboard`, `/profile` - для всех авторизованных
- `/jobs`, `/api/jobs` - только HR и ADMIN
- `/interviews`, `/api/interviews` - только HR и ADMIN  
- `/admin`, `/api/users` - только ADMIN

## 🎯 Использование

1. Откройте `http://localhost:3000/login`
2. Войдите с тестовыми данными
3. Проверьте доступ к защищенным страницам
4. Используйте API endpoints для интеграции

Система готова к работе! 🎉
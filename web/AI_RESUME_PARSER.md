# 🤖 Универсальный AI парсер резюме

Комплексное решение для автоматического анализа резюме с поддержкой множества форматов файлов и использованием Google Gemini AI для структурирования данных.

## 🎯 Что реализовано

### ✅ Поддерживаемые форматы файлов:
- **PDF** - нативная поддержка через Gemini Document Processing API (лучшее качество)
- **DOCX** - извлечение текста через mammoth + AI анализ
- **DOC** - ограниченная поддержка старых форматов Word
- **RTF** - Rich Text Format с извлечением структурированного текста
- **TXT** - прямая обработка текста
- **HTML** - очистка от тегов + анализ контента
- **Markdown** - анализ с сохранением разметки
- **Изображения (JPG, PNG, WEBP)** - OCR через Gemini Vision API

### 🏗️ Архитектура решения:

#### 1. **UniversalResumeParser** (`/src/lib/ai-resume-parser.ts`)
Универсальный класс для парсинга резюме любых форматов:
```typescript
const parser = new UniversalResumeParser();
const parsedData = await parser.parseResume(file);
```

**Возможности:**
- Автоопределение формата файла
- Валидация размера и типа
- Structured Output через JSON Schema
- Fallback стратегии для проблемных файлов

#### 2. **API Endpoints**

**POST /api/ai/analyze-resume** - Анализ резюме:
```bash
curl -X POST /api/ai/analyze-resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.pdf" \
  -F "resumeId=resume_id_here"
```

**GET /api/ai/analyze-resume?resumeId=ID** - Статус анализа

#### 3. **Обновленная база данных**
```sql
-- Новые поля в таблице resumes:
rawContent      TEXT,      -- Исходный текст из файла
parsedData      JSON,      -- Структурированные AI данные  
aiSummary       TEXT,      -- Краткое резюме от AI
matchScore      FLOAT,     -- Скор полноты профиля
processingStatus VARCHAR,  -- PENDING/PROCESSING/COMPLETED/FAILED
analyzedAt      TIMESTAMP  -- Время анализа
```

#### 4. **Enhanced UI Components**
- `EnhancedResumeView` - богатое отображение AI данных
- Статусы обработки с прогрессом
- Детальная визуализация навыков, опыта, проектов

## 🚀 Настройка и запуск

### 1. Установка зависимостей
```bash
pnpm install @google/generative-ai mammoth pdf-parse rtf-parser
```

### 2. Настройка API ключа Gemini
1. Получите API ключ: https://aistudio.google.com/app/apikey
2. Добавьте в `.env.local`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Обновление базы данных
```bash
pnpm db:push
```

### 4. Запуск приложения
```bash
pnpm dev
```

## 📊 Структура AI данных

### ParsedResumeData Interface:
```typescript
interface ParsedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;                    // AI-generated резюме
  skills: {
    technical: string[];             // JavaScript, Python, etc.
    soft: string[];                  // Коммуникация, лидерство
    tools: string[];                 // Git, Docker, etc.
    frameworks: string[];            // React, Django, etc.
    databases: string[];             // PostgreSQL, MongoDB
    languages: {                     // Языки программирования/иностранные
      language: string;
      level: string;
    }[];
  };
  workExperience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    duration: string;
    description: string;
    achievements: string[];           // Конкретные достижения
    technologies: string[];          // Использованные технологии
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade?: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    role: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
  totalExperienceYears: number;      // Общий опыт
  seniorityLevel: string;            // Junior/Middle/Senior/Lead
  keyStrengths: string[];            // AI выводы о сильных сторонах
  improvementAreas: string[];        // Области для развития
}
```

## 🧪 Тестирование

### Тестовые файлы для проверки:

1. **PDF резюме** - лучшее качество парсинга
2. **DOCX документ** - стандартный формат
3. **RTF резюме** - популярный корпоративный формат
4. **Изображение резюме** - сканированное/фото
5. **Текстовый файл** - простой формат
6. **HTML резюме** - с веб-сайта

### Проверка функционала:

1. **Загрузка резюме:**
   - Перейдите на `/profile/resume`
   - Загрузите тестовый файл
   - Проверьте статус "⏳ Ожидает анализа"

2. **AI Анализ:**
   - Дождитесь статуса "🔄 Анализируется..."
   - После завершения: "✅ AI анализ завершен"
   - Проверьте полноту профиля (%)

3. **Результаты:**
   - Развернутая карточка с AI данными
   - Структурированные навыки по категориям
   - Опыт работы с достижениями
   - AI инсайты и рекомендации

## 🔧 Настройка парсера

### Кастомизация формата:
```typescript
const parser = new UniversalResumeParser({
  supportedFormats: {
    pdf: true,
    docx: true,
    rtf: true,
    images: false,  // Отключить изображения
  },
  maxFileSize: 10 * 1024 * 1024  // 10MB
});
```

### Проверка поддержки:
```typescript
const isSupported = parser.isFormatSupported('application/pdf');
const formats = parser.getSupportedFormats(); // ['.pdf', '.docx', ...]
```

## ⚡ Производительность

- **PDF (до 1000 страниц)**: ~10-30 секунд
- **DOCX**: ~5-15 секунд
- **RTF**: ~3-8 секунд (быстрый парсинг структуры)
- **Изображения**: ~15-45 секунд (OCR + анализ)
- **Текст**: ~3-10 секунд

## 🛠️ Устранение неполадок

### Частые проблемы:

1. **"GEMINI_API_KEY не найден"**
   - Проверьте `.env.local` файл
   - Убедитесь что ключ валидный

2. **"Неподдерживаемый формат файла"**
   - Проверьте MIME type файла
   - Используйте поддерживаемые форматы

3. **"Файл слишком большой"**
   - Максимум 20MB для AI обработки
   - Оптимизируйте размер файла

4. **"Ошибка AI анализа"**
   - Проверьте квоты Gemini API
   - Убедитесь что файл содержит текст

### Логи отладки:
```bash
# Смотрим логи сервера
npm run dev

# В консоли браузера:
console.log('Processing status:', resume.processingStatus);
```

## 🔄 Интеграция с существующим кодом

### Использование в HR интерфейсе:
```typescript
import { ResumeDataUtils } from '../lib/ai-resume-parser';

// Расчет соответствия вакансии
const skillsMatch = ResumeDataUtils.calculateSkillsMatch(
  candidateSkills,
  requiredSkills
);

// Последнее место работы
const latestJob = ResumeDataUtils.getLatestJob(parsedData);

// Все навыки в плоском массиве
const allSkills = ResumeDataUtils.extractAllSkills(parsedData);
```

## 📈 Дальнейшее развитие

### Планируемые улучшения:
- ✅ Поддержка множества форматов
- ✅ Structured Output
- ✅ AI инсайты и рекомендации
- 🔄 Job matching алгоритм
- 📋 Batch обработка резюме
- 🎯 Кастомные промпты для разных ролей
- 📊 Аналитика и метрики

### API для job matching:
```typescript
const jobMatcher = new JobMatchAnalyzer();
const matchResult = await jobMatcher.analyzeMatch(
  parsedResumeData,
  jobRequirements
);
// matchResult.overallScore, .strengths, .gaps, etc.
```

---

**🎉 Готово!** Теперь ваша HR система поддерживает современный AI-powered анализ резюме с автоматическим структурированием данных из любых форматов файлов.
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from 'mammoth';
import parseRTF from 'rtf-parser';

export interface ParsedJobData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string[];
  skills: {
    required: string[];
    preferred: string[];
    technical: string[];
    soft: string[];
  };
  experience: {
    minYears?: number;
    maxYears?: number;
    level: string; // Junior, Middle, Senior, Lead, Any
    areas: string[];
  };
  salary: {
    min?: number;
    max?: number;
    currency: string;
    additional?: string;
  };
  benefits: string[];
  workFormat: string; // Remote, Office, Hybrid, Any
  location?: string;
  company: {
    name?: string;
    industry?: string;
    size?: string;
    culture?: string;
  };
  employmentType: string; // Full-time, Part-time, Contract, Freelance
  education: {
    required?: string;
    preferred?: string;
  };
  keyRequirements: string[];
  niceToHave: string[];
  applicationInstructions?: string;
}

export interface DocumentProcessorConfig {
  supportedFormats: {
    pdf: boolean;
    docx: boolean;
    doc: boolean;
    rtf: boolean;
    txt: boolean;
    html: boolean;
    md: boolean;
  };
  maxFileSize: number; // в байтах
}

export class JobDocumentParser {
  private ai: GoogleGenerativeAI;
  private config: DocumentProcessorConfig;

  constructor(config?: Partial<DocumentProcessorConfig>) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY не найден в переменных окружения');
    }

    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.config = {
      supportedFormats: {
        pdf: true,
        docx: true,
        doc: true,
        rtf: true,
        txt: true,
        html: true,
        md: true,
      },
      maxFileSize: 20 * 1024 * 1024, // 20MB
      ...config
    };
  }

  async parseJobDocument(file: File): Promise<ParsedJobData> {
    // Проверяем размер файла
    if (file.size > this.config.maxFileSize) {
      throw new Error(`Файл слишком большой. Максимум: ${this.config.maxFileSize / 1024 / 1024}MB`);
    }

    const mimeType = file.type;
    const buffer = await file.arrayBuffer();

    console.log(`Обрабатываем документ вакансии: ${file.name}, тип: ${mimeType}, размер: ${file.size} байт`);

    switch (mimeType) {
      case 'application/pdf':
        if (!this.config.supportedFormats.pdf) {
          throw new Error('PDF файлы не поддерживаются в текущей конфигурации');
        }
        return this.parsePDF(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        if (!this.config.supportedFormats.docx) {
          throw new Error('DOCX файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseDocx(buffer);
      
      case 'application/msword':
        if (!this.config.supportedFormats.doc) {
          throw new Error('DOC файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseDoc(buffer);
      
      case 'application/rtf':
      case 'text/rtf':
        if (!this.config.supportedFormats.rtf) {
          throw new Error('RTF файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseRTF(buffer);
      
      case 'text/plain':
        if (!this.config.supportedFormats.txt) {
          throw new Error('TXT файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseText(buffer);
      
      case 'text/html':
        if (!this.config.supportedFormats.html) {
          throw new Error('HTML файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseHtml(buffer);
      
      case 'text/markdown':
        if (!this.config.supportedFormats.md) {
          throw new Error('Markdown файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseMarkdown(buffer);
      
      default:
        throw new Error(`Неподдерживаемый формат файла: ${mimeType}. Поддерживаются: ${this.getSupportedFormats().join(', ')}`);
    }
  }

  private async parsePDF(buffer: ArrayBuffer): Promise<ParsedJobData> {
    // Для PDF требуется дополнительная библиотека, пока используем заглушку
    throw new Error('PDF парсинг временно недоступен. Используйте DOCX или TXT формат.');
  }

  private async parseDocx(buffer: ArrayBuffer): Promise<ParsedJobData> {
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      const text = result.value;
      
      if (!text.trim()) {
        throw new Error('Документ DOCX не содержит текста или поврежден');
      }
      
      return this.analyzeJobText(text);
    } catch (error) {
      console.error('Ошибка парсинга DOCX:', error);
      throw new Error('Не удалось прочитать DOCX файл. Проверьте формат файла.');
    }
  }

  private async parseDoc(buffer: ArrayBuffer): Promise<ParsedJobData> {
    // DOC парсинг сложнее, пока используем заглушку
    throw new Error('DOC парсинг временно недоступен. Используйте DOCX или TXT формат.');
  }

  private async parseRTF(buffer: ArrayBuffer): Promise<ParsedJobData> {
    try {
      const text = Buffer.from(buffer).toString('utf-8');
      const parsed = parseRTF(text);
      
      if (!parsed || !parsed.content) {
        throw new Error('RTF документ не содержит текста или поврежден');
      }
      
      // Извлекаем текст из RTF структуры
      const plainText = this.extractTextFromRTF(parsed);
      return this.analyzeJobText(plainText);
    } catch (error) {
      console.error('Ошибка парсинга RTF:', error);
      throw new Error('Не удалось прочитать RTF файл. Проверьте формат файла.');
    }
  }

  private async parseText(buffer: ArrayBuffer): Promise<ParsedJobData> {
    const text = Buffer.from(buffer).toString('utf-8');
    
    if (!text.trim()) {
      throw new Error('Текстовый файл пуст');
    }
    
    return this.analyzeJobText(text);
  }

  private async parseHtml(buffer: ArrayBuffer): Promise<ParsedJobData> {
    const html = Buffer.from(buffer).toString('utf-8');
    // Простое удаление HTML тегов
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!text) {
      throw new Error('HTML файл не содержит текста');
    }
    
    return this.analyzeJobText(text);
  }

  private async parseMarkdown(buffer: ArrayBuffer): Promise<ParsedJobData> {
    const markdown = Buffer.from(buffer).toString('utf-8');
    // Простое удаление Markdown разметки
    const text = markdown.replace(/[#*_`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!text) {
      throw new Error('Markdown файл не содержит текста');
    }
    
    return this.analyzeJobText(text);
  }

  private extractTextFromRTF(rtfData: any): string {
    // Простая экстракция текста из RTF структуры
    if (typeof rtfData === 'string') {
      return rtfData;
    }
    
    if (rtfData.content) {
      if (Array.isArray(rtfData.content)) {
        return rtfData.content.map((item: any) => this.extractTextFromRTF(item)).join(' ');
      }
      return this.extractTextFromRTF(rtfData.content);
    }
    
    if (rtfData.text) {
      return rtfData.text;
    }
    
    return '';
  }

  private async analyzeJobText(text: string): Promise<ParsedJobData> {
    const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Проанализируй следующий текст вакансии и извлеки структурированную информацию в формате JSON.

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительного текста.

Текст вакансии:
${text}

Верни результат в следующем формате JSON:
{
  "title": "название позиции",
  "description": "общее описание вакансии",
  "requirements": "основные требования к кандидату",
  "responsibilities": ["обязанность 1", "обязанность 2"],
  "skills": {
    "required": ["обязательный навык 1", "обязательный навык 2"],
    "preferred": ["желательный навык 1", "желательный навык 2"],
    "technical": ["технический навык 1", "технический навык 2"],
    "soft": ["soft skill 1", "soft skill 2"]
  },
  "experience": {
    "minYears": минимальный_опыт_число,
    "maxYears": максимальный_опыт_число_или_null,
    "level": "Junior/Middle/Senior/Lead/Any",
    "areas": ["область опыта 1", "область опыта 2"]
  },
  "salary": {
    "min": минимальная_зп_число_или_null,
    "max": максимальная_зп_число_или_null,
    "currency": "RUB/USD/EUR",
    "additional": "дополнительная информация о зарплате"
  },
  "benefits": ["бенефит 1", "бенефит 2"],
  "workFormat": "Remote/Office/Hybrid/Any",
  "location": "локация или null",
  "company": {
    "name": "название компании или null",
    "industry": "отрасль или null",
    "size": "размер компании или null",
    "culture": "культура компании или null"
  },
  "employmentType": "Full-time/Part-time/Contract/Freelance",
  "education": {
    "required": "обязательное образование или null",
    "preferred": "желательное образование или null"
  },
  "keyRequirements": ["ключевое требование 1", "ключевое требование 2"],
  "niceToHave": ["приятный бонус 1", "приятный бонус 2"],
  "applicationInstructions": "инструкции по подаче заявки или null"
}

Правила:
- Если информация не найдена, используй null или пустые массивы
- Числовые значения должны быть числами, не строками
- Все строки должны быть на русском языке
- Навыки извлекай как отдельные элементы массива
- Будь максимально точным в извлечении информации
`;

    try {
      console.log('📤 Отправляем запрос к Gemini API для анализа вакансии...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log('📥 Получен ответ от Gemini API');
      
      // Очищаем ответ от markdown и дополнительного текста
      const cleanedResponse = responseText
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        .trim();

      console.log('🔍 Парсим JSON ответ...');
      
      try {
        const parsedData = JSON.parse(cleanedResponse) as ParsedJobData;
        
        // Валидация и очистка данных
        const validatedData = this.validateAndCleanJobData(parsedData);
        
        console.log('✅ Анализ вакансии завершен успешно');
        return validatedData;
        
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON от Gemini:', parseError);
        console.log('📄 Сырой ответ:', cleanedResponse);
        
        // Возвращаем базовую структуру с извлеченным текстом
        return this.createFallbackJobData(text);
      }
      
    } catch (error) {
      console.error('❌ Ошибка анализа текста вакансии через Gemini:', error);
      
      // Возвращаем базовую структуру при ошибке API
      return this.createFallbackJobData(text);
    }
  }

  private validateAndCleanJobData(data: ParsedJobData): ParsedJobData {
    return {
      title: data.title || 'Без названия',
      description: data.description || '',
      requirements: data.requirements || '',
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      skills: {
        required: Array.isArray(data.skills?.required) ? data.skills.required : [],
        preferred: Array.isArray(data.skills?.preferred) ? data.skills.preferred : [],
        technical: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
      },
      experience: {
        minYears: typeof data.experience?.minYears === 'number' ? data.experience.minYears : undefined,
        maxYears: typeof data.experience?.maxYears === 'number' ? data.experience.maxYears : undefined,
        level: data.experience?.level || 'Any',
        areas: Array.isArray(data.experience?.areas) ? data.experience.areas : [],
      },
      salary: {
        min: typeof data.salary?.min === 'number' ? data.salary.min : undefined,
        max: typeof data.salary?.max === 'number' ? data.salary.max : undefined,
        currency: data.salary?.currency || 'RUB',
        additional: data.salary?.additional || undefined,
      },
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      workFormat: data.workFormat || 'Any',
      location: data.location || undefined,
      company: {
        name: data.company?.name || undefined,
        industry: data.company?.industry || undefined,
        size: data.company?.size || undefined,
        culture: data.company?.culture || undefined,
      },
      employmentType: data.employmentType || 'Full-time',
      education: {
        required: data.education?.required || undefined,
        preferred: data.education?.preferred || undefined,
      },
      keyRequirements: Array.isArray(data.keyRequirements) ? data.keyRequirements : [],
      niceToHave: Array.isArray(data.niceToHave) ? data.niceToHave : [],
      applicationInstructions: data.applicationInstructions || undefined,
    };
  }

  private createFallbackJobData(text: string): ParsedJobData {
    // Базовая структура при ошибке AI анализа
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const title = lines[0] || 'Извлеченная вакансия';
    
    return {
      title,
      description: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      requirements: 'Требования не извлечены автоматически. Требуется ручное редактирование.',
      responsibilities: [],
      skills: {
        required: [],
        preferred: [],
        technical: [],
        soft: [],
      },
      experience: {
        level: 'Any',
        areas: [],
      },
      salary: {
        currency: 'RUB',
      },
      benefits: [],
      workFormat: 'Any',
      company: {},
      employmentType: 'Full-time',
      education: {},
      keyRequirements: [],
      niceToHave: [],
    };
  }

  public isFormatSupported(mimeType: string): boolean {
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/rtf',
      'text/rtf',
      'text/plain',
      'text/html',
      'text/markdown'
    ];
    
    return supportedMimeTypes.includes(mimeType);
  }

  public getSupportedFormats(): string[] {
    return [
      'PDF (application/pdf)',
      'DOCX (Word)',
      'DOC (Word)',
      'RTF',
      'TXT (текстовые файлы)',
      'HTML',
      'Markdown'
    ];
  }

  public getMaxFileSize(): number {
    return this.config.maxFileSize;
  }
}

// Утилиты для работы с данными вакансии
export class JobDataUtils {
  static validateJobData(data: ParsedJobData): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (!data.title || data.title.trim().length === 0) {
      missingFields.push('title');
    }
    
    if (!data.description || data.description.trim().length === 0) {
      missingFields.push('description');
    }
    
    if (!data.requirements || data.requirements.trim().length === 0) {
      missingFields.push('requirements');
    }
    
    if (!data.skills.required.length && !data.skills.technical.length) {
      missingFields.push('skills');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  static extractAllSkills(data: ParsedJobData): string[] {
    const allSkills = [
      ...data.skills.required,
      ...data.skills.preferred,
      ...data.skills.technical,
      ...data.skills.soft,
    ];
    
    // Удаляем дубликаты и пустые строки
    return Array.from(new Set(allSkills)).filter(skill => skill.trim().length > 0);
  }

  static formatSalaryRange(data: ParsedJobData): string | null {
    const { min, max, currency, additional } = data.salary;
    
    if (!min && !max) {
      return additional || null;
    }
    
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('ru-RU').format(num);
    };
    
    let result = '';
    
    if (min && max) {
      result = `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
    } else if (min) {
      result = `от ${formatNumber(min)} ${currency}`;
    } else if (max) {
      result = `до ${formatNumber(max)} ${currency}`;
    }
    
    if (additional) {
      result += ` (${additional})`;
    }
    
    return result || null;
  }

  static getExperienceRange(data: ParsedJobData): string | null {
    const { minYears, maxYears, level } = data.experience;
    
    if (!minYears && !maxYears && level === 'Any') {
      return null;
    }
    
    let result = '';
    
    if (minYears && maxYears) {
      result = `${minYears}-${maxYears} лет`;
    } else if (minYears) {
      result = `от ${minYears} лет`;
    } else if (maxYears) {
      result = `до ${maxYears} лет`;
    }
    
    if (level && level !== 'Any') {
      result += result ? ` (${level})` : level;
    }
    
    return result || null;
  }
}
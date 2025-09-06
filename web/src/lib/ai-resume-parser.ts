import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from 'mammoth';
import parseRTF from 'rtf-parser';

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  role: string;
  duration?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  expiryDate?: string;
}

export interface Language {
  language: string;
  level: string; // Native, Fluent, Advanced, Intermediate, Basic
}

export interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  databases: string[];
  languages: Language[];
}

export interface ParsedResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  skills: Skills;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  totalExperienceYears: number;
  seniorityLevel: string; // Junior, Middle, Senior, Lead, Architect
  keyStrengths: string[];
  improvementAreas: string[];
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
    images: boolean;
  };
  maxFileSize: number; // в байтах
}

export class UniversalResumeParser {
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
        images: true,
      },
      maxFileSize: 20 * 1024 * 1024, // 20MB
      ...config
    };
  }

  async parseResume(file: File): Promise<ParsedResumeData> {
    // Проверяем размер файла
    if (file.size > this.config.maxFileSize) {
      throw new Error(`Файл слишком большой. Максимум: ${this.config.maxFileSize / 1024 / 1024}MB`);
    }

    const mimeType = file.type;
    const buffer = await file.arrayBuffer();

    console.log(`Обрабатываем файл: ${file.name}, тип: ${mimeType}, размер: ${file.size} байт`);

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
        return this.parseRtf(buffer);
      
      case 'text/plain':
        if (!this.config.supportedFormats.txt) {
          throw new Error('TXT файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseText(await file.text());
      
      case 'text/html':
        if (!this.config.supportedFormats.html) {
          throw new Error('HTML файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseHTML(await file.text());
      
      case 'text/markdown':
        if (!this.config.supportedFormats.md) {
          throw new Error('Markdown файлы не поддерживаются в текущей конфигурации');
        }
        return this.parseMarkdown(await file.text());
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/webp':
        if (!this.config.supportedFormats.images) {
          throw new Error('Изображения не поддерживаются в текущей конфигурации');
        }
        return this.parseImage(buffer, mimeType);
      
      default:
        // Попробуем обработать как текст
        try {
          const text = await file.text();
          if (text.length > 0) {
            console.log('Неизвестный формат, пробуем как текст');
            return this.parseText(text);
          }
        } catch (error) {
          console.error('Не удалось прочитать как текст:', error);
        }
        throw new Error(`Неподдерживаемый формат файла: ${mimeType}`);
    }
  }

  // 1. PDF - нативная поддержка Gemini (лучший результат)
  private async parsePDF(buffer: ArrayBuffer): Promise<ParsedResumeData> {
    const model = this.ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.getResumeSchema()
      }
    });

    const prompt = this.getAnalysisPrompt();
    
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: Buffer.from(buffer).toString("base64")
        }
      }
    ];

    console.log('Анализируем PDF через Gemini Document Processing...');
    const response = await model.generateContent({ contents });
    const result = JSON.parse(response.response.text());
    
    console.log('PDF успешно проанализирован');
    return result;
  }

  // 2. DOCX - извлекаем текст + AI анализ  
  private async parseDocx(buffer: ArrayBuffer): Promise<ParsedResumeData> {
    try {
      console.log('Извлекаем текст из DOCX...');
      console.log(`Размер ArrayBuffer: ${buffer.byteLength} байт`);
      
      // Конвертируем ArrayBuffer в Node.js Buffer для mammoth
      const nodeBuffer = Buffer.from(buffer);
      console.log(`Размер Node.js Buffer: ${nodeBuffer.length} байт`);
      
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      const text = result.value;
      
      if (!text.trim()) {
        throw new Error('Не удалось извлечь текст из DOCX файла');
      }
      
      console.log(`Извлечено ${text.length} символов из DOCX`);
      return this.parseText(text);
    } catch (error) {
      console.error('Ошибка при обработке DOCX:', error);
      
      // Добавим больше диагностической информации
      if (error instanceof Error) {
        console.error('Детали ошибки:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw new Error(`Не удалось обработать DOCX файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // 3. DOC - старый формат Word (ограниченная поддержка)
  private async parseDoc(buffer: ArrayBuffer): Promise<ParsedResumeData> {
    // Для старых .doc файлов mammoth имеет ограниченную поддержку
    try {
      console.log('Пытаемся извлечь текст из DOC...');
      console.log(`Размер ArrayBuffer: ${buffer.byteLength} байт`);
      
      // Конвертируем ArrayBuffer в Node.js Buffer для mammoth
      const nodeBuffer = Buffer.from(buffer);
      console.log(`Размер Node.js Buffer: ${nodeBuffer.length} байт`);
      
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      const text = result.value;
      
      if (!text.trim()) {
        throw new Error('Не удалось извлечь текст из DOC файла. Рекомендуется конвертировать в DOCX или PDF');
      }
      
      console.log(`Извлечено ${text.length} символов из DOC`);
      return this.parseText(text);
    } catch (error) {
      console.error('Ошибка при обработке DOC:', error);
      
      if (error instanceof Error) {
        console.error('Детали ошибки DOC:', {
          name: error.name,
          message: error.message
        });
      }
      
      throw new Error('Не удалось обработать DOC файл. Пожалуйста, сохраните резюме в формате DOCX или PDF');
    }
  }

  // 4. RTF - Rich Text Format
  private async parseRtf(buffer: ArrayBuffer): Promise<ParsedResumeData> {
    try {
      console.log('Извлекаем текст из RTF...');
      
      // Конвертируем ArrayBuffer в строку
      const rtfContent = new TextDecoder('utf-8').decode(buffer);
      
      // Парсим RTF в объект документа
      const doc = await new Promise<any>((resolve, reject) => {
        parseRTF.string(rtfContent, (err: any, parsedDoc: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(parsedDoc);
          }
        });
      });
      
      // Извлекаем чистый текст из RTF документа
      let text = '';
      
      // Извлекаем текст из RTF документа согласно структуре rtf-parser
      // RTFDocument содержит content (массив RTFParagraph)
      // RTFParagraph содержит content (массив RTFSpan)
      // RTFSpan содержит value (строка с текстом)
      
      if (doc && doc.content && Array.isArray(doc.content)) {
        for (const paragraph of doc.content) {
          if (paragraph && paragraph.content && Array.isArray(paragraph.content)) {
            // Добавляем перенос строки между параграфами, если текст уже есть
            if (text && !text.endsWith('\n')) {
              text += '\n';
            }
            
            for (const span of paragraph.content) {
              if (span && span.value && typeof span.value === 'string') {
                text += span.value;
              }
            }
          }
        }
      }
      
      // Очищаем текст
      text = text
        .replace(/\n{3,}/g, '\n\n') // Убираем лишние переносы строк
        .replace(/\s{2,}/g, ' ')    // Убираем лишние пробелы
        .trim();
      
      if (!text) {
        throw new Error('Не удалось извлечь текст из RTF файла');
      }
      
      console.log(`Извлечено ${text.length} символов из RTF`);
      return this.parseText(text);
      
    } catch (error) {
      console.error('Ошибка при обработке RTF:', error);
      
      // Fallback: попробуем передать RTF напрямую в Gemini
      try {
        console.log('Пробуем обработать RTF как текст через Gemini...');
        const rtfContent = new TextDecoder('utf-8').decode(buffer);
        
        // Удаляем служебные RTF команды для лучшего результата
        const cleanedRtf = rtfContent
          .replace(/\\[a-z]+\d*/g, ' ')  // Убираем RTF команды
          .replace(/[{}]/g, ' ')         // Убираем скобки
          .replace(/\s+/g, ' ')          // Нормализуем пробелы
          .trim();
        
        if (cleanedRtf.length > 50) { // Проверяем что есть содержимое
          return this.parseText(cleanedRtf);
        }
      } catch (fallbackError) {
        console.error('Fallback RTF parsing также не удался:', fallbackError);
      }
      
      throw new Error(`Не удалось обработать RTF файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // 5. Текстовые форматы
  private async parseText(content: string): Promise<ParsedResumeData> {
    if (!content.trim()) {
      throw new Error('Файл пустой или не содержит текста');
    }

    const model = this.ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.getResumeSchema()
      }
    });

    const prompt = `${this.getAnalysisPrompt()}

СОДЕРЖАНИЕ РЕЗЮМЕ:
${content}`;

    console.log('Анализируем текст через Gemini...');
    const response = await model.generateContent(prompt);
    const result = JSON.parse(response.response.text());
    
    console.log('Текст успешно проанализирован');
    return result;
  }

  // 6. HTML резюме
  private async parseHTML(content: string): Promise<ParsedResumeData> {
    // Удаляем HTML теги для чистого текста
    const cleanText = content
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) {
      throw new Error('HTML файл не содержит текстового контента');
    }
    
    console.log('Обрабатываем HTML как текст');
    return this.parseText(cleanText);
  }

  // 7. Markdown резюме
  private async parseMarkdown(content: string): Promise<ParsedResumeData> {
    // Можно оставить markdown разметку, так как Gemini понимает markdown
    console.log('Обрабатываем Markdown');
    return this.parseText(content);
  }

  // 8. Изображения резюме (отсканированные)
  private async parseImage(buffer: ArrayBuffer, mimeType: string): Promise<ParsedResumeData> {
    const model = this.ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.getResumeSchema()
      }
    });

    const prompt = `${this.getAnalysisPrompt()}

Это изображение резюме. Пожалуйста, извлеки и проанализируй весь текст с изображения.`;

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: Buffer.from(buffer).toString("base64")
        }
      }
    ];

    console.log('Анализируем изображение через Gemini Vision...');
    const response = await model.generateContent({ contents });
    const result = JSON.parse(response.response.text());
    
    console.log('Изображение успешно проанализировано');
    return result;
  }

  // Промпт для анализа резюме
  private getAnalysisPrompt(): string {
    return `
Ты - эксперт по анализу резюме для российской IT-компании. Проанализируй резюме и извлеки из него МАКСИМАЛЬНО ПОЛНУЮ структурированную информацию.

ОБЯЗАТЕЛЬНО ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ! Все тексты в ответе должны быть на русском языке.

ВАЖНЫЕ ТРЕБОВАНИЯ:
1. Извлеки ВСЮ доступную информацию о кандидате
2. Стандартизируй названия технологий (JS → JavaScript, React.js → React, etc.)
3. Приведи даты к единому формату (YYYY-MM или YYYY-MM-DD)
4. Рассчитай общий опыт работы в годах
5. Определи уровень сеньорности (Junior, Middle, Senior, Lead, Architect)
6. Выдели ключевые достижения и сильные стороны
7. Создай краткое профессиональное резюме (summary) НА РУССКОМ ЯЗЫКЕ
8. Если информация отсутствует, оставь поле пустым или null

ЯЗЫКОВЫЕ ТРЕБОВАНИЯ:
- Все описания, summary, достижения - НА РУССКОМ ЯЗЫКЕ
- Названия компаний, технологий, учебных заведений - оставь как есть
- keyStrengths и improvementAreas - НА РУССКОМ ЯЗЫКЕ
- Используй профессиональную терминологию на русском

ОСОБОЕ ВНИМАНИЕ:
- Навыки должны быть правильно категоризированы
- Опыт работы должен содержать конкретные достижения НА РУССКОМ
- Проекты должны включать использованные технологии
- Образование должно быть полным и точным

Результат должен быть ТОЛЬКО в формате JSON согласно предоставленной схеме.
`;
  }

  // JSON Schema для structured output
  private getResumeSchema() {
    return {
      type: "object",
      properties: {
        personalInfo: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            linkedin: { type: "string" },
            github: { type: "string" },
            portfolio: { type: "string" }
          }
        },
        summary: { type: "string" },
        skills: {
          type: "object",
          properties: {
            technical: { type: "array", items: { type: "string" } },
            soft: { type: "array", items: { type: "string" } },
            tools: { type: "array", items: { type: "string" } },
            frameworks: { type: "array", items: { type: "string" } },
            databases: { type: "array", items: { type: "string" } },
            languages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  language: { type: "string" },
                  level: { type: "string" }
                }
              }
            }
          }
        },
        workExperience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              position: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              duration: { type: "string" },
              description: { type: "string" },
              achievements: { type: "array", items: { type: "string" } },
              technologies: { type: "array", items: { type: "string" } }
            }
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              institution: { type: "string" },
              degree: { type: "string" },
              field: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              grade: { type: "string" }
            }
          }
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              technologies: { type: "array", items: { type: "string" } },
              url: { type: "string" },
              role: { type: "string" },
              duration: { type: "string" }
            }
          }
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              issuer: { type: "string" },
              date: { type: "string" },
              url: { type: "string" },
              expiryDate: { type: "string" }
            }
          }
        },
        totalExperienceYears: { type: "number" },
        seniorityLevel: { type: "string" },
        keyStrengths: { type: "array", items: { type: "string" } },
        improvementAreas: { type: "array", items: { type: "string" } }
      },
      required: ["personalInfo", "summary", "skills", "workExperience", "education", "totalExperienceYears", "seniorityLevel"]
    };
  }

  // Метод для получения поддерживаемых форматов
  getSupportedFormats(): string[] {
    const formats: string[] = [];
    
    if (this.config.supportedFormats.pdf) formats.push('.pdf');
    if (this.config.supportedFormats.docx) formats.push('.docx');  
    if (this.config.supportedFormats.doc) formats.push('.doc');
    if (this.config.supportedFormats.rtf) formats.push('.rtf');
    if (this.config.supportedFormats.txt) formats.push('.txt');
    if (this.config.supportedFormats.html) formats.push('.html');
    if (this.config.supportedFormats.md) formats.push('.md');
    if (this.config.supportedFormats.images) formats.push('.jpg', '.jpeg', '.png', '.webp');
    
    return formats;
  }

  // Проверка поддержки формата файла
  isFormatSupported(mimeType: string): boolean {
    const supportedMimeTypes = {
      'application/pdf': this.config.supportedFormats.pdf,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.config.supportedFormats.docx,
      'application/msword': this.config.supportedFormats.doc,
      'application/rtf': this.config.supportedFormats.rtf,
      'text/rtf': this.config.supportedFormats.rtf,
      'text/plain': this.config.supportedFormats.txt,
      'text/html': this.config.supportedFormats.html,
      'text/markdown': this.config.supportedFormats.md,
      'image/jpeg': this.config.supportedFormats.images,
      'image/png': this.config.supportedFormats.images,
      'image/webp': this.config.supportedFormats.images,
    };

    return supportedMimeTypes[mimeType as keyof typeof supportedMimeTypes] || false;
  }
}

// Utility функции для работы с результатами парсинга
export class ResumeDataUtils {
  // Извлечь все навыки в плоский массив
  static extractAllSkills(data: ParsedResumeData): string[] {
    const allSkills = [
      ...data.skills.technical,
      ...data.skills.soft,
      ...data.skills.tools,
      ...data.skills.frameworks,
      ...data.skills.databases
    ];
    
    return Array.from(new Set(allSkills)).filter(skill => skill.trim().length > 0);
  }

  // Получить краткую информацию об образовании
  static getEducationSummary(data: ParsedResumeData): string | null {
    if (data.education.length === 0) return null;
    
    const latest = data.education[0]; // Предполагаем, что первое - самое новое
    return `${latest.degree} в ${latest.institution}`;
  }

  // Рассчитать совместимость навыков с требованиями
  static calculateSkillsMatch(candidateSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 100;
    
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase());
    
    const matches = normalizedRequired.filter(skill => 
      normalizedCandidate.some(candidateSkill => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );
    
    return Math.round((matches.length / normalizedRequired.length) * 100);
  }

  // Получить последнее место работы
  static getLatestJob(data: ParsedResumeData): WorkExperience | null {
    if (data.workExperience.length === 0) return null;
    return data.workExperience[0]; // Предполагаем, что опыт отсортирован по убыванию
  }

  // Проверить наличие обязательной информации
  static validateResumeData(data: ParsedResumeData): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (!data.personalInfo.name) missingFields.push('Имя');
    if (!data.summary) missingFields.push('Краткое описание');
    if (data.workExperience.length === 0) missingFields.push('Опыт работы');
    if (ResumeDataUtils.extractAllSkills(data).length === 0) missingFields.push('Навыки');
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
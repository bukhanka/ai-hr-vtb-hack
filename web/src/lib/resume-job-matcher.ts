import { GoogleGenerativeAI } from '@google/generative-ai';

// Типы для анализа соответствия
export interface JobMatchResult {
  overallScore: number; // 0-100
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  confidence: number; // Уверенность AI в оценке
  
  detailedAnalysis: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceGap?: string;
    strengths: string[];
    weaknesses: string[];
    redFlags: string[];
    recommendations: string[];
  };
  
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'WEAK_MATCH' | 'NO_MATCH';
  reasoningNotes: string;
}

export interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  summary?: string;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
    frameworks: string[];
    databases: string[];
  };
  workExperience: Array<{
    position: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  totalExperienceYears?: number;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
}

export interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  experience?: string;
  salary?: string;
}

export class ResumeJobMatcher {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY не найден в переменных окружения');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Основной метод для анализа соответствия резюме и вакансии
   */
  async analyzeMatch(resume: ParsedResumeData, job: JobData): Promise<JobMatchResult> {
    try {
      console.log(`🔍 Анализируем соответствие резюме кандидата вакансии: ${job.title}`);
      
      const prompt = this.generateMatchingPrompt(resume, job);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Парсим JSON ответ от AI
      const analysis = this.parseAIResponse(text);
      
      console.log(`✅ Анализ завершен. Общий скор: ${analysis.overallScore}%`);
      return analysis;
      
    } catch (error) {
      console.error('❌ Ошибка анализа соответствия:', error);
      
      // Возвращаем базовый результат в случае ошибки
      return this.getFallbackResult(resume, job);
    }
  }

  /**
   * Быстрый анализ без AI (базовый алгоритм)
   */
  async quickMatch(resume: ParsedResumeData, job: JobData): Promise<JobMatchResult> {
    console.log(`⚡ Быстрый анализ соответствия без AI`);
    
    const allResumeSkills = [
      ...resume.skills.technical,
      ...resume.skills.tools,
      ...resume.skills.frameworks,
      ...resume.skills.databases
    ].map(skill => skill.toLowerCase().trim());
    
    const jobSkills = job.skills.map(skill => skill.toLowerCase().trim());
    
    // Подсчет совпадающих навыков
    const matchedSkills = jobSkills.filter(jobSkill => 
      allResumeSkills.some(resumeSkill => 
        resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
      )
    );
    
    const missingSkills = jobSkills.filter(jobSkill => 
      !allResumeSkills.some(resumeSkill => 
        resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
      )
    );
    
    // Простой расчет скора
    const skillsMatch = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 50;
    const experienceMatch = this.calculateExperienceMatch(resume, job);
    const educationMatch = resume.education.length > 0 ? 80 : 60;
    
    const overallScore = Math.round(
      (skillsMatch * 0.5) + (experienceMatch * 0.3) + (educationMatch * 0.2)
    );
    
    let recommendation: JobMatchResult['recommendation'];
    if (overallScore >= 85) recommendation = 'STRONG_MATCH';
    else if (overallScore >= 70) recommendation = 'GOOD_MATCH';
    else if (overallScore >= 50) recommendation = 'WEAK_MATCH';
    else recommendation = 'NO_MATCH';
    
    return {
      overallScore,
      skillsMatch,
      experienceMatch,
      educationMatch,
      confidence: 70, // Средняя уверенность для базового алгоритма
      detailedAnalysis: {
        matchedSkills,
        missingSkills,
        strengths: matchedSkills.length > 0 ? [`Владеет ${matchedSkills.length} из ${jobSkills.length} требуемых навыков`] : [],
        weaknesses: missingSkills.length > 0 ? [`Отсутствуют навыки: ${missingSkills.join(', ')}`] : [],
        redFlags: [],
        recommendations: missingSkills.length > 0 ? [`Рекомендуется изучить: ${missingSkills.slice(0, 3).join(', ')}`] : []
      },
      recommendation,
      reasoningNotes: `Базовый анализ: ${matchedSkills.length}/${jobSkills.length} навыков совпадает`
    };
  }

  /**
   * Генерация промпта для AI анализа
   */
  private generateMatchingPrompt(resume: ParsedResumeData, job: JobData): string {
    return `
Ты - эксперт по подбору персонала. Проанализируй соответствие резюме кандидата требованиям вакансии и верни результат СТРОГО в JSON формате.

ВАКАНСИЯ:
Название: ${job.title}
Описание: ${job.description}
Требования: ${job.requirements}
Навыки: ${job.skills.join(', ')}
Опыт: ${job.experience || 'Не указан'}

РЕЗЮМЕ КАНДИДАТА:
Имя: ${resume.personalInfo.name || 'Не указано'}
Краткое описание: ${resume.summary || 'Отсутствует'}
Технические навыки: ${resume.skills.technical.join(', ')}
Инструменты: ${resume.skills.tools.join(', ')}
Фреймворки: ${resume.skills.frameworks.join(', ')}
Базы данных: ${resume.skills.databases.join(', ')}
Опыт работы: ${resume.totalExperienceYears || 0} лет
Образование: ${resume.education.map(edu => `${edu.degree} - ${edu.institution}`).join('; ')}
Проекты: ${resume.projects.map(proj => proj.name).join(', ')}

ЗАДАЧА:
Оцени соответствие по шкале 0-100 и предоставь детальный анализ.

ВЕРНИ ОТВЕТ В СТРОГОМ JSON ФОРМАТЕ:
{
  "overallScore": число от 0 до 100,
  "skillsMatch": число от 0 до 100,
  "experienceMatch": число от 0 до 100,
  "educationMatch": число от 0 до 100,
  "confidence": число от 0 до 100,
  "detailedAnalysis": {
    "matchedSkills": ["навык1", "навык2"],
    "missingSkills": ["навык3", "навык4"],
    "experienceGap": "краткое описание недостатка опыта или null",
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "weaknesses": ["слабость 1", "слабость 2"],
    "redFlags": ["красный флаг или пустой массив"],
    "recommendations": ["рекомендация 1", "рекомендация 2"]
  },
  "recommendation": "STRONG_MATCH" | "GOOD_MATCH" | "WEAK_MATCH" | "NO_MATCH",
  "reasoningNotes": "краткое обоснование оценки"
}

ВАЖНО: Ответь ТОЛЬКО JSON, без дополнительного текста!
`;
  }

  /**
   * Парсинг ответа от AI
   */
  private parseAIResponse(text: string): JobMatchResult {
    try {
      // Очищаем текст от возможных markdown блоков
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      // Валидация обязательных полей
      if (typeof parsed.overallScore !== 'number' || 
          !parsed.detailedAnalysis || 
          !parsed.recommendation) {
        throw new Error('Неполный ответ от AI');
      }
      
      return parsed as JobMatchResult;
      
    } catch (error) {
      console.error('❌ Ошибка парсинга ответа AI:', error);
      console.log('Сырой ответ:', text);
      throw new Error('Не удалось обработать ответ AI');
    }
  }

  /**
   * Резервный результат в случае ошибки AI
   */
  private getFallbackResult(resume: ParsedResumeData, job: JobData): JobMatchResult {
    return {
      overallScore: 50,
      skillsMatch: 50,
      experienceMatch: 50,
      educationMatch: 50,
      confidence: 30,
      detailedAnalysis: {
        matchedSkills: [],
        missingSkills: job.skills,
        strengths: ['Резюме загружено'],
        weaknesses: ['Не удалось проанализировать соответствие'],
        redFlags: [],
        recommendations: ['Требуется ручная проверка']
      },
      recommendation: 'WEAK_MATCH',
      reasoningNotes: 'Анализ недоступен из-за технической ошибки'
    };
  }

  /**
   * Расчет соответствия опыта
   */
  private calculateExperienceMatch(resume: ParsedResumeData, job: JobData): number {
    const resumeExperience = resume.totalExperienceYears || 0;
    
    if (!job.experience) return 70; // Если опыт не указан в вакансии
    
    // Извлекаем числа из строки требований
    const experienceMatch = job.experience.match(/(\d+)/);
    if (!experienceMatch) return 70;
    
    const requiredExperience = parseInt(experienceMatch[1]);
    
    if (resumeExperience >= requiredExperience) return 100;
    if (resumeExperience >= requiredExperience * 0.7) return 80;
    if (resumeExperience >= requiredExperience * 0.5) return 60;
    if (resumeExperience > 0) return 40;
    
    return 20;
  }
}

export default ResumeJobMatcher;
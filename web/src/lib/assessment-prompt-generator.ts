import { AssessmentFramework, Job } from '../generated/prisma';

export interface CandidateInfo {
  name: string;
  skills?: string[];
  experience_years?: number;
  resume_summary?: string;
}

export interface PromptGeneratorConfig {
  framework: AssessmentFramework;
  job: Job;
  candidate: CandidateInfo;
  videoMetadata?: {
    duration_minutes?: number;
    file_size_mb?: number;
  };
}

export class AssessmentPromptGenerator {
  
  /**
   * Генерирует основной промпт для анализа видео интервью
   */
  generateMainPrompt(config: PromptGeneratorConfig): string {
    const { framework, job, candidate } = config;
    const criteria = framework.criteria as any;
    const weights = framework.weights as any;
    const analysisConfig = framework.analysisConfig as any;

    // Форматируем критерии для промпта
    const criteriaDescription = this.formatCriteriaForPrompt(criteria, weights);
    
    // Информация о кандидате
    const candidateInfo = this.formatCandidateInfo(candidate);
    
    // Контекст вакансии
    const jobContext = this.formatJobContext(job);

    return `
Вы - эксперт по анализу видео интервью, использующий методологию "${framework.name}" v${framework.version}.

КОНТЕКСТ ИНТЕРВЬЮ:
${jobContext}

ИНФОРМАЦИЯ О КАНДИДАТЕ:
${candidateInfo}

КРИТЕРИИ ОЦЕНКИ (анализируйте каждый отдельно):
${criteriaDescription}

ЗАДАЧИ АНАЛИЗА:
1. Оцените каждый критерий по шкале 0-100 баллов
2. Найдите конкретные доказательства для каждой оценки из видео
3. Определите общий уровень уверенности анализа (0-100%)
4. Выявите красные флаги согласно конфигурации
5. Предоставьте конкретные временные метки важных моментов

ТРЕБОВАНИЯ К АНАЛИЗУ:
- Анализируйте речь, паузы, эмоции, жестикуляцию
- Сопоставляйте ответы с требованиями вакансии
- Обращайте внимание на противоречия с резюме
- Оценивайте глубину понимания технологий
- Учитывайте культурное соответствие компании

${this.getRedFlagsInstructions(framework.redFlagsConfig as any)}

${analysisConfig.custom_prompts?.main_analysis || ''}

ФОРМАТ ОТВЕТА:
Ответьте СТРОГО в формате JSON:
{
  "criteria_scores": {
    "technical": {"score": 85, "evidence": ["Описание"], "subcriteria": {...}},
    "communication": {"score": 78, "evidence": ["Описание"]},
    ...
  },
  "overall_score": 82,
  "confidence": 90,
  "recommendation": "HIRE|REJECT|REQUIRES_CLARIFICATION",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "weaknesses": ["Слабая сторона 1", "Слабая сторона 2"],
  "red_flags": ["Красный флаг 1", ...],
  "detailed_feedback": "Подробная обратная связь для кандидата",
  "timestamps": [
    {"time": "01:23", "event": "Отличный ответ на вопрос о React"},
    {"time": "03:45", "event": "Заминка при объяснении алгоритмов"}
  ],
  "processing_notes": "Внутренние заметки для HR"
}

Анализируйте внимательно и предоставьте максимально объективную оценку!`;
  }

  /**
   * Форматирует критерии для промпта
   */
  private formatCriteriaForPrompt(criteria: any, weights: any): string {
    return Object.entries(criteria).map(([key, criterion]: [string, any]) => {
      const weight = weights[key] || 0;
      let description = `• ${key.toUpperCase()} (вес: ${weight}%) - ${criterion.description || ''}`;
      
      if (criterion.subcriteria) {
        const subcriteria = Object.entries(criterion.subcriteria)
          .map(([subKey, subCriterion]: [string, any]) => 
            `  - ${subKey}: ${subCriterion.weight}% - ${subCriterion.description || ''}`
          ).join('\n');
        description += '\n' + subcriteria;
      }
      
      return description;
    }).join('\n\n');
  }

  /**
   * Форматирует информацию о кандидате
   */
  private formatCandidateInfo(candidate: CandidateInfo): string {
    const parts = [
      `• Имя: ${candidate.name}`,
    ];

    if (candidate.skills?.length) {
      parts.push(`• Навыки из резюме: ${candidate.skills.join(', ')}`);
    }

    if (candidate.experience_years) {
      parts.push(`• Заявленный опыт: ${candidate.experience_years} лет`);
    }

    if (candidate.resume_summary) {
      parts.push(`• Краткое резюме: ${candidate.resume_summary}`);
    }

    return parts.join('\n');
  }

  /**
   * Форматирует контекст вакансии
   */
  private formatJobContext(job: Job): string {
    return `
• Позиция: ${job.title}
• Требуемые навыки: ${job.skills.join(', ')}
• Требования к опыту: ${job.experience || 'не указаны'}

ОПИСАНИЕ ПОЗИЦИИ:
${job.description}

КЛЮЧЕВЫЕ ТРЕБОВАНИЯ:
${job.requirements}`;
  }

  /**
   * Генерирует инструкции для выявления красных флагов
   */
  private getRedFlagsInstructions(redFlagsConfig: any): string {
    if (!redFlagsConfig) return '';

    const instructions = ['ВНИМАНИЕ НА КРАСНЫЕ ФЛАГИ:'];

    if (redFlagsConfig.detect_inconsistencies) {
      instructions.push('- Противоречия между резюме и ответами в интервью');
    }

    if (redFlagsConfig.detect_evasiveness) {
      instructions.push('- Уклонение от прямых ответов или избегание сложных вопросов');
    }

    if (redFlagsConfig.detect_template_answers) {
      instructions.push('- Шаблонные ответы без понимания сути');
    }

    if (redFlagsConfig.confidence_threshold) {
      instructions.push(`- Низкий уровень уверенности (менее ${redFlagsConfig.confidence_threshold}%)`);
    }

    if (redFlagsConfig.pause_threshold_seconds) {
      instructions.push(`- Чрезмерные паузы (более ${redFlagsConfig.pause_threshold_seconds} секунд)`);
    }

    return instructions.join('\n');
  }

  /**
   * Генерирует промпт для дополнительного анализа эмоций
   */
  generateEmotionalAnalysisPrompt(): string {
    return `
Дополнительно проанализируйте эмоциональные аспекты:

1. ЯЗЫК ТЕЛА:
   - Зрительный контакт с камерой
   - Поза и жестикуляция
   - Выражение лица

2. ГОЛОСОВЫЕ ХАРАКТЕРИСТИКИ:
   - Тон и интонация
   - Скорость речи
   - Паузы и заикания

3. ЭМОЦИОНАЛЬНОЕ СОСТОЯНИЕ:
   - Уверенность vs нервозность
   - Энтузиазм vs апатия
   - Стрессовые реакции

Добавьте эти наблюдения в поле "emotional_analysis" в JSON ответе.`;
  }

  /**
   * Вычисляет общий балл на основе весов критериев
   */
  calculateOverallScore(scores: Record<string, number>, weights: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [criterion, score] of Object.entries(scores)) {
      const weight = weights[criterion] || 0;
      totalScore += score * (weight / 100);
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  /**
   * Определяет рекомендацию на основе общего балла
   */
  determineRecommendation(overallScore: number, confidence: number): string {
    if (confidence < 70) {
      return 'REQUIRES_CLARIFICATION';
    }

    if (overallScore >= 80) {
      return 'HIRE';
    } else if (overallScore >= 60) {
      return 'REQUIRES_CLARIFICATION';
    } else {
      return 'REJECT';
    }
  }
}
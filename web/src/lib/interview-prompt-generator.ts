// Утилита для генерации промптов интервью
// Использует ту же логику что и в /api/livekit/interview-token/route.ts

export interface InterviewPromptData {
  candidate: {
    name: string;
    background?: string;
    skills?: string[];
    experience_years?: number;
  };
  job: {
    title: string;
    description: string;
    requirements: string;
    skills: string[];
    experience?: string;
  };
  interview_context: {
    company: string;
    duration: string;
    language: string;
    assessment_criteria: Record<string, number>;
  };
}

/**
 * Генерирует тот же промпт что используется в реальном интервью
 * Скопировано из /api/livekit/interview-token/route.ts
 */
export function constructInterviewPrompt(data: InterviewPromptData): string {
  const { candidate, job, interview_context } = data;
  
  // Форматируем навыки и опыт кандидата
  const candidateSkills = candidate.skills?.length 
    ? `Навыки из резюме: ${candidate.skills.join(', ')}`
    : 'Навыки в резюме не указаны';
    
  const candidateExperience = candidate.experience_years 
    ? `Заявленный опыт: ${candidate.experience_years} лет`
    : 'Опыт работы не указан';

  // Анализируем требования к позиции
  const requiredSkills = job.skills?.length
    ? `Ключевые навыки: ${job.skills.join(', ')}`
    : 'Специфические навыки не указаны';

  const prompt = `Вы - опытный HR-специалист ${interview_context.company}, проводящий ${interview_context.duration} видеоинтервью для предварительного отбора кандидатов. Сегодня вы собеседуете ${candidate.name} на позицию "${job.title}".

КОНТЕКСТ ИНТЕРВЬЮ:
• Позиция: ${job.title}
• Кандидат: ${candidate.name}
• ${candidateSkills}
• ${candidateExperience}
• ${requiredSkills}
• Требования к опыту: ${job.experience || 'не указаны'}

ОПИСАНИЕ ПОЗИЦИИ:
${job.description}

КЛЮЧЕВЫЕ ТРЕБОВАНИЯ:
${job.requirements}

ВАШИ ЗАДАЧИ:
1. Проверить соответствие опыта кандидата заявленному в резюме
2. Оценить технические навыки: ${job.skills.slice(0, 3).join(', ')}${job.skills.length > 3 ? ' и другие' : ''}
3. Выявить мотивацию и понимание роли
4. Оценить коммуникативные навыки и культурное соответствие
5. Дать количественную оценку по критериям (техническая экспертиза 40%, коммуникация 30%, опыт 20%, мотивация 10%)

СТРАТЕГИЯ ИНТЕРВЬЮ:
• Начните с приветствия и краткого рассказа о компании и позиции
• Попросите кандидата рассказать о себе и опыте
• Углубляйтесь в технические детали ТОЛЬКО если кандидат демонстрирует соответствующий опыт
• Задавайте конкретные вопросы о проектах и достижениях
• Адаптируйте сложность вопросов под уровень кандидата
• Завершите вопросами о мотивации и ожиданиях

ВАЖНЫЕ ПРИНЦИПЫ:
• Поддерживайте профессиональный, но дружелюбный тон
• Внимательно слушайте ответы и задавайте уточняющие вопросы
• Фиксируйте противоречия между резюме и ответами
• Оценивайте не только технические навыки, но и soft skills
• Давайте кандидату возможность задать вопросы о компании и роли

Вы видите кандидата через веб-камеру и можете оценивать невербальные сигналы. Учитывайте язык тела, уверенность в ответах, паузы и эмоциональную реакцию на вопросы.

Начните интервью с профессионального приветствия и представления себя как HR-специалиста ВТБ.`;

  return prompt;
}

/**
 * Создает данные для промпта на основе интервью из базы
 */
export function createPromptDataFromInterview(interview: any): InterviewPromptData {
  return {
    candidate: {
      name: `${interview.applicant.firstName} ${interview.applicant.lastName}`,
      background: interview.applicant.resumes[0]?.content || undefined,
      skills: interview.applicant.resumes[0]?.skills || [],
      experience_years: interview.applicant.resumes[0]?.experience || undefined,
    },
    job: {
      title: interview.job.title,
      description: interview.job.description,
      requirements: interview.job.requirements,
      skills: interview.job.skills,
      experience: interview.job.experience || undefined,
    },
    interview_context: {
      company: 'ВТБ',
      duration: '10-15 минут', // Для реального интервью
      language: 'русский',
      assessment_criteria: {
        'технические_навыки': 40,
        'коммуникация': 30,
        'опыт': 20,
        'мотивация': 10,
      },
    },
  };
}

/**
 * Адаптирует контекст для симуляции (40 минут вместо 10-15)
 */
export function createSimulationPromptData(jobData: any, resumeData: any): InterviewPromptData {
  return {
    candidate: {
      name: `${resumeData.applicant.firstName} ${resumeData.applicant.lastName}`,
      background: resumeData.content || undefined,
      skills: resumeData.skills || [],
      experience_years: resumeData.experience || undefined,
    },
    job: {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      skills: jobData.skills,
      experience: jobData.experience || undefined,
    },
    interview_context: {
      company: 'ВТБ',
      duration: '40 минут', // Для симуляции
      language: 'русский',
      assessment_criteria: {
        'технические_навыки': 40,
        'коммуникация': 30,
        'опыт': 20,
        'мотивация': 10,
      },
    },
  };
}
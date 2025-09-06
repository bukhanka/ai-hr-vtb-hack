import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { randomBytes } from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';

// Конструктор персонализированного промпта для AI агента
interface InterviewPromptData {
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

function constructInterviewPrompt(data: InterviewPromptData): string {
  const { candidate, job, interview_context } = data;
  
  // Форматируем навыки и опыт кандидата
  const candidateSkills = candidate.skills?.length 
    ? `Навыки из резюме: ${candidate.skills.join(', ')}`
    : 'Навыки в резюме не указаны';
    
  const candidateExperience = candidate.experience_years 
    ? `Заявленный опыт: ${candidate.experience_years} лет`
    : 'Опыт работы не указан';

  // Анализируем требования к позиции
  const requiredSkills = job.skills.length 
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

Начните интервью с профессионального приветствия и представления себя как HR-специалиста ${interview_context.company}.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Получен запрос на создание токена для интервью');
    
    // Проверяем авторизацию
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    const { interviewId, participantName } = await request.json();
    console.log('API: interviewId =', interviewId, 'participantName =', participantName);

    if (!interviewId || !participantName) {
      console.log('API: Ошибка - отсутствуют обязательные параметры');
      return NextResponse.json(
        { error: 'Требуются interviewId и participantName' },
        { status: 400 }
      );
    }

    // Загружаем полную информацию об интервью
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        job: {
          select: {
            title: true,
            description: true,
            requirements: true,
            skills: true,
            experience: true,
          }
        },
        applicant: {
          include: {
            resumes: {
              take: 1,
              orderBy: { uploadedAt: 'desc' },
              select: {
                content: true,
                skills: true,
                experience: true,
                education: true,
              }
            }
          }
        }
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Интервью не найдено' },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (interview.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому интервью' },
        { status: 403 }
      );
    }

    // Формируем данные для промпта
    const promptData: InterviewPromptData = {
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
        duration: '10-15 минут',
        language: 'русский',
        assessment_criteria: {
          'технические_навыки': 40,
          'коммуникация': 30,
          'опыт': 20,
          'мотивация': 10,
        },
      },
    };

    // Конструируем персонализированный промпт
    const instructions = constructInterviewPrompt(promptData);
    console.log('API: Сгенерирован персонализированный промпт для:', promptData.candidate.name);

    // Проверяем переменные окружения
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      console.log('API: Ошибка - отсутствуют переменные окружения');
      return NextResponse.json(
        { error: 'LiveKit не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      );
    }

    // Создаем уникальный идентификатор для комнаты
    const roomName = `interview-${interviewId}`;
    const identity = `${participantName}_${randomBytes(4).toString('hex')}`;

    // Метаданные для агента включают промпт и настройки
    const agentMetadata = {
      voice: 'Kore', // Можно сделать настраиваемым
      instructions: instructions,
      interviewId: interviewId,
      candidateName: promptData.candidate.name,
      jobTitle: promptData.job.title,
    };

    console.log('API: Метаданные агента подготовлены');

    // Создаем токен доступа с метаданными
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: participantName,
      metadata: JSON.stringify(agentMetadata),
    });

    // Настраиваем права доступа
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Время жизни токена - 2 часа для интервью
    at.ttl = '2h';

    const livekitToken = await at.toJwt();

    console.log('API: Токен для интервью создан успешно');
    return NextResponse.json({
      token: livekitToken,
      wsUrl: wsUrl || 'wss://localhost:7880',
      identity: identity,
      roomName: roomName,
      agentInstructions: instructions, // Для отладки/логирования
    });

  } catch (error) {
    console.error('Ошибка создания токена для интервью:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
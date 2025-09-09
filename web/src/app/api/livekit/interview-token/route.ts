import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { randomBytes } from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { constructInterviewPrompt, createPromptDataFromInterview } from '../../../../lib/interview-prompt-generator';

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

    // Формируем данные для промпта используя утилиту
    const promptData = createPromptDataFromInterview(interview);

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
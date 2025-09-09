import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { InterviewStatus } from '../../../../../generated/prisma';

// POST /api/interviews/[id]/complete - Завершение интервью с мок-результатами
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Только соискатели могут завершать свое интервью
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Только соискатели могут завершать интервью' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Находим интервью и проверяем права доступа
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            skills: true,
          }
        },
        assessment: true,
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Интервью не найдено' },
        { status: 404 }
      );
    }

    if (interview.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Проверяем статус интервью - разрешаем завершение из SCHEDULED или IN_PROGRESS
    if (interview.status !== InterviewStatus.IN_PROGRESS && interview.status !== InterviewStatus.SCHEDULED) {
      return NextResponse.json(
        { error: 'Интервью уже завершено или отменено' },
        { status: 400 }
      );
    }

    if (interview.assessment) {
      return NextResponse.json(
        { error: 'Интервью уже завершено' },
        { status: 400 }
      );
    }

    const endTime = new Date();

    // Обновляем интервью и создаем оценку в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Завершаем интервью
      const completedInterview = await tx.interview.update({
        where: { id },
        data: {
          status: InterviewStatus.COMPLETED,
          endedAt: endTime,
          transcript: 'Интервью завершено. Готов к анализу через Gemini AI.',
          aiNotes: 'Интервью завершено успешно. Видеозапись сохранена и готова для AI-анализа.',
        }
      });

      // Создаем базовую запись Assessment (анализ будет проведен отдельно через analyze-video)
      const assessment = await tx.assessment.create({
        data: {
          interviewId: id,
          assessorId: payload.userId,
          overallScore: 0, // Будет заполнено после анализа видео
          scores: {}, // Динамические результаты по критериям
          recommendation: 'PENDING', // Рекомендация будет определена после анализа
          feedback: 'Интервью завершено. Ожидает анализа видеозаписи через Gemini AI.',
          strengths: [],
          weaknesses: [],
          redFlags: [],
          analysisStatus: 'PENDING', // Статус анализа
          notes: `Интервью длилось ${Math.floor((endTime.getTime() - new Date(interview.startedAt!).getTime()) / (1000 * 60))} минут. Видеозапись готова для AI-анализа.`,
        }
      });

      return { interview: completedInterview, assessment };
    });

    return NextResponse.json({
      message: 'Интервью успешно завершено! Результаты готовы.',
      interview: {
        id: result.interview.id,
        status: result.interview.status,
        endedAt: result.interview.endedAt,
      },
      assessment: {
        id: result.assessment.id,
        overallScore: result.assessment.overallScore,
        recommendation: result.assessment.recommendation,
        feedback: result.assessment.feedback,
      }
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    return NextResponse.json(
      { error: 'Ошибка при завершении интервью' },
      { status: 500 }
    );
  }
}
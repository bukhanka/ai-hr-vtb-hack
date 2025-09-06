import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { InterviewStatus } from '../../../../../generated/prisma';

// POST /api/interviews/[id]/start - Начало интервью
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

    // Только соискатели могут начинать интервью
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Только соискатели могут начинать интервью' },
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
            status: true,
          }
        }
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

    // Проверяем статус интервью
    if (interview.status !== InterviewStatus.SCHEDULED) {
      return NextResponse.json(
        { error: 'Интервью уже началось или завершено' },
        { status: 400 }
      );
    }

    // Обновляем статус интервью на IN_PROGRESS
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        job: {
          select: {
            title: true,
            description: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Интервью началось',
      interview: {
        id: updatedInterview.id,
        status: updatedInterview.status,
        startedAt: updatedInterview.startedAt,
        job: updatedInterview.job,
      }
    });
  } catch (error) {
    console.error('Start interview error:', error);
    return NextResponse.json(
      { error: 'Ошибка при начале интервью' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../lib/auth';

// GET /api/my-applications - Мои отклики и интервью
export async function GET(request: NextRequest) {
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

    // Только соискатели могут просматривать свои отклики
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получаем все интервью пользователя
    const interviews = await prisma.interview.findMany({
      where: {
        applicantId: payload.userId,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            skills: true,
            salary: true,
            status: true,
          }
        },
        assessment: {
          select: {
            id: true,
            overallScore: true,
            recommendation: true,
            feedback: true,
            strengths: true,
            weaknesses: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      applications: interviews.map(interview => ({
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        startedAt: interview.startedAt,
        endedAt: interview.endedAt,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        job: interview.job,
        assessment: interview.assessment,
      }))
    });
  } catch (error) {
    console.error('My applications fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении заявок' },
      { status: 500 }
    );
  }
}
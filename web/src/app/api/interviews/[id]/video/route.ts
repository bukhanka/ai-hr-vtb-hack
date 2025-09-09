import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

// GET /api/interviews/[id]/video - Получение URL видеозаписи интервью (только для HR)
export async function GET(
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
    if (!payload || !isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для HR/Admin' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Проверяем существование интервью и права доступа
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    // Проверяем права доступа к интервью (создатель вакансии или админ)
    if (payload.role !== 'ADMIN' && payload.userId !== interview.job.creatorId) {
      return NextResponse.json(
        { error: 'Доступ к этому интервью запрещен' },
        { status: 403 }
      );
    }

    // Проверяем статус интервью
    const isVideoAvailable = interview.status === 'COMPLETED';
    
    // Формируем URL видеозаписи через наш прокси API для решения проблем с CORS
    const videoUrl = isVideoAvailable ? `/api/video-proxy/${id}` : null;

    return NextResponse.json({
      videoUrl: videoUrl,
      isAvailable: isVideoAvailable,
      status: interview.status,
      interview: {
        id: interview.id,
        status: interview.status,
        startedAt: interview.startedAt,
        endedAt: interview.endedAt,
        job: {
          title: interview.job.title
        },
        applicant: {
          name: `${interview.applicant.firstName} ${interview.applicant.lastName}`
        }
      }
    });

  } catch (error) {
    console.error('Video URL fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении URL видеозаписи' },
      { status: 500 }
    );
  }
}
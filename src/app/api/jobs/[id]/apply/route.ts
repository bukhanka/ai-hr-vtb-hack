import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { JobStatus, InterviewStatus } from '../../../../../generated/prisma';

// POST /api/jobs/[id]/apply - Отклик на вакансию
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Только соискатели могут откликаться на вакансии
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Откликаться на вакансии могут только соискатели' },
        { status: 403 }
      );
    }

    // Проверяем существование и статус вакансии
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    if (job.status !== JobStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Вакансия неактивна' },
        { status: 400 }
      );
    }

    // Проверяем, не подавал ли уже заявку этот пользователь
    const existingInterview = await prisma.interview.findFirst({
      where: {
        jobId: params.id,
        applicantId: payload.userId,
      },
    });

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Вы уже откликнулись на эту вакансию' },
        { status: 400 }
      );
    }

    // Создаем интервью со статусом SCHEDULED
    const interview = await prisma.interview.create({
      data: {
        jobId: params.id,
        applicantId: payload.userId,
        status: InterviewStatus.SCHEDULED,
        scheduledAt: new Date(), // Для AI-интервью можем планировать сразу
      },
      include: {
        job: {
          select: {
            title: true,
            description: true,
          }
        },
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    return NextResponse.json({
      message: 'Отклик успешно отправлен! Вам будет назначено AI-собеседование.',
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        job: interview.job,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json(
      { error: 'Ошибка при отклике на вакансию' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../../../lib/auth';

// GET /api/hr/jobs/[id]/applications - Получение откликов на вакансию (только для HR)
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

    // Проверяем существование вакансии
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        creatorId: true,
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к вакансии (создатель или админ)
    if (payload.role !== 'ADMIN' && payload.userId !== job.creatorId) {
      return NextResponse.json(
        { error: 'Доступ к этой вакансии запрещен' },
        { status: 403 }
      );
    }

    // Получаем все интервью для этой вакансии
    const applications = await prisma.interview.findMany({
      where: {
        jobId: id,
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          }
        },
        assessment: {
          select: {
            id: true,
            overallScore: true,
            technicalScore: true,
            softSkillsScore: true,
            communicationScore: true,
            recommendation: true,
            feedback: true,
            strengths: true,
            weaknesses: true,
            notes: true,
            createdAt: true,
          }
        }
      },
      orderBy: [
        {
          assessment: {
            overallScore: 'desc' // Сначала лучшие кандидаты
          }
        },
        {
          createdAt: 'desc'
        }
      ],
    });

    // Группируем по статусам для удобства HR
    const groupedApplications = {
      pending: applications.filter(app => app.status === 'SCHEDULED'),
      inProgress: applications.filter(app => app.status === 'IN_PROGRESS'),
      completed: applications.filter(app => app.status === 'COMPLETED'),
      cancelled: applications.filter(app => app.status === 'CANCELLED'),
    };

    const statistics = {
      total: applications.length,
      pending: groupedApplications.pending.length,
      inProgress: groupedApplications.inProgress.length,
      completed: groupedApplications.completed.length,
      cancelled: groupedApplications.cancelled.length,
      averageScore: applications.length > 0 
        ? applications
            .filter(app => app.assessment?.overallScore)
            .reduce((sum, app) => sum + (app.assessment?.overallScore || 0), 0) /
          applications.filter(app => app.assessment?.overallScore).length
        : 0,
      topCandidates: applications
        .filter(app => app.assessment?.overallScore && app.assessment.overallScore >= 80)
        .length,
    };

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
      },
      statistics,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        scheduledAt: app.scheduledAt,
        startedAt: app.startedAt,
        endedAt: app.endedAt,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        applicant: {
          id: app.applicant.id,
          name: `${app.applicant.firstName} ${app.applicant.lastName}`,
          email: app.applicant.email,
          phone: app.applicant.phone,
          registeredAt: app.applicant.createdAt,
        },
        assessment: app.assessment,
      })),
      groupedApplications,
    });
  } catch (error) {
    console.error('Job applications fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении откликов' },
      { status: 500 }
    );
  }
}
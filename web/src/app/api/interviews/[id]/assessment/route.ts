import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../../lib/auth';

// GET /api/interviews/[id]/assessment - Получение детального отчета по интервью для HR
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Только HR и админы могут просматривать отчеты
    if (!isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ разрешен только для HR' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Получаем детальную информацию об интервью
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            skills: true,
            salary: true,
            experience: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
            resumes: {
              select: {
                id: true,
                fileName: true,
                skills: true,
                experience: true,
                education: true,
                uploadedAt: true,
              },
              orderBy: {
                uploadedAt: 'desc'
              },
              take: 1
            }
          }
        },
        assessment: {
          include: {
            assessor: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
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

    // Проверяем, что HR может просматривать этот отчет (создатель вакансии или админ)
    if (payload.role !== 'ADMIN' && interview.job.creator.email !== payload.email) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому отчету' },
        { status: 403 }
      );
    }

    // Вычисляем дополнительную статистику
    const interviewDurationMinutes = interview.startedAt && interview.endedAt
      ? Math.floor((new Date(interview.endedAt).getTime() - new Date(interview.startedAt).getTime()) / (1000 * 60))
      : null;

    // Получаем статистику по всем интервью для этой вакансии для сравнения
    const jobStats = await prisma.interview.findMany({
      where: {
        jobId: interview.jobId,
        assessment: {
          isNot: null
        }
      },
      include: {
        assessment: {
          select: {
            overallScore: true,
            recommendation: true,
          }
        }
      }
    });

    // Также получаем общую статистику по всем интервью (включая незавершенные)
    const allJobInterviews = await prisma.interview.findMany({
      where: {
        jobId: interview.jobId,
      },
      select: {
        status: true,
        createdAt: true,
      }
    });

    const avgScore = jobStats.length > 0 
      ? jobStats.reduce((sum, int) => sum + (int.assessment?.overallScore || 0), 0) / jobStats.length
      : 0;

    const recommendationStats = jobStats.reduce((acc, int) => {
      const rec = int.assessment?.recommendation || 'UNKNOWN';
      acc[rec] = (acc[rec] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Подсчитываем статистику по статусам
    const statusStats = allJobInterviews.reduce((acc, int) => {
      acc[int.status] = (acc[int.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        startedAt: interview.startedAt,
        endedAt: interview.endedAt,
        transcript: interview.transcript,
        aiNotes: interview.aiNotes,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        durationMinutes: interviewDurationMinutes,
      },
      job: interview.job,
      applicant: {
        ...interview.applicant,
        latestResume: interview.applicant.resumes[0] || null,
      },
      assessment: interview.assessment,
      stats: {
        totalInterviews: allJobInterviews.length,
        completedInterviews: jobStats.length,
        statusBreakdown: statusStats,
        averageScore: Math.round(avgScore * 10) / 10,
        recommendations: recommendationStats,
        candidateRank: interview.assessment 
          ? jobStats.filter(int => (int.assessment?.overallScore || 0) < (interview.assessment?.overallScore || 0)).length + 1
          : null,
      }
    });
  } catch (error) {
    console.error('Interview assessment fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении отчета' },
      { status: 500 }
    );
  }
}
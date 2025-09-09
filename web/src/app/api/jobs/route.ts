// Принудительно используем Node.js Runtime вместо Edge Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../lib/auth';
import { JobStatus } from '../../../generated/prisma';

// GET /api/jobs - Получение списка вакансий
export async function GET(request: NextRequest) {
  try {
    // Для соискателей - только активные вакансии
    // Для HR/Admin - все вакансии (включая черновики и закрытые)
    
    const token = getTokenFromRequest(request);
    let showAll = false;
    
    if (token) {
      const payload = await verifyToken(token);
      if (payload && isHR(payload.role)) {
        showAll = true;
      }
    }

    const where = showAll 
      ? {} 
      : { status: JobStatus.ACTIVE };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            interviews: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        creatorName: `${job.creator.firstName} ${job.creator.lastName}`,
        applicationsCount: job._count.interviews,
      }))
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении вакансий' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Создание новой вакансии (только для HR/Admin)
export async function POST(request: NextRequest) {
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

    const {
      title,
      description,
      requirements,
      skills,
      experience,
      salary,
      status = JobStatus.DRAFT
    } = await request.json();

    // Валидация данных
    if (!title || !description || !requirements) {
      return NextResponse.json(
        { error: 'Обязательные поля: title, description, requirements' },
        { status: 400 }
      );
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать минимум один навык' },
        { status: 400 }
      );
    }

    // Создаем вакансию
    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        skills: skills.filter(skill => skill.trim() !== ''),
        experience,
        salary,
        status,
        creatorId: payload.userId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
    });

    return NextResponse.json({
      message: 'Вакансия успешно создана',
      job: {
        ...job,
        creatorName: `${job.creator.firstName} ${job.creator.lastName}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании вакансии' },
      { status: 500 }
    );
  }
}
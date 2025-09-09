import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// GET /api/admin/assessment-frameworks - Получить все фреймворки оценки
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'HR' && payload.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для HR/Admin' },
        { status: 403 }
      );
    }

    const frameworks = await prisma.assessmentFramework.findMany({
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            jobs: true,
            assessments: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      frameworks: frameworks.map(framework => ({
        id: framework.id,
        name: framework.name,
        version: framework.version,
        description: framework.description,
        isActive: framework.isActive,
        scoringMethod: framework.scoringMethod,
        criteria: framework.criteria,
        weights: framework.weights,
        analysisConfig: framework.analysisConfig,
        redFlagsConfig: framework.redFlagsConfig,
        creator: framework.creator,
        usage: {
          jobsCount: framework._count.jobs,
          assessmentsCount: framework._count.assessments
        },
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt
      }))
    });

  } catch (error) {
    console.error('Ошибка получения фреймворков:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/admin/assessment-frameworks - Создать новый фреймворк
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для Admin' },
        { status: 403 }
      );
    }

    const {
      name,
      version,
      description,
      criteria,
      weights,
      scoringMethod = 'WEIGHTED_AVERAGE',
      analysisConfig,
      redFlagsConfig,
      isActive = true
    } = await request.json();

    // Валидация данных
    if (!name || !version || !criteria || !weights) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, version, criteria, weights' },
        { status: 400 }
      );
    }

    // Проверяем уникальность имени и версии
    const existing = await prisma.assessmentFramework.findFirst({
      where: { name, version }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Фреймворк с таким именем и версией уже существует' },
        { status: 400 }
      );
    }

    const framework = await prisma.assessmentFramework.create({
      data: {
        name,
        version,
        description,
        criteria,
        weights,
        scoringMethod,
        analysisConfig: analysisConfig || {},
        redFlagsConfig: redFlagsConfig || {},
        isActive,
        creatorId: payload.userId
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Фреймворк оценки создан успешно',
      framework
    });

  } catch (error) {
    console.error('Ошибка создания фреймворка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
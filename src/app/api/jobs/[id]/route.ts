import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../lib/auth';
import { JobStatus } from '../../../../generated/prisma';

// GET /api/jobs/[id] - Получение детальной информации о вакансии
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        interviews: {
          include: {
            applicant: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          }
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    // Проверяем доступ к неактивным вакансиям
    if (job.status !== JobStatus.ACTIVE) {
      const token = getTokenFromRequest(request);
      if (!token) {
        return NextResponse.json(
          { error: 'Вакансия недоступна' },
          { status: 403 }
        );
      }

      const payload = await verifyToken(token);
      if (!payload || (!isHR(payload.role) && payload.userId !== job.creatorId)) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      job: {
        ...job,
        creatorName: `${job.creator.firstName} ${job.creator.lastName}`,
      }
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении вакансии' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Обновление вакансии (только для HR/Admin или создателя)
export async function PUT(
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

    // Проверяем существование вакансии и права доступа
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    // Доступ только для HR/Admin или создателя вакансии
    if (!isHR(payload.role) && payload.userId !== existingJob.creatorId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
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
      status
    } = await request.json();

    // Валидация данных
    const updateData: any = {};
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: 'Название вакансии не может быть пустым' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (experience !== undefined) updateData.experience = experience;
    if (salary !== undefined) updateData.salary = salary;
    if (status !== undefined) updateData.status = status;

    if (skills !== undefined) {
      if (!Array.isArray(skills) || skills.length === 0) {
        return NextResponse.json(
          { error: 'Необходимо указать минимум один навык' },
          { status: 400 }
        );
      }
      updateData.skills = skills.filter(skill => skill.trim() !== '');
    }

    // Обновляем вакансию
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'Вакансия успешно обновлена',
      job: {
        ...updatedJob,
        creatorName: `${updatedJob.creator.firstName} ${updatedJob.creator.lastName}`,
      },
    });
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении вакансии' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Удаление вакансии (только для HR/Admin или создателя)
export async function DELETE(
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

    // Проверяем существование вакансии и права доступа
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        interviews: true,
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    // Доступ только для HR/Admin или создателя вакансии
    if (!isHR(payload.role) && payload.userId !== existingJob.creatorId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Проверяем, есть ли активные интервью
    if (existingJob.interviews.length > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить вакансию с активными откликами. Сначала закройте вакансию.' },
        { status: 400 }
      );
    }

    // Удаляем вакансию
    await prisma.job.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Вакансия успешно удалена',
    });
  } catch (error) {
    console.error('Job deletion error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении вакансии' },
      { status: 500 }
    );
  }
}
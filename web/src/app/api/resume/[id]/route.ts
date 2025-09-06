import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../lib/auth';

// GET /api/resume/[id] - Получение конкретного резюме
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

    // Только соискатели могут просматривать свои резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Просматривать резюме могут только соискатели' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Получаем резюме и проверяем права доступа
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        content: true,
        skills: true,
        experience: true,
        education: true,
        uploadedAt: true,
        applicantId: true,
      }
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Резюме не найдено' },
        { status: 404 }
      );
    }

    if (resume.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому резюме' },
        { status: 403 }
      );
    }

    // Убираем applicantId из ответа
    const { applicantId, ...resumeData } = resume;

    return NextResponse.json({
      resume: resumeData,
    });
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении резюме' },
      { status: 500 }
    );
  }
}

// PUT /api/resume/[id] - Обновление резюме
export async function PUT(
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

    // Только соискатели могут редактировать резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Редактировать резюме могут только соискатели' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Проверяем существование резюме и права доступа
    const existingResume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!existingResume) {
      return NextResponse.json(
        { error: 'Резюме не найдено' },
        { status: 404 }
      );
    }

    if (existingResume.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому резюме' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, skills, experience, education } = body;

    // Валидация данных
    if (content !== undefined && typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Содержание резюме должно быть строкой' },
        { status: 400 }
      );
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Навыки должны быть массивом строк' },
        { status: 400 }
      );
    }

    if (experience !== undefined && typeof experience !== 'number' && experience !== null) {
      return NextResponse.json(
        { error: 'Опыт работы должен быть числом или null' },
        { status: 400 }
      );
    }

    if (education !== undefined && typeof education !== 'string' && education !== null) {
      return NextResponse.json(
        { error: 'Образование должно быть строкой или null' },
        { status: 400 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    
    if (content !== undefined) {
      updateData.content = content?.trim() || null;
    }
    
    if (skills !== undefined) {
      updateData.skills = skills.filter((skill: string) => skill.trim().length > 0);
    }
    
    if (experience !== undefined) {
      updateData.experience = experience;
    }
    
    if (education !== undefined) {
      updateData.education = education?.trim() || null;
    }

    // Обновляем резюме
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fileName: true,
        content: true,
        skills: true,
        experience: true,
        education: true,
        uploadedAt: true,
      }
    });

    return NextResponse.json({
      message: 'Резюме успешно обновлено',
      resume: updatedResume,
    });
  } catch (error) {
    console.error('Resume update error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении резюме' },
      { status: 500 }
    );
  }
}

// DELETE /api/resume/[id] - Удаление резюме
export async function DELETE(
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

    // Только соискатели могут удалять резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Удалять резюме могут только соискатели' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Проверяем существование резюме и права доступа
    const existingResume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!existingResume) {
      return NextResponse.json(
        { error: 'Резюме не найдено' },
        { status: 404 }
      );
    }

    if (existingResume.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому резюме' },
        { status: 403 }
      );
    }

    // Удаляем резюме
    await prisma.resume.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Резюме успешно удалено',
    });
  } catch (error) {
    console.error('Resume delete error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении резюме' },
      { status: 500 }
    );
  }
}
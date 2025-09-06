import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../lib/auth';

// POST /api/resume/upload - Загрузка резюме
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Только соискатели могут загружать резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Загружать резюме могут только соискатели' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string || '';
    const skills = formData.get('skills') as string || '';
    const experience = formData.get('experience') as string || '';
    const education = formData.get('education') as string || '';

    // Для мок-версии мы не будем сохранять файлы на диск
    // В реальной версии здесь будет загрузка в S3 или локальную файловую систему
    if (!file && !content.trim()) {
      return NextResponse.json(
        { error: 'Необходимо прикрепить файл или ввести содержание резюме' },
        { status: 400 }
      );
    }

    let fileName = 'Резюме (введено вручную)';
    let filePath = '/mock/resume/path';
    
    if (file) {
      // Валидация типа файла
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Поддерживаются только PDF, DOC, DOCX и TXT файлы' },
          { status: 400 }
        );
      }

      // Валидация размера файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'Размер файла не должен превышать 5MB' },
          { status: 400 }
        );
      }

      fileName = file.name;
      filePath = `/uploads/resumes/${payload.userId}/${Date.now()}-${fileName}`;
    }

    // Парсим навыки из строки
    const skillsArray = skills
      ? skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Парсим опыт работы
    const experienceYears = experience ? parseInt(experience) || null : null;

    // Создаем запись в базе данных
    const resume = await prisma.resume.create({
      data: {
        fileName: fileName,
        filePath: filePath,
        content: content.trim() || null,
        skills: skillsArray,
        experience: experienceYears,
        education: education.trim() || null,
        applicantId: payload.userId,
      },
      select: {
        id: true,
        fileName: true,
        skills: true,
        experience: true,
        education: true,
        uploadedAt: true,
      }
    });

    return NextResponse.json({
      message: 'Резюме успешно загружено',
      resume: resume,
    }, { status: 201 });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке резюме' },
      { status: 500 }
    );
  }
}
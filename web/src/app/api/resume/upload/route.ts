import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../lib/auth';
import { UniversalResumeParser } from '../../../../lib/ai-resume-parser';

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
      // Создаем парсер для проверки поддерживаемых форматов
      const parser = new UniversalResumeParser();
      
      // Валидация типа файла с расширенной поддержкой
      if (!parser.isFormatSupported(file.type)) {
        const supportedFormats = parser.getSupportedFormats();
        return NextResponse.json(
          { error: `Неподдерживаемый формат файла: ${file.type}. Поддерживаются: ${supportedFormats.join(', ')}` },
          { status: 400 }
        );
      }

      // Валидация размера файла (максимум 20MB для AI обработки)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'Размер файла не должен превышать 20MB' },
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
        processingStatus: file ? 'PENDING' : 'COMPLETED', // Если файл загружен, будет AI анализ
      },
      select: {
        id: true,
        fileName: true,
        skills: true,
        experience: true,
        education: true,
        uploadedAt: true,
        processingStatus: true,
      }
    });

    // Если загружен файл, запускаем фоновый AI анализ
    let aiAnalysisPromise = null;
    if (file) {
      console.log(`Запускаем фоновый AI анализ для резюме ${resume.id}`);
      
      // Запускаем AI анализ асинхронно, не блокируя ответ
      aiAnalysisPromise = performBackgroundAIAnalysis(resume.id, file, payload.userId)
        .catch(error => {
          console.error(`Фоновый AI анализ не удался для резюме ${resume.id}:`, error);
          // Обновляем статус на FAILED
          prisma.resume.update({
            where: { id: resume.id },
            data: { processingStatus: 'FAILED' }
          }).catch(updateError => {
            console.error('Не удалось обновить статус резюме:', updateError);
          });
        });
    }

    return NextResponse.json({
      message: 'Резюме успешно загружено',
      resume: resume,
      aiAnalysis: file ? {
        status: 'PENDING',
        message: 'AI анализ запущен в фоновом режиме. Результаты будут доступны через несколько минут.'
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке резюме' },
      { status: 500 }
    );
  }
}

// Функция для фонового AI анализа резюме
async function performBackgroundAIAnalysis(resumeId: string, file: File, userId: string): Promise<void> {
  try {
    console.log(`Начинаем фоновый AI анализ резюме ${resumeId}`);
    
    // Обновляем статус на "обрабатывается"
    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: 'PROCESSING' }
    });

    // Создаем парсер и анализируем резюме
    const parser = new UniversalResumeParser();
    const parsedData = await parser.parseResume(file);

    // Извлекаем основные поля для совместимости
    const allSkills = [
      ...parsedData.skills.technical,
      ...parsedData.skills.soft,
      ...parsedData.skills.tools,
      ...parsedData.skills.frameworks,
      ...parsedData.skills.databases
    ];

    const uniqueSkills = Array.from(new Set(allSkills)).filter(skill => skill.trim().length > 0);
    const totalExperience = parsedData.totalExperienceYears || 0;
    const education = parsedData.education.length > 0 
      ? `${parsedData.education[0].degree} в ${parsedData.education[0].institution}`
      : null;

    // Рассчитываем общий скор профиля
    let matchScore = 0;
    matchScore += parsedData.personalInfo.name ? 10 : 0;
    matchScore += parsedData.summary ? 15 : 0;
    matchScore += uniqueSkills.length > 0 ? 20 : 0;
    matchScore += parsedData.workExperience.length > 0 ? 25 : 0;
    matchScore += parsedData.education.length > 0 ? 15 : 0;
    matchScore += parsedData.projects.length > 0 ? 10 : 0;
    matchScore += parsedData.certifications.length > 0 ? 5 : 0;

    console.log(`AI анализ завершен для резюме ${resumeId}. Скор: ${matchScore}%`);

    // Обновляем резюме с результатами анализа
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        rawContent: `Файл: ${file.name} (${file.type})`,
        parsedData: parsedData as any,
        skills: uniqueSkills,
        experience: totalExperience,
        education: education,
        aiSummary: parsedData.summary,
        matchScore: matchScore,
        processingStatus: 'COMPLETED',
        analyzedAt: new Date()
      }
    });

    console.log(`Фоновый AI анализ успешно завершен для резюме ${resumeId}`);

  } catch (error) {
    console.error(`Ошибка фонового AI анализа для резюме ${resumeId}:`, error);
    
    // Обновляем статус на "ошибка"
    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: 'FAILED' }
    }).catch(updateError => {
      console.error('Не удалось обновить статус резюме после ошибки:', updateError);
    });
    
    throw error;
  }
}
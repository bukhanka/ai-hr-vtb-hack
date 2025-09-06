import { NextRequest, NextResponse } from 'next/server';
import { UniversalResumeParser, ResumeDataUtils } from '../../../../lib/ai-resume-parser';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../lib/auth';

// POST /api/ai/analyze-resume - AI анализ резюме
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

    // Только соискатели могут анализировать резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Анализировать резюме могут только соискатели' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string | null;
    const resumeId = formData.get('resumeId') as string | null;

    // Проверяем входные данные
    if (!resumeId) {
      return NextResponse.json(
        { error: 'ID резюме обязателен' },
        { status: 400 }
      );
    }

    if (!file && !content) {
      return NextResponse.json(
        { error: 'Необходимо предоставить файл или текстовое содержимое' },
        { status: 400 }
      );
    }

    // Проверяем права доступа к резюме
    const existingResume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { applicantId: true, processingStatus: true }
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

    // Проверяем, не обрабатывается ли уже резюме
    if (existingResume.processingStatus === 'PROCESSING') {
      return NextResponse.json(
        { error: 'Резюме уже обрабатывается. Пожалуйста, подождите' },
        { status: 409 }
      );
    }

    // Обновляем статус на "обрабатывается"
    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: 'PROCESSING' }
    });

    try {
      console.log(`Начинаем AI анализ резюме ${resumeId}`);
      
      // Создаем парсер
      const parser = new UniversalResumeParser();
      let parsedData;
      let rawContent = '';

      if (file) {
        // Проверяем поддерживаемые форматы
        if (!parser.isFormatSupported(file.type)) {
          throw new Error(`Неподдерживаемый формат файла: ${file.type}. Поддерживаются: ${parser.getSupportedFormats().join(', ')}`);
        }

        console.log(`Анализируем файл: ${file.name} (${file.type})`);
        parsedData = await parser.parseResume(file);
        rawContent = `Файл: ${file.name} (${file.type})`;
      } else if (content) {
        console.log('Анализируем текстовое содержимое');
        
        // Создаем фейковый текстовый файл для парсера
        const textFile = new File([content], 'resume.txt', { type: 'text/plain' });
        parsedData = await parser.parseResume(textFile);
        rawContent = content;
      }

      // Валидируем результат парсинга
      const validation = ResumeDataUtils.validateResumeData(parsedData);
      if (!validation.isValid) {
        console.warn('Парсинг выполнен с предупреждениями:', validation.missingFields);
      }

      // Извлекаем основные поля для совместимости с существующей схемой
      const allSkills = ResumeDataUtils.extractAllSkills(parsedData);
      const education = ResumeDataUtils.getEducationSummary(parsedData);
      const totalExperience = parsedData.totalExperienceYears || 0;

      // Рассчитываем общий скор профиля (базовая логика)
      let matchScore = 0;
      
      // Скор на основе полноты информации
      matchScore += parsedData.personalInfo.name ? 10 : 0;
      matchScore += parsedData.summary ? 15 : 0;
      matchScore += allSkills.length > 0 ? 20 : 0;
      matchScore += parsedData.workExperience.length > 0 ? 25 : 0;
      matchScore += parsedData.education.length > 0 ? 15 : 0;
      matchScore += parsedData.projects.length > 0 ? 10 : 0;
      matchScore += parsedData.certifications.length > 0 ? 5 : 0;

      console.log(`AI анализ завершен. Скор: ${matchScore}%, навыки: ${allSkills.length}, опыт: ${totalExperience} лет`);

      // Обновляем резюме с результатами AI анализа
      const updatedResume = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          rawContent: rawContent,
          parsedData: parsedData as any,
          skills: allSkills,
          experience: totalExperience,
          education: education,
          aiSummary: parsedData.summary,
          matchScore: matchScore,
          processingStatus: 'COMPLETED',
          analyzedAt: new Date()
        },
        select: {
          id: true,
          fileName: true,
          content: true,
          rawContent: true,
          skills: true,
          experience: true,
          education: true,
          aiSummary: true,
          matchScore: true,
          processingStatus: true,
          analyzedAt: true,
          uploadedAt: true
        }
      });

      return NextResponse.json({
        message: 'Резюме успешно проанализировано с помощью AI',
        resume: updatedResume,
        parsedData: parsedData,
        validation: validation,
        analysis: {
          totalSkills: allSkills.length,
          experienceYears: totalExperience,
          seniorityLevel: parsedData.seniorityLevel,
          keyStrengths: parsedData.keyStrengths,
          improvementAreas: parsedData.improvementAreas,
          completenessScore: matchScore
        }
      }, { status: 200 });

    } catch (aiError) {
      console.error('AI анализ не удался:', aiError);
      
      // Обновляем статус на "ошибка"
      await prisma.resume.update({
        where: { id: resumeId },
        data: { processingStatus: 'FAILED' }
      });

      return NextResponse.json(
        { 
          error: 'Не удалось проанализировать резюме',
          details: aiError instanceof Error ? aiError.message : 'Неизвестная ошибка AI анализа'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Resume AI analysis error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/ai/analyze-resume - Получение статуса анализа
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ только для соискателей' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'ID резюме обязателен' },
        { status: 400 }
      );
    }

    // Получаем статус обработки резюме
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        processingStatus: true,
        analyzedAt: true,
        aiSummary: true,
        matchScore: true,
        parsedData: true,
        applicantId: true
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

    return NextResponse.json({
      resumeId: resume.id,
      status: resume.processingStatus,
      analyzedAt: resume.analyzedAt,
      hasAiData: !!resume.parsedData,
      summary: resume.aiSummary,
      matchScore: resume.matchScore
    });

  } catch (error) {
    console.error('Get analysis status error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статуса анализа' },
      { status: 500 }
    );
  }
}
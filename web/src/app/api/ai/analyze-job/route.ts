import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../lib/auth';
import { JobDocumentParser, JobDataUtils } from '../../../../lib/job-document-parser';

// POST /api/ai/analyze-job - Анализ документа вакансии через AI
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Получен запрос на AI анализ документа вакансии');
    
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

    // Только HR могут анализировать документы вакансий
    if (!isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Анализ документов вакансий доступен только HR специалистам' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string || '';
    const jobId = formData.get('jobId') as string || '';

    console.log('📋 Параметры запроса:', {
      hasFile: !!file,
      hasContent: !!content.trim(),
      jobId: jobId || 'не указан',
      fileInfo: file ? `${file.name} (${file.type}, ${file.size} байт)` : 'нет файла'
    });

    // Проверяем наличие данных для анализа
    if (!file && !content.trim()) {
      return NextResponse.json(
        { error: 'Необходимо прикрепить файл или ввести текст вакансии' },
        { status: 400 }
      );
    }

    // Если указан jobId, проверяем права доступа к вакансии
    if (jobId) {
      const existingJob = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, creatorId: true }
      });

      if (!existingJob) {
        return NextResponse.json(
          { error: 'Вакансия не найдена' },
          { status: 404 }
        );
      }

      // Проверяем, что пользователь имеет право редактировать эту вакансию
      if (existingJob.creatorId !== payload.userId) {
        return NextResponse.json(
          { error: 'У вас нет прав на редактирование этой вакансии' },
          { status: 403 }
        );
      }
    }

    // Если есть jobId, обновляем статус на "обрабатывается"
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { processingStatus: 'PROCESSING' }
      });
    }

    try {
      console.log(`🤖 Начинаем AI анализ документа вакансии ${jobId || '(новой)'}`);
      
      // Создаем парсер
      const parser = new JobDocumentParser();
      let parsedData;
      let rawContent = '';

      if (file) {
        // Проверяем поддерживаемые форматы
        if (!parser.isFormatSupported(file.type)) {
          throw new Error(`Неподдерживаемый формат файла: ${file.type}. Поддерживаются: ${parser.getSupportedFormats().join(', ')}`);
        }

        console.log(`📄 Анализируем файл: ${file.name} (${file.type})`);
        parsedData = await parser.parseJobDocument(file);
        rawContent = `Файл: ${file.name} (${file.type})`;
      } else if (content) {
        console.log('📝 Анализируем текстовое содержимое');
        
        // Создаем фейковый текстовый файл для парсера
        const textFile = new File([content], 'job_description.txt', { type: 'text/plain' });
        parsedData = await parser.parseJobDocument(textFile);
        rawContent = content;
      }

      // Валидируем результат парсинга
      const validation = JobDataUtils.validateJobData(parsedData!);
      if (!validation.isValid) {
        console.warn('⚠️ Парсинг выполнен с предупреждениями:', validation.missingFields);
      }

      // Извлекаем основные поля для совместимости с существующей схемой
      const allSkills = JobDataUtils.extractAllSkills(parsedData!);
      const salaryRange = JobDataUtils.formatSalaryRange(parsedData!);
      const experienceRange = JobDataUtils.getExperienceRange(parsedData!);

      // Создаем краткое AI резюме
      const aiSummary = `AI анализ: Позиция ${parsedData!.experience.level} уровня. Ключевые навыки: ${allSkills.slice(0, 5).join(', ')}${allSkills.length > 5 ? ' и др.' : ''}. ${parsedData!.workFormat !== 'Any' ? `Формат: ${parsedData!.workFormat}.` : ''} ${parsedData!.location ? `Локация: ${parsedData!.location}.` : ''}`;

      console.log('📊 AI анализ завершен:', {
        title: parsedData!.title,
        skillsCount: allSkills.length,
        responsibilitiesCount: parsedData!.responsibilities.length,
        hasRequirements: !!parsedData!.requirements,
        hasSalary: !!(parsedData!.salary.min || parsedData!.salary.max)
      });

      // Если есть jobId, обновляем существующую вакансию
      if (jobId) {
        const updatedJob = await prisma.job.update({
          where: { id: jobId },
          data: {
            title: parsedData!.title,
            description: parsedData!.description,
            requirements: parsedData!.requirements,
            skills: allSkills,
            experience: experienceRange,
            salary: salaryRange,
            rawJobDocument: rawContent,
            parsedJobData: parsedData as any,
            aiSummary: aiSummary,
            processingStatus: 'COMPLETED',
            analyzedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            skills: true,
            experience: true,
            salary: true,
            processingStatus: true,
            aiSummary: true,
            analyzedAt: true,
          }
        });

        return NextResponse.json({
          success: true,
          job: updatedJob,
          parsedData: parsedData,
          aiSummary: aiSummary,
          extractedSkills: allSkills,
          validation: validation,
          message: 'Документ успешно проанализирован и вакансия обновлена'
        });
      } else {
        // Возвращаем только результат анализа без сохранения
        return NextResponse.json({
          success: true,
          parsedData: parsedData,
          extractedData: {
            title: parsedData!.title,
            description: parsedData!.description,
            requirements: parsedData!.requirements,
            skills: allSkills,
            experience: experienceRange,
            salary: salaryRange,
          },
          aiSummary: aiSummary,
          validation: validation,
          message: 'Документ успешно проанализирован'
        });
      }

    } catch (error: any) {
      console.error('❌ Ошибка AI анализа документа вакансии:', error);
      
      // Если есть jobId, обновляем статус на ошибку
      if (jobId) {
        await prisma.job.update({
          where: { id: jobId },
          data: { 
            processingStatus: 'FAILED',
            aiSummary: `Ошибка анализа: ${error.message || 'Неизвестная ошибка'}`
          }
        }).catch(updateError => {
          console.error('Не удалось обновить статус вакансии:', updateError);
        });
      }

      return NextResponse.json(
        { 
          error: error.message || 'Ошибка при анализе документа',
          details: error.stack ? error.stack.split('\n').slice(0, 3) : undefined
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Общая ошибка в analyze-job:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при обработке запроса анализа' },
      { status: 500 }
    );
  }
}

// GET /api/ai/analyze-job - Получение статуса анализа вакансии
export async function GET(request: NextRequest) {
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

    // Только HR могут получать информацию об анализе вакансий
    if (!isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Не указан ID вакансии' },
        { status: 400 }
      );
    }

    // Получаем информацию о вакансии
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        processingStatus: true,
        aiSummary: true,
        analyzedAt: true,
        parsedJobData: true,
        fileName: true,
        creatorId: true,
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (job.creatorId !== payload.userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой вакансии' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      title: job.title,
      processingStatus: job.processingStatus,
      aiSummary: job.aiSummary,
      analyzedAt: job.analyzedAt,
      fileName: job.fileName,
      hasFullParsedData: !!job.parsedJobData,
      message: getStatusMessage(job.processingStatus)
    });

  } catch (error: any) {
    console.error('❌ Ошибка при получении статуса анализа:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о статусе анализа' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Документ находится в очереди на обработку';
    case 'PROCESSING':
      return 'Документ обрабатывается AI. Пожалуйста, подождите...';
    case 'COMPLETED':
      return 'Анализ завершен успешно';
    case 'FAILED':
      return 'Произошла ошибка при анализе документа';
    case 'MANUAL':
      return 'Вакансия создана вручную';
    default:
      return 'Неизвестный статус';
  }
}
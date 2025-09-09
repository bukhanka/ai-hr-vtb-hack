import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../lib/auth';
import { JobDocumentParser } from '../../../../lib/job-document-parser';

// POST /api/jobs/upload - Загрузка документа вакансии
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

    // Только HR могут загружать документы вакансий
    if (!isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Загружать документы вакансий могут только HR специалисты' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string || '';

    // Для мок-версии мы не будем сохранять файлы на диск
    // В реальной версии здесь будет загрузка в S3 или локальную файловую систему
    if (!file && !content.trim()) {
      return NextResponse.json(
        { error: 'Необходимо прикрепить файл или ввести содержание вакансии' },
        { status: 400 }
      );
    }

    let fileName = 'Вакансия (введена вручную)';
    let filePath = '';
    
    if (file) {
      fileName = file.name;
      // В реальной версии здесь будет сохранение файла
      filePath = `/uploads/jobs/${Date.now()}_${file.name}`;
      
      console.log(`📄 Загружается файл вакансии: ${fileName} (${file.size} байт)`);
    }

    // Создаем запись в базе данных
    const job = await prisma.job.create({
      data: {
        title: 'Обрабатывается...',
        description: 'Документ обрабатывается ИИ...',
        requirements: 'Требования извлекаются...',
        skills: [],
        fileName: fileName,
        filePath: filePath,
        rawJobDocument: content.trim() || null,
        processingStatus: file ? 'PENDING' : 'COMPLETED',
        status: 'DRAFT', // Всегда создаем как черновик
        creatorId: payload.userId,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        processingStatus: true,
        status: true,
        createdAt: true,
      }
    });

    // Если загружен файл, запускаем фоновый AI анализ
    let aiAnalysisPromise = null;
    if (file) {
      console.log(`🤖 Запускаем фоновый AI анализ для вакансии ${job.id}`);
      
      // Запускаем AI анализ асинхронно, не блокируя ответ
      aiAnalysisPromise = performBackgroundJobAIAnalysis(job.id, file, payload.userId)
        .catch(error => {
          console.error(`❌ Фоновый AI анализ не удался для вакансии ${job.id}:`, error);
          // Обновляем статус на FAILED
          prisma.job.update({
            where: { id: job.id },
            data: { 
              processingStatus: 'FAILED',
              title: 'Ошибка обработки',
              description: 'Не удалось обработать документ. Пожалуйста, заполните вакансию вручную.',
              requirements: 'Требования не извлечены'
            }
          }).catch(updateError => {
            console.error('Не удалось обновить статус вакансии:', updateError);
          });
        });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        fileName: job.fileName,
        processingStatus: job.processingStatus,
        status: job.status,
        createdAt: job.createdAt,
      },
      message: file 
        ? 'Документ загружен и отправлен на AI анализ. Результаты будут доступны через несколько секунд.'
        : 'Вакансия создана успешно.',
    });

  } catch (error: any) {
    console.error('Job upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка при загрузке документа вакансии' },
      { status: 500 }
    );
  }
}

// Функция для фонового AI анализа документа вакансии
async function performBackgroundJobAIAnalysis(jobId: string, file: File, userId: string): Promise<void> {
  try {
    console.log(`🔄 Начинаем фоновый AI анализ вакансии ${jobId}`);
    
    // Обновляем статус на "обрабатывается"
    await prisma.job.update({
      where: { id: jobId },
      data: { processingStatus: 'PROCESSING' }
    });

    // Создаем парсер и анализируем документ
    const parser = new JobDocumentParser();
    const parsedData = await parser.parseJobDocument(file);

    console.log(`✅ AI анализ завершен для вакансии ${jobId}`);
    console.log('📊 Извлеченные данные:', {
      title: parsedData.title,
      skillsCount: parser.extractAllSkills ? JobDocumentParser.prototype.constructor.prototype.extractAllSkills?.call(null, parsedData)?.length || 0 : 0,
      responsibilitiesCount: parsedData.responsibilities.length,
      salary: parsedData.salary
    });

    // Подготавливаем данные для совместимости с существующей схемой
    const allSkills = [
      ...parsedData.skills.required,
      ...parsedData.skills.preferred,
      ...parsedData.skills.technical,
      ...parsedData.skills.soft
    ];
    
    const uniqueSkills = Array.from(new Set(allSkills)).filter(skill => skill.trim().length > 0);
    
    // Формируем строку опыта
    let experienceStr = '';
    if (parsedData.experience.minYears && parsedData.experience.maxYears) {
      experienceStr = `${parsedData.experience.minYears}-${parsedData.experience.maxYears} лет`;
    } else if (parsedData.experience.minYears) {
      experienceStr = `от ${parsedData.experience.minYears} лет`;
    } else if (parsedData.experience.level !== 'Any') {
      experienceStr = parsedData.experience.level;
    }

    // Формируем строку зарплаты
    let salaryStr = '';
    if (parsedData.salary.min && parsedData.salary.max) {
      salaryStr = `${parsedData.salary.min.toLocaleString('ru-RU')} - ${parsedData.salary.max.toLocaleString('ru-RU')} ${parsedData.salary.currency}`;
    } else if (parsedData.salary.min) {
      salaryStr = `от ${parsedData.salary.min.toLocaleString('ru-RU')} ${parsedData.salary.currency}`;
    } else if (parsedData.salary.max) {
      salaryStr = `до ${parsedData.salary.max.toLocaleString('ru-RU')} ${parsedData.salary.currency}`;
    }
    
    if (parsedData.salary.additional) {
      salaryStr += salaryStr ? ` (${parsedData.salary.additional})` : parsedData.salary.additional;
    }

    // Создаем краткое AI резюме
    const aiSummary = `AI анализ: Позиция ${parsedData.experience.level} уровня, требует ${uniqueSkills.slice(0, 5).join(', ')}${uniqueSkills.length > 5 ? ' и др.' : ''}. ${parsedData.workFormat !== 'Any' ? `Формат работы: ${parsedData.workFormat}.` : ''} ${parsedData.location ? `Локация: ${parsedData.location}.` : ''}`;

    // Обновляем вакансию с результатами анализа
    await prisma.job.update({
      where: { id: jobId },
      data: {
        title: parsedData.title,
        description: parsedData.description,
        requirements: parsedData.requirements,
        skills: uniqueSkills,
        experience: experienceStr || null,
        salary: salaryStr || null,
        parsedJobData: parsedData as any, // Сохраняем полные данные в JSON
        aiSummary: aiSummary,
        processingStatus: 'COMPLETED',
        analyzedAt: new Date(),
      }
    });

    console.log(`🎉 Вакансия ${jobId} успешно обработана и обновлена`);

  } catch (error) {
    console.error(`❌ Ошибка фонового AI анализа для вакансии ${jobId}:`, error);
    
    // Обновляем статус на неудачный
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        processingStatus: 'FAILED',
        title: 'Ошибка обработки документа',
        description: `Произошла ошибка при анализе документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Пожалуйста, отредактируйте вакансию вручную.`,
        requirements: 'Требования не извлечены автоматически',
        aiSummary: `Ошибка AI анализа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }).catch(updateError => {
      console.error('Не удалось обновить статус вакансии на FAILED:', updateError);
    });
    
    throw error;
  }
}
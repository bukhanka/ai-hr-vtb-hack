import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { Storage } from '@google-cloud/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AssessmentPromptGenerator, CandidateInfo } from '../../../../../lib/assessment-prompt-generator';

// POST /api/interviews/[id]/analyze-video - Анализ видео интервью через Gemini
export async function POST(
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
    if (!payload || !isHR(payload.role)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для HR/Admin' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestBody = await request.json().catch(() => ({}));
    const { frameworkOverride, customConfig } = requestBody;

    // Получаем интервью с полной информацией
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            assessmentFramework: true,
            creator: true
          }
        },
        applicant: {
          include: {
            resumes: {
              orderBy: { uploadedAt: 'desc' },
              take: 1
            }
          }
        },
        assessment: true
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Интервью не найдено' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к интервью
    if (payload.role !== 'ADMIN' && payload.userId !== interview.job.creator.id) {
      return NextResponse.json(
        { error: 'Доступ к этому интервью запрещен' },
        { status: 403 }
      );
    }

    // Проверяем статус интервью
    if (interview.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Интервью должно быть завершено для анализа' },
        { status: 400 }
      );
    }

    // Определяем фреймворк для анализа
    let framework = interview.job.assessmentFramework;
    
    if (frameworkOverride) {
      framework = await prisma.assessmentFramework.findUnique({
        where: { id: frameworkOverride }
      });
    }

    if (!framework) {
      // Используем базовый Tech Interview фреймворк
      framework = await prisma.assessmentFramework.findFirst({
        where: { name: 'Tech Interview', isActive: true }
      });
    }

    if (!framework) {
      return NextResponse.json(
        { error: 'Не найден фреймворк для анализа' },
        { status: 400 }
      );
    }

    // Удаляем предыдущий assessment если существует
    if (interview.assessment) {
      console.log(`🗑️ [DEBUG] Removing previous assessment: ${interview.assessment.id}`);
      await prisma.assessment.delete({
        where: { id: interview.assessment.id }
      });
    }

    // Создаем новый Assessment
    console.log(`📝 [DEBUG] Creating new assessment for interview: ${id}`);
    const assessment = await prisma.assessment.create({
      data: {
        interviewId: id,
        assessorId: payload.userId,
        frameworkId: framework.id,
        overallScore: 0,
        scores: {},
        recommendation: 'PENDING',
        analysisStatus: 'IN_PROGRESS',
        strengths: [],
        weaknesses: [],
        redFlags: []
      }
    });

    try {
      // Анализируем видео
      const analysisResult = await analyzeInterviewVideo(
        interview,
        framework,
        customConfig
      );

      // Сохраняем результаты
      console.log(`💾 [DEBUG] Saving analysis results to assessment: ${assessment.id}`);
      const updatedAssessment = await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          scores: analysisResult.scores,
          overallScore: analysisResult.overallScore,
          recommendation: analysisResult.recommendation,
          feedback: analysisResult.feedback,
          strengths: analysisResult.strengths,
          weaknesses: analysisResult.weaknesses,
          redFlags: analysisResult.redFlags || [],
          confidence: analysisResult.confidence,
          processingTime: analysisResult.processingTime,
          analysisResults: analysisResult.rawResults,
          analysisStatus: 'COMPLETED',
          // Сохраняем совместимость
          technicalScore: analysisResult.scores.technical?.score || null,
          softSkillsScore: analysisResult.scores.soft_skills?.score || null,
          communicationScore: analysisResult.scores.communication?.score || null,
          notes: analysisResult.processingNotes
        }
      });
      
      console.log(`✅ [SUCCESS] Assessment completed successfully with overall score: ${analysisResult.overallScore}`);

      return NextResponse.json({
        message: 'Анализ видео завершен успешно',
        assessment: updatedAssessment,
        framework: {
          name: framework.name,
          version: framework.version
        },
        analysisMetadata: {
          processingTime: analysisResult.processingTime,
          confidence: analysisResult.confidence,
          criteriaAnalyzed: Object.keys(analysisResult.scores)
        }
      });

    } catch (analysisError) {
      console.error('Ошибка анализа видео:', analysisError);
      
      // Обновляем статус на FAILED
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { 
          analysisStatus: 'FAILED',
          notes: `Ошибка анализа: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`
        }
      });

      return NextResponse.json(
        { error: 'Ошибка при анализе видео', details: analysisError instanceof Error ? analysisError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Ошибка API analyze-video:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * Анализирует видео интервью через Gemini API
 */
async function analyzeInterviewVideo(
  interview: any,
  framework: any,
  customConfig?: any
): Promise<any> {
  const startTime = Date.now();

  // Инициализируем Gemini API
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  console.log(`🔑 [DEBUG] Google Cloud credentials path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  console.log(`🤖 [DEBUG] Gemini API key present: ${!!process.env.GEMINI_API_KEY}`);
  
  // Инициализируем Google Cloud Storage
  const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  
  console.log(`☁️ [DEBUG] Google Cloud Storage initialized`);

  const bucketName = 'ailang';
  const videoPath = `recordings/interview_${interview.id}.mp4`;

  try {
    console.log(`🔍 [DEBUG] Checking video file: ${videoPath} in bucket: ${bucketName}`);
    
    // Получаем видео файл из GCS
    const file = storage.bucket(bucketName).file(videoPath);
    const [exists] = await file.exists();
    
    console.log(`📁 [DEBUG] Video file exists: ${exists}`);
    
    if (!exists) {
      console.error(`❌ [ERROR] Video file not found: ${videoPath}`);
      throw new Error('Видеофайл не найден в хранилище');
    }

    // Получаем метаданные файла
    const [metadata] = await file.getMetadata();
    console.log(`📊 [DEBUG] Video file metadata:`, {
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated
    });

    // Получаем информацию о кандидате
    const candidateInfo: CandidateInfo = {
      name: `${interview.applicant.firstName} ${interview.applicant.lastName}`,
      skills: interview.applicant.resumes[0]?.skills || [],
      experience_years: interview.applicant.resumes[0]?.experience || undefined,
      resume_summary: interview.applicant.resumes[0]?.aiSummary || undefined
    };

    // Генерируем промпт
    const promptGenerator = new AssessmentPromptGenerator();
    const prompt = promptGenerator.generateMainPrompt({
      framework,
      job: interview.job,
      candidate: candidateInfo,
      videoMetadata: customConfig?.videoMetadata
    });

    console.log(`🎬 Начинаем анализ видео для интервью ${interview.id}`);
    console.log(`📋 Используемый фреймворк: ${framework.name} v${framework.version}`);

    // Конфигурация анализа видео
    const analysisConfig = framework.analysisConfig as any;
    const videoFps = customConfig?.video_fps || analysisConfig.video_fps || 1;

    // Проверяем размер файла перед загрузкой
    const fileSizeMB = parseInt(metadata.size?.toString() || '0') / (1024 * 1024);
    console.log(`📏 [DEBUG] Video file size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 20) {
      console.warn(`⚠️ [WARNING] Video file is large (${fileSizeMB.toFixed(2)} MB), this might cause issues`);
    }

    console.log(`⬇️ [DEBUG] Downloading video file from GCS...`);
    
    // Загружаем видео в Gemini через File API
    const [videoBuffer] = await file.download();
    
    console.log(`✅ [DEBUG] Video downloaded successfully, buffer size: ${videoBuffer.length} bytes`);
    
    // Создаем Parts для multimodal запроса
    const videoPart = {
      inlineData: {
        data: videoBuffer.toString('base64'),
        mimeType: metadata.contentType || 'video/mp4'
      },
      videoMetadata: {
        fps: videoFps
      }
    };
    
    console.log(`🎬 [DEBUG] Video part created with:`, {
      mimeType: metadata.contentType || 'video/mp4',
      fps: videoFps,
      base64Length: videoBuffer.toString('base64').length
    });

    const textPart = {
      text: prompt
    };

    // Отправляем запрос в Gemini
    console.log(`🤖 [DEBUG] Sending video to Gemini API...`);
    console.log(`📋 [DEBUG] Prompt length: ${textPart.text.length} characters`);
    
    let text: string;
    try {
      const result = await model.generateContent([videoPart, textPart]);
      const response = result.response;
      
      console.log(`📨 [DEBUG] Gemini response received`);
      console.log(`🔍 [DEBUG] Response candidates:`, response.candidates?.length || 0);
      
      text = response.text();
      console.log(`📝 [DEBUG] Response text length: ${text.length} characters`);
      console.log(`📄 [DEBUG] Response preview: ${text.substring(0, 200)}...`);

      console.log(`✅ [SUCCESS] Получен ответ от Gemini`);
    } catch (geminiError) {
      console.error(`❌ [ERROR] Gemini API error:`, geminiError);
      throw new Error(`Gemini API error: ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}`);
    }

    // Парсим JSON ответ
    let analysisData;
    try {
      console.log(`🔄 [DEBUG] Parsing Gemini response...`);
      
      // Извлекаем JSON из ответа (может быть wrapped в ```json)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`🎯 [DEBUG] Found JSON in response, length: ${jsonMatch[0].length}`);
        analysisData = JSON.parse(jsonMatch[0]);
        console.log(`✅ [DEBUG] JSON parsed successfully`);
        console.log(`📊 [DEBUG] Analysis data keys:`, Object.keys(analysisData));
      } else {
        console.error(`❌ [ERROR] No JSON found in Gemini response`);
        console.log(`📄 [DEBUG] Full response text:`, text);
        throw new Error('JSON не найден в ответе Gemini');
      }
    } catch (parseError) {
      console.error(`❌ [ERROR] JSON parsing failed:`, parseError);
      console.log(`📄 [DEBUG] Raw Gemini response:`, text);
      throw new Error('Не удалось распарсить ответ от Gemini API');
    }

    // Вычисляем общий балл если его нет
    if (!analysisData.overall_score && analysisData.criteria_scores) {
      const scores: Record<string, number> = {};
      for (const [criterion, data] of Object.entries(analysisData.criteria_scores)) {
        scores[criterion] = (data as any).score;
      }
      analysisData.overall_score = promptGenerator.calculateOverallScore(scores, framework.weights);
    }

    // Определяем рекомендацию если её нет
    if (!analysisData.recommendation) {
      analysisData.recommendation = promptGenerator.determineRecommendation(
        analysisData.overall_score,
        analysisData.confidence || 100
      );
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    return {
      scores: analysisData.criteria_scores || {},
      overallScore: analysisData.overall_score || 0,
      recommendation: analysisData.recommendation || 'REQUIRES_CLARIFICATION',
      feedback: analysisData.detailed_feedback || 'Анализ завершен',
      strengths: analysisData.strengths || [],
      weaknesses: analysisData.weaknesses || [],
      redFlags: analysisData.red_flags || [],
      confidence: analysisData.confidence || 100,
      processingTime,
      processingNotes: analysisData.processing_notes || '',
      rawResults: {
        gemini_response: text,
        parsed_data: analysisData,
        framework_used: framework.name,
        analysis_config: { fps: videoFps, ...customConfig }
      }
    };

  } catch (error) {
    console.error(`❌ [ERROR] Critical error in video analysis:`, error);
    
    if (error instanceof Error) {
      console.error(`🔍 [ERROR] Error message: ${error.message}`);
      console.error(`📚 [ERROR] Error stack:`, error.stack);
    }
    
    throw error;
  }
}

// GET /api/interviews/[id]/analyze-video - Получить статус анализа
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !isHR(payload.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: { interviewId: id },
      include: {
        framework: {
          select: { name: true, version: true }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json({
        status: 'NOT_STARTED',
        message: 'Анализ еще не запускался'
      });
    }

    return NextResponse.json({
      status: assessment.analysisStatus,
      confidence: assessment.confidence,
      processingTime: assessment.processingTime,
      framework: assessment.framework,
      lastUpdated: assessment.createdAt
    });

  } catch (error) {
    console.error('Ошибка получения статуса анализа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
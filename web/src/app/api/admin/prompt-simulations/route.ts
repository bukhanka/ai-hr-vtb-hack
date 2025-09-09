import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { constructInterviewPrompt, createSimulationPromptData } from '../../../../lib/interview-prompt-generator';

// Интерфейс для результатов симуляции
interface SimulationResult {
  dialogue: Array<{
    speaker: 'HR' | 'Candidate';
    message: string;
    timestamp: string;
    analysis?: string;
  }>;
  analysis: {
    overall_score: number;
    coverage_score: number;
    question_quality: number;
    adaptability: number;
    efficiency: number;
    recommendations: string[];
    red_flags: string[];
    best_moments: string[];
  };
}

// Генерация симуляции через Gemini
async function generateSimulation(
  customHrPrompt: string | null, 
  jobData: any, 
  resumeData: any
): Promise<SimulationResult> {
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Генерируем реальный промпт HR как в продакшене
  const promptData = createSimulationPromptData(jobData, resumeData);
  const realHrPrompt = constructInterviewPrompt(promptData);
  
  // Используем кастомный промпт если задан, иначе реальный
  const finalHrPrompt = customHrPrompt || realHrPrompt;
  
  // Формируем мега-промпт для генерации всей симуляции
  const simulationPrompt = `
Ты - симулятор интервью. Сгенерируй полную 40-минутную симуляцию интервью между AI HR и AI кандидатом.

ДАННЫЕ ВАКАНСИИ:
Название: ${jobData.title}
Описание: ${jobData.description}
Требования: ${jobData.requirements}
Необходимые навыки: ${jobData.skills.join(', ')}

ДАННЫЕ КАНДИДАТА (из резюме):
Имя: ${resumeData.applicant.firstName} ${resumeData.applicant.lastName}
Навыки: ${resumeData.skills.join(', ')}
Опыт: ${resumeData.experience || 'не указан'} лет
Образование: ${resumeData.education || 'не указано'}

HR ПРОМПТ${customHrPrompt ? ' (КАСТОМНЫЙ ДЛЯ ТЕСТИРОВАНИЯ)' : ' (РЕАЛЬНЫЙ ИЗ ПРОДАКШЕНА)'}:
${finalHrPrompt}

ЗАДАЧА:
1. Сгенерируй реалистичный диалог из 25-30 реплик (40 минут интервью)
2. HR задает вопросы согласно своему промпту
3. Кандидат отвечает на основе своего резюме, иногда не знает что-то, может нервничать
4. Проанализируй качество HR промпта и дай рекомендации

ТРЕБОВАНИЯ К ДИАЛОГУ:
- HR начинает с приветствия
- Реалистичные паузы и переходы между темами  
- Кандидат иногда задает встречные вопросы
- HR должен адаптироваться к ответам кандидата
- Естественные человеческие реакции

ВЕРНИ СТРОГО JSON:
{
  "dialogue": [
    {
      "speaker": "HR",
      "message": "текст реплики",
      "timestamp": "00:01",
      "analysis": "краткий анализ этой реплики HR"
    },
    {
      "speaker": "Candidate", 
      "message": "текст ответа",
      "timestamp": "00:02"
    }
  ],
  "analysis": {
    "overall_score": число 0-100,
    "coverage_score": число 0-100,
    "question_quality": число 0-100, 
    "adaptability": число 0-100,
    "efficiency": число 0-100,
    "recommendations": ["рекомендация 1", "рекомендация 2"],
    "red_flags": ["проблема 1", "проблема 2"], 
    "best_moments": ["лучший момент 1", "лучший момент 2"]
  }
}

Генерируй содержательный, реалистичный диалог!`;

  try {
    const result = await model.generateContent(simulationPrompt);
    const responseText = result.response.text();
    
    // Парсим JSON ответ
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanJson) as SimulationResult;
    
  } catch (error) {
    console.error('Ошибка генерации симуляции:', error);
    throw new Error('Не удалось сгенерировать симуляцию');
  }
}

// GET /api/admin/prompt-simulations - Получить все симуляции
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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для Admin' },
        { status: 403 }
      );
    }

    const simulations = await prisma.promptSimulation.findMany({
      include: {
        job: {
          select: { title: true, skills: true }
        },
        resume: {
          select: { 
            fileName: true,
            applicant: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        creator: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ simulations });

  } catch (error) {
    console.error('Ошибка получения симуляций:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/admin/prompt-simulations - Создать и запустить симуляцию
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

    const { name, jobId, resumeId, hrPrompt } = await request.json();

    if (!name || !jobId || !resumeId) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, jobId, resumeId' },
        { status: 400 }
      );
    }

    // Создаем запись симуляции
    const simulation = await prisma.promptSimulation.create({
      data: {
        name,
        jobId,
        resumeId,
        hrPrompt: hrPrompt || '', // Кастомный промпт или пустая строка
        creatorId: payload.userId,
        status: 'PENDING'
      }
    });

    // Получаем данные для симуляции
    const jobData = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        title: true,
        description: true,
        requirements: true,
        skills: true
      }
    });

    const resumeData = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        applicant: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!jobData || !resumeData) {
      await prisma.promptSimulation.update({
        where: { id: simulation.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.json(
        { error: 'Вакансия или резюме не найдены' },
        { status: 404 }
      );
    }

    try {
      // Генерируем симуляцию через Gemini (используем кастомный промпт если есть)
      const customPrompt = hrPrompt && hrPrompt.trim() ? hrPrompt : null;
      const result = await generateSimulation(customPrompt, jobData, resumeData);
      
      // Обновляем запись с результатами
      const updatedSimulation = await prisma.promptSimulation.update({
        where: { id: simulation.id },
        data: {
          status: 'COMPLETED',
          dialogue: result.dialogue,
          analysis: result.analysis,
          score: result.analysis.overall_score,
          completedAt: new Date()
        },
        include: {
          job: { select: { title: true } },
          resume: {
            include: {
              applicant: { select: { firstName: true, lastName: true } }
            }
          }
        }
      });

      return NextResponse.json({
        message: 'Симуляция создана и выполнена успешно',
        simulation: updatedSimulation
      });

    } catch (error) {
      // Обновляем статус на FAILED
      await prisma.promptSimulation.update({
        where: { id: simulation.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.json(
        { error: 'Ошибка при генерации симуляции: ' + (error as Error).message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Ошибка создания симуляции:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
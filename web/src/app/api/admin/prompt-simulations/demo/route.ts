import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

// POST /api/admin/prompt-simulations/demo - Создать демо симуляцию для тестирования
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

    // Ищем любую активную вакансию
    const job = await prisma.job.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Нет активных вакансий для создания демо' },
        { status: 400 }
      );
    }

    // Ищем любое резюме
    const resume = await prisma.resume.findFirst({
      include: {
        applicant: true
      }
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Нет резюме для создания демо' },
        { status: 400 }
      );
    }

    // Создаем демо симуляцию с мокованными результатами
    const simulation = await prisma.promptSimulation.create({
      data: {
        name: `ДЕМО: Тест промпта для ${job.title}`,
        jobId: job.id,
        resumeId: resume.id,
        hrPrompt: '', // Используем реальный промпт
        creatorId: payload.userId,
        status: 'COMPLETED',
        dialogue: [
          {
            "speaker": "HR",
            "message": "Добро пожаловать! Меня зовут Анна, я HR-специалист ВТБ. Сегодня мы проведем интервью на позицию " + job.title + ". Расскажите, пожалуйста, о себе и своем опыте.",
            "timestamp": "00:01",
            "analysis": "Хорошее профессиональное приветствие, четко обозначена позиция"
          },
          {
            "speaker": "Candidate", 
            "message": `Здравствуйте, Анна! Меня зовут ${resume.applicant.firstName}. У меня ${resume.experience || 2} года опыта в разработке. Работал с технологиями: ${resume.skills.slice(0, 3).join(', ')}. Заинтересован в работе в ВТБ, так как хочу развиваться в финтехе.`,
            "timestamp": "00:02"
          },
          {
            "speaker": "HR",
            "message": "Отлично! Расскажите подробнее о ваших проектах с " + (resume.skills[0] || 'основными технологиями') + ". Какие задачи вы решали?",
            "timestamp": "00:03",
            "analysis": "Хорошее углубление в технические детали, адаптация к навыкам кандидата"
          },
          {
            "speaker": "Candidate",
            "message": "В последнем проекте разрабатывал веб-приложение для e-commerce. Реализовывал систему авторизации, интеграцию с платежными системами, оптимизировал производительность. Команда была небольшая, поэтому приходилось работать и с фронтендом, и с бэкендом.",
            "timestamp": "00:04"
          },
          {
            "speaker": "HR", 
            "message": "Интересно! А с какими трудностями сталкивались при интеграции платежных систем? Как их решали?",
            "timestamp": "00:05",
            "analysis": "Отличный уточняющий вопрос, проверяет глубину понимания"
          }
        ],
        analysis: {
          overall_score: 78,
          coverage_score: 85,
          question_quality: 80,
          adaptability: 75,
          efficiency: 70,
          recommendations: [
            "Добавить больше технических вопросов по архитектуре",
            "Углубиться в опыт работы в команде",
            "Задать вопросы о мотивации и карьерных планах"
          ],
          red_flags: [
            "Недостаточно вопросов о soft skills",
            "Не проверили знание специфики финтеха"
          ],
          best_moments: [
            "Хорошая адаптация к навыкам кандидата",
            "Качественные уточняющие вопросы",
            "Профессиональное ведение интервью"
          ]
        },
        score: 78,
        completedAt: new Date()
      },
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
      }
    });

    return NextResponse.json({
      message: 'Демо симуляция создана успешно',
      simulation
    });

  } catch (error) {
    console.error('Ошибка создания демо симуляции:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
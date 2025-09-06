import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../../lib/auth';
import { InterviewStatus } from '../../../../../generated/prisma';

// POST /api/interviews/[id]/complete - Завершение интервью с мок-результатами
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Только соискатели могут завершать свое интервью
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Только соискатели могут завершать интервью' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Находим интервью и проверяем права доступа
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            skills: true,
          }
        },
        assessment: true,
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Интервью не найдено' },
        { status: 404 }
      );
    }

    if (interview.applicantId !== payload.userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Проверяем статус интервью
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Интервью не началось или уже завершено' },
        { status: 400 }
      );
    }

    if (interview.assessment) {
      return NextResponse.json(
        { error: 'Интервью уже завершено' },
        { status: 400 }
      );
    }

    const endTime = new Date();

    // Создаем мок-оценку с рандомными но реалистичными данными
    const mockStrengths = [
      'Хорошие технические знания',
      'Четкая коммуникация',
      'Системное мышление',
      'Опыт работы в команде',
      'Быстрое обучение'
    ];

    const mockWeaknesses = [
      'Нужно больше опыта с современными фреймворками',
      'Стоит улучшить знания архитектуры',
      'Требуется развитие лидерских навыков',
      'Нужно глубже изучить DevOps практики'
    ];

    // Генерируем случайный но реалистичный результат
    const overallScore = Math.floor(Math.random() * 40) + 60; // 60-99%
    const recommendation = overallScore >= 80 ? 'HIRE' : overallScore >= 65 ? 'REQUIRES_CLARIFICATION' : 'REJECT';
    
    const selectedStrengths = mockStrengths.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
    const selectedWeaknesses = mockWeaknesses.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1);

    // Обновляем интервью и создаем оценку в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Завершаем интервью
      const completedInterview = await tx.interview.update({
        where: { id },
        data: {
          status: InterviewStatus.COMPLETED,
          endedAt: endTime,
          transcript: 'Мок-интервью: основные вопросы о технических навыках, опыте работы и мотивации.',
          aiNotes: `Кандидат продемонстрировал ${overallScore >= 80 ? 'высокий' : overallScore >= 65 ? 'средний' : 'базовый'} уровень подготовки.`,
        }
      });

      // Создаем мок-оценку
      const assessment = await tx.assessment.create({
        data: {
          interviewId: id,
          assessorId: payload.userId, // В реальности это был бы AI или HR
          overallScore: overallScore,
          technicalScore: Math.floor(Math.random() * 30) + 70,
          softSkillsScore: Math.floor(Math.random() * 25) + 75,
          communicationScore: Math.floor(Math.random() * 20) + 80,
          recommendation: recommendation,
          feedback: recommendation === 'HIRE' 
            ? `Отличный кандидат! Показал сильные технические навыки и хорошую коммуникацию. Общий балл: ${overallScore}%. Рекомендую к найму.`
            : recommendation === 'REQUIRES_CLARIFICATION'
            ? `Многообещающий кандидат с общим баллом ${overallScore}%. Есть потенциал, но требуется дополнительное собеседование по некоторым техническим вопросам.`
            : `Кандидат показал базовый уровень подготовки (${overallScore}%). Необходимо дополнительное обучение и опыт работы.`,
          strengths: selectedStrengths,
          weaknesses: selectedWeaknesses,
          notes: `AI-собеседование длилось ${Math.floor((endTime.getTime() - new Date(interview.startedAt!).getTime()) / (1000 * 60))} минут. Проанализированы технические навыки, соответствие позиции и культурное соответствие.`,
        }
      });

      return { interview: completedInterview, assessment };
    });

    return NextResponse.json({
      message: 'Интервью успешно завершено! Результаты готовы.',
      interview: {
        id: result.interview.id,
        status: result.interview.status,
        endedAt: result.interview.endedAt,
      },
      assessment: {
        id: result.assessment.id,
        overallScore: result.assessment.overallScore,
        recommendation: result.assessment.recommendation,
        feedback: result.assessment.feedback,
      }
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    return NextResponse.json(
      { error: 'Ошибка при завершении интервью' },
      { status: 500 }
    );
  }
}
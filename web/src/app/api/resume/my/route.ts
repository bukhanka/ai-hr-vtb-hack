import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getTokenFromRequest, verifyToken, isApplicant } from '../../../../lib/auth';

// GET /api/resume/my - Получение всех резюме пользователя
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

    // Только соискатели могут просматривать свои резюме
    if (!isApplicant(payload.role)) {
      return NextResponse.json(
        { error: 'Просматривать резюме могут только соискатели' },
        { status: 403 }
      );
    }

    // Получаем все резюме пользователя
    const resumes = await prisma.resume.findMany({
      where: {
        applicantId: payload.userId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
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
      resumes: resumes,
    });
  } catch (error) {
    console.error('My resumes fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении резюме' },
      { status: 500 }
    );
  }
}
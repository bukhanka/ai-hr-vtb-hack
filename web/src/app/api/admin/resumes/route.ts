import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// GET /api/admin/resumes - Получить все резюме для выбора в симуляциях
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

    const resumes = await prisma.resume.findMany({
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({
      resumes: resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        skills: resume.skills,
        experience: resume.experience,
        applicant: resume.applicant,
        uploadedAt: resume.uploadedAt
      }))
    });

  } catch (error) {
    console.error('Ошибка получения резюме:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
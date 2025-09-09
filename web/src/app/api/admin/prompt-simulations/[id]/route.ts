import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

// GET /api/admin/prompt-simulations/[id] - Получить детали симуляции
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const simulation = await prisma.promptSimulation.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            description: true,
            requirements: true,
            skills: true
          }
        },
        resume: {
          include: {
            applicant: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        creator: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!simulation) {
      return NextResponse.json(
        { error: 'Симуляция не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({ simulation });

  } catch (error) {
    console.error('Ошибка получения симуляции:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/prompt-simulations/[id] - Удалить симуляцию
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const simulation = await prisma.promptSimulation.findUnique({
      where: { id }
    });

    if (!simulation) {
      return NextResponse.json(
        { error: 'Симуляция не найдена' },
        { status: 404 }
      );
    }

    await prisma.promptSimulation.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Симуляция удалена успешно'
    });

  } catch (error) {
    console.error('Ошибка удаления симуляции:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// GET /api/videos/[id] - Прокси для получения видеозаписи интервью через наш сервер
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию (в заголовке или в query параметрах)
    let token = getTokenFromRequest(request);
    
    // Если токена нет в заголовке, проверяем query параметры
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('auth');
    }
    
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

    // Проверяем существование интервью и права доступа
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          }
        }
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Интервью не найдено' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к интервью (создатель вакансии или админ)
    if (payload.role !== 'ADMIN' && payload.userId !== interview.job.creatorId) {
      return NextResponse.json(
        { error: 'Доступ к этому интервью запрещен' },
        { status: 403 }
      );
    }

    // Проверяем статус интервью
    if (interview.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Видеозапись еще не доступна' },
        { status: 404 }
      );
    }

    // Формируем URL видеозаписи из Google Cloud Storage
    const bucketName = 'ailang';
    const videoPath = `recordings/interview_${id}.mp4`;
    const videoUrl = `https://storage.googleapis.com/${bucketName}/${videoPath}`;

    try {
      // Выполняем запрос к Google Cloud Storage
      const videoResponse = await fetch(videoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'video/mp4',
        },
      });

      if (!videoResponse.ok) {
        console.error('Failed to fetch video from GCS:', videoResponse.status);
        return NextResponse.json(
          { error: 'Видеозапись не найдена или временно недоступна' },
          { status: 404 }
        );
      }

      // Получаем видео как stream
      const videoStream = videoResponse.body;
      const contentLength = videoResponse.headers.get('content-length');
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

      // Настройки для поддержки range requests (для удобной навигации по видео)
      const range = request.headers.get('range');
      
      if (range && contentLength) {
        const start = Number(range.replace(/\D/g, ''));
        const end = Number(contentLength) - 1;
        const chunksize = (end - start) + 1;

        return new NextResponse(videoStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${contentLength}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
          },
        });
      }

      // Возвращаем полное видео
      return new NextResponse(videoStream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': contentLength || '',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
          'Accept-Ranges': 'bytes',
        },
      });

    } catch (fetchError) {
      console.error('Error fetching video from GCS:', fetchError);
      return NextResponse.json(
        { error: 'Ошибка при загрузке видеозаписи' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении видеозаписи' },
      { status: 500 }
    );
  }
}

// OPTIONS для поддержки CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
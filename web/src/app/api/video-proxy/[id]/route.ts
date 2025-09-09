import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, isHR } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { Storage } from '@google-cloud/storage';

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

    // Инициализируем Google Cloud Storage с аутентификацией
    let storage: Storage;
    try {
      // Пытаемся получить credentials из переменной окружения или файла
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credentialsPath) {
        storage = new Storage({
          keyFilename: credentialsPath,
        });
      } else {
        // Fallback на дефолтные credentials
        storage = new Storage();
      }
    } catch (storageError) {
      console.error('Failed to initialize Google Cloud Storage:', storageError);
      return NextResponse.json(
        { error: 'Ошибка конфигурации хранилища' },
        { status: 500 }
      );
    }

    const bucketName = 'ailang';
    const videoPath = `recordings/interview_${id}.mp4`;

    try {
      // Получаем файл из Google Cloud Storage с аутентификацией
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(videoPath);

      // Проверяем существование файла
      const [exists] = await file.exists();
      if (!exists) {
        console.error(`Video file not found: ${videoPath}`);
        return NextResponse.json(
          { error: 'Видеозапись не найдена' },
          { status: 404 }
        );
      }

      // Получаем метаданные файла
      const [metadata] = await file.getMetadata();
      const contentLength = metadata.size;
      const contentType = metadata.contentType || 'video/mp4';

      // Создаем readable stream
      const videoStream = file.createReadStream();

      // Настройки для поддержки range requests (для удобной навигации по видео)
      const range = request.headers.get('range');
      
      if (range && contentLength) {
        // Парсим range header (например, "bytes=0-1024")
        const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : Number(contentLength) - 1;
          const chunksize = (end - start) + 1;

          // Создаем stream с указанным диапазоном
          const rangeStream = file.createReadStream({ start, end });

          return new NextResponse(rangeStream as any, {
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
      }

      // Возвращаем полное видео
      return new NextResponse(videoStream as any, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': contentLength?.toString() || '',
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
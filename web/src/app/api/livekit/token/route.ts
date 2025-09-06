import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Получен запрос на создание токена');
    const { roomName, participantName } = await request.json();
    console.log('API: roomName =', roomName, 'participantName =', participantName);

    if (!roomName || !participantName) {
      console.log('API: Ошибка - отсутствуют обязательные параметры');
      return NextResponse.json(
        { error: 'Требуются roomName и participantName' },
        { status: 400 }
      );
    }

    // Проверяем переменные окружения
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    console.log('API: Переменные окружения:');
    console.log('LIVEKIT_API_KEY:', apiKey ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    console.log('LIVEKIT_API_SECRET:', apiSecret ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    console.log('LIVEKIT_URL:', wsUrl);

    if (!apiKey || !apiSecret) {
      console.log('API: Ошибка - отсутствуют переменные окружения');
      return NextResponse.json(
        { error: 'LiveKit не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      );
    }

    // Создаем токен доступа
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${participantName}_${randomBytes(4).toString('hex')}`,
      name: participantName,
    });

    // Настраиваем права доступа
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Время жизни токена - 1 час
    at.ttl = '1h';

    const token = await at.toJwt();

    console.log('API: Токен создан успешно');
    return NextResponse.json({
      token,
      wsUrl: wsUrl || 'wss://localhost:7880',
      identity: at.identity,
    });
  } catch (error) {
    console.error('Ошибка создания LiveKit токена:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
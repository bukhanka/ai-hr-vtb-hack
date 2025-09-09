import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './src/lib/auth';

// Принудительно используем Node.js Runtime вместо Edge Runtime
export const runtime = 'nodejs';

// Определяем защищенные маршруты
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/interviews',
  '/jobs',
  '/api/jobs',
  '/api/interviews',
  '/api/users',
];

// Маршруты только для HR
const hrOnlyPaths = [
  '/api/jobs',
  '/jobs',
  '/api/interviews',
  '/interviews',
];

// Маршруты только для админа
const adminOnlyPaths = [
  '/api/users',
  '/admin',
];

// Публичные маршруты (не требуют авторизации)
const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/register',
  '/login',
  '/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Обрабатываем CORS для всех запросов
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Пропускаем статические файлы и API маршруты Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // Проверяем является ли маршрут публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    return response;
  }

  // Проверяем является ли маршрут защищенным
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // Получаем токен из запроса
  const token = getTokenFromRequest(request);

  if (!token) {
    // Если это API запрос, возвращаем JSON ошибку
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }
    // Для обычных страниц перенаправляем на логин
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Верифицируем токен
  const payload = await verifyToken(token);
  if (!payload) {
    // Если это API запрос, возвращаем JSON ошибку
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }
    // Для обычных страниц перенаправляем на логин
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Проверяем права доступа для HR-маршрутов
  const isHrOnlyPath = hrOnlyPaths.some(path => pathname.startsWith(path));
  if (isHrOnlyPath && payload.role !== 'HR' && payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Проверяем права доступа для админ-маршрутов
  const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path));
  if (isAdminOnlyPath && payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Добавляем информацию о пользователе в заголовки запроса
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  // Кодируем имя в base64 для избежания проблем с кодировкой
  const userName = Buffer.from(`${payload.firstName} ${payload.lastName}`, 'utf8').toString('base64');
  requestHeaders.set('x-user-name', userName);

  // Создаем ответ с CORS заголовками
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Добавляем CORS заголовки для всех ответов
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
  response.headers.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './src/lib/auth';

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

  // Пропускаем статические файлы и API маршруты Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Проверяем является ли маршрут публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Проверяем является ли маршрут защищенным
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
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
  requestHeaders.set('x-user-name', `${payload.firstName} ${payload.lastName}`);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
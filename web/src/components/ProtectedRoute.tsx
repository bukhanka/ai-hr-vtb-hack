'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '../generated/prisma';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon } from './Icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Если пользователь не авторизован
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Если указаны разрешенные роли и пользователь не имеет нужной роли
      if (allowedRoles && !hasRole(allowedRoles)) {
        router.push('/dashboard'); // Редирект на дашборд если нет прав
        return;
      }
    }
  }, [user, loading, allowedRoles, hasRole, router, redirectTo]);

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-vtb-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован или не имеет прав - показываем null
  // (редирект произойдет в useEffect)
  if (!user || (allowedRoles && !hasRole(allowedRoles))) {
    return null;
  }

  return <>{children}</>;
}
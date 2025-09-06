'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '../generated/prisma';
import { hasRole, isAdmin, isHR, isApplicant } from '../lib/auth';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasRole: (requiredRoles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isApplicant: () => boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth-token');
      
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API возвращает { user }, извлекаем пользователя
        setUser(data.user);
      } else {
        // Токен недействителен
        localStorage.removeItem('auth-token');
        setUser(null);
        if (response.status === 401) {
          setError('Сессия истекла');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError('Ошибка загрузки профиля');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/');
    }
  };

  const checkRole = (requiredRoles: UserRole[]) => {
    return user ? hasRole(user.role, requiredRoles) : false;
  };

  const checkIsAdmin = () => {
    return user ? isAdmin(user.role) : false;
  };

  const checkIsHR = () => {
    return user ? isHR(user.role) : false;
  };

  const checkIsApplicant = () => {
    return user ? isApplicant(user.role) : false;
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    hasRole: checkRole,
    isAdmin: checkIsAdmin,
    isHR: checkIsHR,
    isApplicant: checkIsApplicant,
    logout,
    refetch: fetchUser,
  };
}
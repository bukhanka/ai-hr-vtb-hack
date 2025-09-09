'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../../../components/ThemeToggle';
import Link from 'next/link';

interface AssessmentFramework {
  id: string;
  name: string;
  version: string;
  description?: string;
  isActive: boolean;
  scoringMethod: string;
  criteria: any;
  weights: any;
  analysisConfig: any;
  redFlagsConfig?: any;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  usage: {
    jobsCount: number;
    assessmentsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AssessmentFrameworksPage() {
  const [frameworks, setFrameworks] = useState<AssessmentFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Загрузка пользователя
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }

        const userData = await response.json();
        if (userData.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setUser(userData.user);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        localStorage.removeItem('auth-token');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Загрузка фреймворков
  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/admin/assessment-frameworks', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке фреймворков');
        }

        const data = await response.json();
        setFrameworks(data.frameworks);
      } catch (error) {
        console.error('Ошибка загрузки фреймворков:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке фреймворков');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFrameworks();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('auth-token');
      router.push('/');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка фреймворков...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-vtb-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-vtb-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-vtb-text mb-2">Ошибка</h1>
          <p className="text-vtb-text-secondary mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
          >
            Вернуться в панель
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-vtb-surface border-b border-border backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
                </svg>
                <span>В панель</span>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-vtb-text">
                  Assessment Frameworks
                </h1>
                <p className="text-xs text-vtb-text-secondary">Управление методологиями оценки</p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              {user && (
                <>
                  <span className="text-sm text-vtb-text-secondary">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Выйти
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Frameworks List */}
        {frameworks.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
              <svg className="w-10 h-10 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-vtb-text mb-2">
              Нет фреймворков
            </h3>
            <p className="text-vtb-text-secondary">
              Пока не создано ни одного фреймворка оценки
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {frameworks.map((framework) => (
              <div key={framework.id} className="bg-vtb-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-vtb-text">
                        {framework.name}
                      </h3>
                      <span className="px-2 py-1 bg-vtb-accent/10 text-vtb-accent text-xs font-medium rounded">
                        v{framework.version}
                      </span>
                      {framework.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Активен
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Неактивен
                        </span>
                      )}
                    </div>
                    {framework.description && (
                      <p className="text-vtb-text-secondary mb-2">{framework.description}</p>
                    )}
                    <div className="text-sm text-vtb-text-secondary">
                      <p>Создан: {framework.creator.firstName} {framework.creator.lastName}</p>
                      <p>Дата: {formatDate(framework.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{framework.usage.jobsCount}</p>
                        <p className="text-xs text-blue-600">Вакансий</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{framework.usage.assessmentsCount}</p>
                        <p className="text-xs text-green-600">Оценок</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Критерии */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-vtb-text mb-3">Критерии оценки:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(framework.weights as Record<string, number>).map(([criterion, weight]) => (
                      <div key={criterion} className="text-center p-3 bg-vtb-surface-secondary rounded-lg">
                        <p className="text-sm font-medium text-vtb-text capitalize">
                          {criterion.replace('_', ' ')}
                        </p>
                        <p className="text-lg font-bold text-vtb-accent">{weight}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Метод подсчета */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-vtb-text-secondary">
                    <span className="font-medium">Метод:</span> {framework.scoringMethod}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs bg-vtb-primary text-white rounded hover:bg-vtb-primary/90 transition-colors">
                      Редактировать
                    </button>
                    <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                      Дублировать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
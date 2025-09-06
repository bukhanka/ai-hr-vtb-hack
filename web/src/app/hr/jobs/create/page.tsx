'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '../../../../components/JobForm';
import { BuildingIcon, PlusIcon } from '../../../../components/Icons';
import { ThemeToggle } from '../../../../components/ThemeToggle';
import Link from 'next/link';
import { JobStatus } from '../../../../generated/prisma';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  experience?: string;
  salary?: string;
  status: JobStatus;
}

export default function CreateJobPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }

        const data = await response.json();
        if (data.user.role !== 'HR' && data.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        localStorage.removeItem('auth-token');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (formData: JobFormData) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании вакансии');
      }

      setSuccess(true);
      
      // Перенаправляем через 2 секунды
      setTimeout(() => {
        router.push('/hr/jobs');
      }, 2000);
    } catch (error) {
      console.error('Ошибка создания вакансии:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании вакансии');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-vtb-text mb-2">Вакансия создана!</h1>
          <p className="text-vtb-text-secondary mb-6">
            Вакансия успешно создана. Перенаправляем вас к списку вакансий...
          </p>
          <div className="animate-pulse h-2 bg-vtb-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-vtb-primary rounded-full w-full animate-pulse"></div>
          </div>
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
                href="/hr/jobs"
                className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
                </svg>
                <span>К вакансиям</span>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <div className="h-8 w-8 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-vtb-text">
                  Создание вакансии
                </h1>
                <p className="text-xs text-vtb-text-secondary">HR-панель ВТБ</p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              <span className="text-sm text-vtb-text-secondary">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                Профиль
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Выйти
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <PlusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-vtb-text mb-4">
            Создание новой вакансии
          </h1>
          <p className="text-vtb-text-secondary max-w-2xl mx-auto">
            Заполните информацию о вакансии, чтобы начать поиск подходящих кандидатов с помощью AI-аватара
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
          {error && (
            <div className="bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-vtb-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 14.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-vtb-error font-medium">Ошибка при создании вакансии</h3>
                  <p className="text-vtb-error text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <JobForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-br from-vtb-primary/5 to-vtb-accent/5 rounded-2xl p-6 border border-vtb-primary/20">
          <h3 className="text-lg font-semibold text-vtb-text mb-4">💡 Советы по созданию эффективной вакансии:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-vtb-text-secondary">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Используйте четкие и понятные названия позиций</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Подробно опишите основные задачи и ответственности</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Укажите конкретные технические требования</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Добавьте актуальные технологии и навыки</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Честно указывайте зарплатную вилку</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-vtb-primary font-semibold">•</span>
                <span>Сохраните как черновик для проверки</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
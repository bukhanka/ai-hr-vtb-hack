'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { BuildingIcon, ClockIcon, UserIcon, SparklesIcon } from '../../../components/Icons';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  salary?: string | null;
  experience?: string | null;
  status: string;
  createdAt: string;
  creatorName?: string;
}

export default function JobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

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
        setUser(data.user);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        localStorage.removeItem('auth-token');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Загрузка вакансии
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/jobs/${jobId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Вакансия не найдена');
          }
          throw new Error('Ошибка при загрузке вакансии');
        }

        const data = await response.json();
        setJob(data.job);
      } catch (error) {
        console.error('Ошибка загрузки вакансии:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке вакансии');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleApply = async () => {
    if (!user || user.role !== 'APPLICANT') {
      setError('Откликаться на вакансии могут только соискатели');
      return;
    }

    try {
      setApplying(true);
      setError('');
      
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отклике на вакансию');
      }

      setApplicationSuccess(true);
    } catch (error) {
      console.error('Ошибка отклика:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при отклике');
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка вакансии...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
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
            href="/jobs"
            className="inline-flex px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
          >
            Вернуться к вакансиям
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
                href="/jobs"
                className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
                </svg>
                <span>К вакансиям</span>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <div className="h-8 w-8 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center">
                <BuildingIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-vtb-text-secondary">ВТБ Карьера</span>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              {user && (
                <>
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
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {job && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Job Header */}
          <div className="bg-vtb-surface rounded-2xl p-8 mb-8 border border-border shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-vtb-text mb-4">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-vtb-text-secondary">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Опубликована {formatDate(job.createdAt)}
                  </div>
                  {job.creatorName && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {job.creatorName}
                    </div>
                  )}
                  {job.experience && (
                    <div className="flex items-center gap-1">
                      <span>🎯</span>
                      {job.experience}
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      {job.salary}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <BuildingIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-vtb-text mb-3">Ключевые навыки:</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-vtb-accent/10 text-vtb-accent rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            {user?.role === 'APPLICANT' && (
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="text-sm text-vtb-text-secondary">
                  {applicationSuccess ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Отклик отправлен! Ожидайте приглашения на AI-собеседование.</span>
                    </div>
                  ) : (
                    'Готовы подать заявку на эту позицию?'
                  )}
                </div>
                {!applicationSuccess && (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="px-8 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtb-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Отправка...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        Откликнуться
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-4">
                <p className="text-vtb-error text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Job Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-vtb-surface rounded-2xl p-8 border border-border">
                <h2 className="text-2xl font-bold text-vtb-text mb-6">Описание вакансии</h2>
                <div className="prose prose-vtb max-w-none">
                  <p className="text-vtb-text leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-vtb-surface rounded-2xl p-8 border border-border">
                <h2 className="text-2xl font-bold text-vtb-text mb-6">Требования</h2>
                <div className="prose prose-vtb max-w-none">
                  <p className="text-vtb-text leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Info */}
              <div className="bg-vtb-surface rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-vtb-text mb-4">Информация о вакансии</h3>
                <div className="space-y-4 text-sm">
                  {job.experience && (
                    <div>
                      <span className="text-vtb-text-secondary">Опыт работы:</span>
                      <div className="font-medium text-vtb-text">{job.experience}</div>
                    </div>
                  )}
                  {job.salary && (
                    <div>
                      <span className="text-vtb-text-secondary">Зарплата:</span>
                      <div className="font-medium text-vtb-text">{job.salary}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-vtb-text-secondary">Дата публикации:</span>
                    <div className="font-medium text-vtb-text">{formatDate(job.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-vtb-primary/5 to-vtb-accent/5 rounded-2xl p-6 border border-vtb-primary/20">
                <h3 className="text-lg font-semibold text-vtb-text mb-4">Что дальше?</h3>
                <div className="space-y-3 text-sm text-vtb-text-secondary">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-vtb-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-vtb-primary font-semibold text-xs">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-vtb-text">Подача заявки</div>
                      <div>Нажмите "Откликнуться" чтобы подать заявку</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-vtb-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-vtb-primary font-semibold text-xs">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-vtb-text">AI-собеседование</div>
                      <div>Пройдите инновационное интервью с HR-аватаром</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-vtb-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-vtb-primary font-semibold text-xs">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-vtb-text">Получение результата</div>
                      <div>Получите обратную связь и решение HR</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
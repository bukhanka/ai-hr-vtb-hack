'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BuildingIcon, ClockIcon, CalendarIcon } from '../../components/Icons';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    salary?: string;
    status: string;
  };
  assessment?: {
    id: string;
    overallScore: number;
    recommendation: string;
    feedback?: string;
    strengths: string[];
    weaknesses: string[];
    createdAt: string;
  };
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }

        const data = await response.json();
        if (data.user.role !== 'APPLICANT') {
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

  // Загрузка заявок
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/my-applications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке заявок');
        }

        const data = await response.json();
        setApplications(data.applications);
      } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        setError('Не удалось загрузить заявки');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-vtb-text mb-4">
            Мои заявки
          </h1>
          <p className="text-vtb-text-secondary max-w-2xl mx-auto">
            Отслеживайте статус ваших откликов и результаты AI-собеседований
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-6 mb-8">
            <p className="text-vtb-error font-medium">{error}</p>
          </div>
        )}

        {/* Applications List */}
        {!error && (
          <>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                  <CalendarIcon className="w-10 h-10 text-vtb-text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-vtb-text mb-2">
                  Пока нет заявок
                </h3>
                <p className="text-vtb-text-secondary mb-4">
                  Начните поиск подходящих вакансий и подавайте заявки
                </p>
                <Link
                  href="/jobs"
                  className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
                >
                  Просмотреть вакансии
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-vtb-text mb-2">
                              {application.job.title}
                            </h3>
                            <p className="text-vtb-text-secondary text-sm mb-3 line-clamp-2">
                              {application.job.description}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {application.job.skills.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-vtb-primary/10 text-vtb-primary text-sm rounded-full font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {application.job.skills.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                              +{application.job.skills.length - 4} еще
                            </span>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-vtb-text-secondary">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>Подано: {formatDate(application.createdAt)}</span>
                          </div>
                          {application.scheduledAt && (
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Запланировано: {formatDate(application.scheduledAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/jobs/${application.job.id}`}
                        className="px-4 py-2 bg-vtb-surface-secondary border border-border text-vtb-text rounded-lg hover:bg-muted transition-colors"
                      >
                        Подробнее о вакансии
                      </Link>
                      
                      <Link
                        href={`/interview/${application.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-lg hover:shadow-lg transition-all inline-block text-center"
                      >
                        {application.status === 'SCHEDULED' || !application.endedAt ? 'Пройти интервью' : 'Пройти интервью повторно'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
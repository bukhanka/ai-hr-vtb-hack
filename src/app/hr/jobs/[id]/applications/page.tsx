'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeToggle } from '../../../../../components/ThemeToggle';
import { InterviewStatus } from '../../../../../components/InterviewStatus';
import { BuildingIcon, UserIcon, BarChartIcon } from '../../../../../components/Icons';
import Link from 'next/link';

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  registeredAt: string;
}

interface Assessment {
  id: string;
  overallScore: number;
  technicalScore?: number | null;
  softSkillsScore?: number | null;
  communicationScore?: number | null;
  recommendation: string;
  feedback?: string | null;
  strengths: string[];
  weaknesses: string[];
  notes?: string | null;
  createdAt: string;
}

interface Application {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: Applicant;
  assessment?: Assessment | null;
}

interface JobData {
  id: string;
  title: string;
}

interface Statistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  averageScore: number;
  topCandidates: number;
}

interface ApplicationsData {
  job: JobData;
  statistics: Statistics;
  applications: Application[];
  groupedApplications: {
    pending: Application[];
    inProgress: Application[];
    completed: Application[];
    cancelled: Application[];
  };
}

export default function JobApplicationsPage() {
  const [data, setData] = useState<ApplicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
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

        const userData = await response.json();
        if (userData.user.role !== 'HR' && userData.user.role !== 'ADMIN') {
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

  // Загрузка откликов
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/hr/jobs/${jobId}/applications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Вакансия не найдена');
          }
          if (response.status === 403) {
            throw new Error('У вас нет доступа к этой вакансии');
          }
          throw new Error('Ошибка при загрузке откликов');
        }

        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Ошибка загрузки откликов:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке откликов');
      } finally {
        setLoading(false);
      }
    };

    if (user && jobId) {
      fetchApplications();
    }
  }, [user, jobId]);

  const getDisplayApplications = () => {
    if (!data) return [];
    
    let applications: Application[] = [];
    
    switch (activeTab) {
      case 'pending':
        applications = data.groupedApplications.pending;
        break;
      case 'inProgress':
        applications = data.groupedApplications.inProgress;
        break;
      case 'completed':
        applications = data.groupedApplications.completed;
        break;
      case 'cancelled':
        applications = data.groupedApplications.cancelled;
        break;
      default:
        applications = data.applications;
    }

    // Сортировка
    return [...applications].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = a.assessment?.overallScore || 0;
          const scoreB = b.assessment?.overallScore || 0;
          return scoreB - scoreA; // По убыванию
        case 'name':
          return a.applicant.name.localeCompare(b.applicant.name);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Новые сначала
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return { label: 'Нанять', color: 'bg-green-100 text-green-800' };
      case 'REJECT':
        return { label: 'Отклонить', color: 'bg-red-100 text-red-800' };
      case 'REQUIRES_CLARIFICATION':
        return { label: 'Требует уточнения', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: recommendation, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
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
          <p className="text-vtb-text-secondary">Загрузка откликов...</p>
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
            href="/hr/jobs"
            className="inline-flex px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
          >
            Вернуться к вакансиям
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const displayApplications = getDisplayApplications();

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
                <BuildingIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-vtb-text">
                  {data.job.title}
                </h1>
                <p className="text-xs text-vtb-text-secondary">Отклики кандидатов</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-vtb-text">{data.statistics.total}</p>
              <p className="text-sm text-vtb-text-secondary">Всего</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.statistics.pending}</p>
              <p className="text-sm text-vtb-text-secondary">Ожидают</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{data.statistics.inProgress}</p>
              <p className="text-sm text-vtb-text-secondary">В процессе</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.statistics.completed}</p>
              <p className="text-sm text-vtb-text-secondary">Завершено</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-vtb-accent">{data.statistics.averageScore.toFixed(1)}</p>
              <p className="text-sm text-vtb-text-secondary">Ср. балл</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.statistics.topCandidates}</p>
              <p className="text-sm text-vtb-text-secondary">Топ (80%+)</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Все', count: data.statistics.total },
              { key: 'pending', label: 'Ожидают', count: data.statistics.pending },
              { key: 'inProgress', label: 'В процессе', count: data.statistics.inProgress },
              { key: 'completed', label: 'Завершено', count: data.statistics.completed },
              { key: 'cancelled', label: 'Отменено', count: data.statistics.cancelled },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-vtb-primary text-white shadow-md'
                    : 'bg-vtb-surface text-vtb-text hover:bg-muted border border-border'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-vtb-text-secondary">Сортировать:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-lg bg-vtb-surface text-vtb-text text-sm focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary"
            >
              <option value="date">По дате</option>
              <option value="score">По баллу</option>
              <option value="name">По имени</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {displayApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
              <UserIcon className="w-10 h-10 text-vtb-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-vtb-text mb-2">
              Нет откликов
            </h3>
            <p className="text-vtb-text-secondary">
              {activeTab === 'all' 
                ? 'На эту вакансию пока никто не откликнулся'
                : `Нет откликов с выбранным статусом`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayApplications.map((application) => {
              const rec = application.assessment ? getRecommendationLabel(application.assessment.recommendation) : null;
              
              return (
                <div key={application.id} className="bg-vtb-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Candidate Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-vtb-text mb-1">
                            {application.applicant.name}
                          </h3>
                          <p className="text-vtb-text-secondary">{application.applicant.email}</p>
                          {application.applicant.phone && (
                            <p className="text-vtb-text-secondary text-sm">{application.applicant.phone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-vtb-text-secondary">Подал заявку:</p>
                          <p className="text-sm font-medium text-vtb-text">{formatDate(application.createdAt)}</p>
                        </div>
                      </div>

                      {/* Interview Status */}
                      <div className="mb-4">
                        <InterviewStatus
                          status={application.status}
                          scheduledAt={application.scheduledAt}
                          startedAt={application.startedAt}
                          endedAt={application.endedAt}
                          showDetails={true}
                          size="md"
                        />
                      </div>

                      {/* Assessment Results */}
                      {application.assessment && (
                        <div className="border-t border-border pt-4">
                          <div className="flex flex-wrap items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <BarChartIcon className="w-5 h-5 text-vtb-primary" />
                              <span className="text-sm font-medium text-vtb-text">Общий балл:</span>
                              <span className={`text-lg font-bold ${getScoreColor(application.assessment.overallScore)}`}>
                                {application.assessment.overallScore}%
                              </span>
                            </div>
                            {rec && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${rec.color}`}>
                                {rec.label}
                              </span>
                            )}
                          </div>

                          {/* Detailed Scores */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {application.assessment.technicalScore && (
                              <div className="text-center p-3 bg-vtb-surface-secondary rounded-lg">
                                <p className="text-sm text-vtb-text-secondary">Техническая</p>
                                <p className={`text-lg font-semibold ${getScoreColor(application.assessment.technicalScore)}`}>
                                  {application.assessment.technicalScore}%
                                </p>
                              </div>
                            )}
                            {application.assessment.softSkillsScore && (
                              <div className="text-center p-3 bg-vtb-surface-secondary rounded-lg">
                                <p className="text-sm text-vtb-text-secondary">Soft Skills</p>
                                <p className={`text-lg font-semibold ${getScoreColor(application.assessment.softSkillsScore)}`}>
                                  {application.assessment.softSkillsScore}%
                                </p>
                              </div>
                            )}
                            {application.assessment.communicationScore && (
                              <div className="text-center p-3 bg-vtb-surface-secondary rounded-lg">
                                <p className="text-sm text-vtb-text-secondary">Коммуникация</p>
                                <p className={`text-lg font-semibold ${getScoreColor(application.assessment.communicationScore)}`}>
                                  {application.assessment.communicationScore}%
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Strengths and Weaknesses */}
                          {(application.assessment.strengths.length > 0 || application.assessment.weaknesses.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {application.assessment.strengths.length > 0 && (
                                <div>
                                  <p className="font-medium text-green-700 mb-2">✅ Сильные стороны:</p>
                                  <ul className="space-y-1">
                                    {application.assessment.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-vtb-text-secondary">• {strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {application.assessment.weaknesses.length > 0 && (
                                <div>
                                  <p className="font-medium text-red-700 mb-2">⚠️ Области развития:</p>
                                  <ul className="space-y-1">
                                    {application.assessment.weaknesses.map((weakness, idx) => (
                                      <li key={idx} className="text-vtb-text-secondary">• {weakness}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {application.assessment.feedback && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Обратная связь:</span> {application.assessment.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
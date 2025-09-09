'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeToggle } from '../../../../../components/ThemeToggle';
import { InterviewStatus } from '../../../../../components/InterviewStatus';
import { BuildingIcon, UserIcon, VideoIcon } from '../../../../../components/Icons';
import VideoPlayer from '../../../../../components/VideoPlayer';
import { AssessmentDisplay } from '../../../../../components/AssessmentDisplay';
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
  // Связь с фреймворком оценки
  frameworkId?: string | null;
  framework?: {
    name: string;
    version: string;
  } | null;
  
  // Динамические результаты по критериям
  scores: Record<string, any>; // JSON поле с динамическими критериями
  overallScore: number;
  
  // Результаты анализа
  analysisResults?: any; // JSON поле с полными результатами от Gemini
  recommendation: string; // "HIRE", "REJECT", "REQUIRES_CLARIFICATION"
  
  // Обратная связь
  feedback?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  redFlags?: string[];
  notes?: string | null;
  
  // Мета-информация
  analysisStatus: string; // "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"
  confidence?: number | null; // Уверенность AI в оценке (0-100)
  processingTime?: number | null; // Время анализа в секундах
  
  // Совместимость с текущей системой
  technicalScore?: number | null;
  softSkillsScore?: number | null;
  communicationScore?: number | null;
  
  createdAt: string;
}

interface Resume {
  id: string;
  fileName: string;
  aiSummary?: string | null;
  skills: string[];
  experience?: number | null;
  education?: string | null;
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
  resume?: Resume | null;
  preInterviewScore?: number | null;
  matchingAnalysis?: any;
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
  const [selectedVideoInterview, setSelectedVideoInterview] = useState<Application | null>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState<string | null>(null); // ID интервью в процессе анализа
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, any>>({});
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set()); // Раскрытые карточки
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

  // Функция для переключения раскрытия карточки
  const toggleApplicationExpansion = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
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

  // Анализ видео через Gemini
  const handleAnalyzeVideo = async (applicationId: string) => {
    try {
      setAnalyzingVideo(applicationId);
      setAnalysisProgress(prev => ({
        ...prev,
        [applicationId]: { status: 'starting', message: 'Инициализация анализа...' }
      }));

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/interviews/${applicationId}/analyze-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customConfig: {
            video_fps: 2 // Повышенный FPS для детального анализа
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка анализа видео');
      }

      const result = await response.json();
      
      setAnalysisProgress(prev => ({
        ...prev,
        [applicationId]: { 
          status: 'completed', 
          message: 'Анализ завершен!',
          result: result
        }
      }));

      // Обновляем данные приложений
      if (user && jobId) {
        const applicationsResponse = await fetch(`/api/hr/jobs/${jobId}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (applicationsResponse.ok) {
          const updatedData = await applicationsResponse.json();
          setData(updatedData);
        }
      }

    } catch (error) {
      console.error('Ошибка анализа видео:', error);
      setAnalysisProgress(prev => ({
        ...prev,
        [applicationId]: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }
      }));
    } finally {
      setAnalyzingVideo(null);
      // Убираем прогресс через 5 секунд
      setTimeout(() => {
        setAnalysisProgress(prev => {
          const updated = { ...prev };
          delete updated[applicationId];
          return updated;
        });
      }, 5000);
    }
  };

  // Проверяем статус анализа
  const checkAnalysisStatus = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/interviews/${applicationId}/analyze-video`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const status = await response.json();
        return status;
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    }
    return null;
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
      <header className="bg-vtb-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link 
                href="/hr/jobs"
                className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
                </svg>
                <span className="hidden sm:inline">К вакансиям</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="h-8 w-8 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shrink-0">
                <BuildingIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold text-vtb-text truncate">
                  {data.job.title}
                </h1>
                <p className="text-xs text-vtb-text-secondary hidden sm:block">Отклики кандидатов</p>
              </div>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <ThemeToggle />
              {user && (
                <>
                  <span className="text-sm text-vtb-text-secondary hidden md:inline">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors hidden sm:inline-block"
                  >
                    Профиль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-xs sm:text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-vtb-text">{data.statistics.total}</p>
              <p className="text-sm text-vtb-text-secondary">Всего</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-vtb-primary dark:text-blue-400">{data.statistics.pending}</p>
              <p className="text-sm text-vtb-text-secondary">Ожидают</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.statistics.inProgress}</p>
              <p className="text-sm text-vtb-text-secondary">В процессе</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.statistics.completed}</p>
              <p className="text-sm text-vtb-text-secondary">Завершено</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-vtb-accent">
                {data.statistics.averageScore !== null ? data.statistics.averageScore.toFixed(1) : '—'}
              </p>
              <p className="text-sm text-vtb-text-secondary">Ср. балл</p>
            </div>
          </div>
          <div className="bg-vtb-surface rounded-xl p-4 border border-border hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.statistics.topCandidates}</p>
              <p className="text-sm text-vtb-text-secondary">Топ (80%+)</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Tabs */}
          <div className="w-full lg:w-auto">
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
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-vtb-primary text-white shadow-md'
                      : 'bg-vtb-surface text-vtb-text hover:bg-muted border border-border hover:shadow-sm'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label} ({tab.count})</span>
                  <span className="sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <span className="text-sm text-vtb-text-secondary whitespace-nowrap">Сортировать:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-lg bg-vtb-surface dark:bg-gray-800 text-vtb-text text-sm focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 min-w-0"
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
          <div className="space-y-3">
            {displayApplications.map((application) => {
              const isExpanded = expandedApplications.has(application.id);
              
              return (
                <div key={application.id} className="bg-vtb-surface border border-border rounded-xl transition-all duration-200 hover:shadow-md">
                  {/* Компактный вид - всегда видимый */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleApplicationExpansion(application.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Основная информация */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Аватар/инициалы */}
                        <div className="h-12 w-12 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                          {application.applicant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        
                        {/* Имя и email */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-vtb-text truncate">
                            {application.applicant.name}
                          </h3>
                          <p className="text-sm text-vtb-text-secondary truncate">{application.applicant.email}</p>
                        </div>
                        
                        {/* Статус интервью */}
                        <div className="shrink-0">
                          <InterviewStatus
                            status={application.status}
                            scheduledAt={application.scheduledAt}
                            startedAt={application.startedAt}
                            endedAt={application.endedAt}
                            showDetails={false}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Скоры и кнопка раскрытия */}
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Скор соответствия резюме */}
                        {application.preInterviewScore !== null && application.preInterviewScore !== undefined ? (
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              application.preInterviewScore >= 85 ? 'text-green-600 dark:text-green-400' :
                              application.preInterviewScore >= 70 ? 'text-blue-600 dark:text-blue-400' :
                              application.preInterviewScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {Math.round(application.preInterviewScore)}%
                            </div>
                            <div className="text-xs text-vtb-text-secondary">Соответствие</div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              —
                            </div>
                            <div className="text-xs text-vtb-text-secondary">Старый отклик</div>
                          </div>
                        )}

                        {/* Общий балл интервью */}
                        {application.assessment && (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              application.assessment.overallScore >= 80 ? 'text-green-600 dark:text-green-400' :
                              application.assessment.overallScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {Math.round(application.assessment.overallScore)}%
                            </div>
                            <div className="text-xs text-vtb-text-secondary">Интервью</div>
                          </div>
                        )}
                        
                        {/* Стрелка раскрытия */}
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Дата подачи заявки - мелким текстом */}
                    <div className="mt-2 text-xs text-vtb-text-secondary">
                      Подал заявку: {formatDate(application.createdAt)}
                    </div>
                  </div>

                  {/* Развернутые детали */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4 bg-vtb-surface-secondary/30">
                      {/* Дополнительная информация о кандидате */}
                      {application.applicant.phone && (
                        <div className="text-sm text-vtb-text-secondary">
                          <span className="font-medium">Телефон:</span> {application.applicant.phone}
                        </div>
                      )}

                      {/* Информация о резюме и соответствии */}
                      {application.resume ? (
                        <div className="bg-vtb-surface rounded-lg p-4 border border-border">
                          <h4 className="font-medium text-vtb-text mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Резюме: {application.resume.fileName}
                          </h4>
                          
                          {application.resume.aiSummary && (
                            <div className="mb-3">
                              <p className="text-sm text-vtb-text-secondary">{application.resume.aiSummary}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {application.resume.skills.length > 0 && (
                              <div>
                                <span className="font-medium text-vtb-text">Навыки:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {application.resume.skills.slice(0, 5).map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                  {application.resume.skills.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                      +{application.resume.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {application.resume.experience && (
                              <div>
                                <span className="font-medium text-vtb-text">Опыт:</span>
                                <span className="ml-2 text-vtb-text-secondary">{application.resume.experience} лет</span>
                              </div>
                            )}

                            {application.resume.education && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-vtb-text">Образование:</span>
                                <span className="ml-2 text-vtb-text-secondary">{application.resume.education}</span>
                              </div>
                            )}
                          </div>

                          {/* Анализ соответствия */}
                          {application.matchingAnalysis && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h5 className="font-medium text-vtb-text mb-2">Анализ соответствия вакансии</h5>
                              
                              {application.matchingAnalysis.matchedSkills && application.matchingAnalysis.matchedSkills.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Совпадающие навыки:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {application.matchingAnalysis.matchedSkills.map((skill: string, idx: number) => (
                                      <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {application.matchingAnalysis.missingSkills && application.matchingAnalysis.missingSkills.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Отсутствующие навыки:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {application.matchingAnalysis.missingSkills.slice(0, 5).map((skill: string, idx: number) => (
                                      <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {application.matchingAnalysis.reasoningNotes && (
                                <div className="text-xs text-vtb-text-secondary italic bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                  {application.matchingAnalysis.reasoningNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 15.5C3.462 16.333 4.422 18 5.982 18z" />
                            </svg>
                            <div>
                              <div className="font-medium">Старый формат отклика</div>
                              <div className="text-sm mt-1">
                                Этот отклик был создан до внедрения системы выбора резюме. 
                                Информация о соответствии резюме недоступна.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Подробный статус интервью */}
                      <div>
                        <InterviewStatus
                          status={application.status}
                          scheduledAt={application.scheduledAt}
                          startedAt={application.startedAt}
                          endedAt={application.endedAt}
                          showDetails={true}
                          size="md"
                        />
                      </div>

                      {/* Детальная оценка (если есть) */}
                      {application.assessment && (
                        <AssessmentDisplay assessment={application.assessment} compact={true} />
                      )}

                      {/* Кнопки действий */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                        <Link
                          href={`/hr/interviews/${application.id}/report`}
                          className="px-3 sm:px-4 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
                        >
                          {application.assessment ? 'Полный отчет' : 'Карточка интервью'}
                        </Link>
                        
                        {(application.status === 'COMPLETED' || application.status === 'IN_PROGRESS') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideoInterview(application);
                              }}
                              className="px-3 sm:px-4 py-2 bg-vtb-secondary text-white rounded-lg hover:bg-vtb-secondary/90 transition-all duration-200 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                              <VideoIcon className="w-4 h-4" />
                              Видеозапись
                            </button>
                            
                            {application.status === 'COMPLETED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeVideo(application.id);
                                }}
                                disabled={analyzingVideo === application.id}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                                  analyzingVideo === application.id
                                    ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                                    : analysisProgress[application.id]?.status === 'completed'
                                    ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 shadow-md hover:shadow-lg'
                                    : analysisProgress[application.id]?.status === 'error'
                                    ? 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 shadow-md hover:shadow-lg'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 shadow-md hover:shadow-lg'
                                }`}
                              >
                                {analyzingVideo === application.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Анализирую...
                                  </>
                                ) : analysisProgress[application.id]?.status === 'completed' ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Анализ готов
                                  </>
                                ) : analysisProgress[application.id]?.status === 'error' ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 14.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Повторить
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    🤖 Анализ видео
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Video Modal */}
      {selectedVideoInterview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <VideoPlayer
              interviewId={selectedVideoInterview.id}
              candidateName={selectedVideoInterview.applicant.name}
              jobTitle={data?.job.title || ''}
              onClose={() => setSelectedVideoInterview(null)}
              className="m-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
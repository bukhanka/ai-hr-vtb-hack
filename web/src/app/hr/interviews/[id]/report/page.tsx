'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeToggle } from '../../../../../components/ThemeToggle';
import { BuildingIcon, UserIcon, DocumentIcon, ChartBarIcon, CalendarIcon, ClockIcon } from '../../../../../components/Icons';
import VideoPlayer from '../../../../../components/VideoPlayer';
import { AssessmentDisplay } from '../../../../../components/AssessmentDisplay';
import Link from 'next/link';

interface InterviewReport {
  interview: {
    id: string;
    status: string;
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    transcript?: string;
    aiNotes?: string;
    createdAt: string;
    durationMinutes?: number;
  };
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    skills: string[];
    salary?: string;
    experience?: string;
    creator: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    createdAt: string;
    latestResume?: {
      id: string;
      fileName: string;
      skills: string[];
      experience?: number;
      education?: string;
      uploadedAt: string;
    };
  };
  assessment?: {
    id: string;
    overallScore: number;
    technicalScore?: number;
    softSkillsScore?: number;
    communicationScore?: number;
    recommendation: string;
    feedback?: string;
    strengths: string[];
    weaknesses: string[];
    notes?: string;
    createdAt: string;
    assessor: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    statusBreakdown: Record<string, number>;
    averageScore: number;
    recommendations: Record<string, number>;
    candidateRank?: number;
  };
}

export default function InterviewReportPage() {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

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

  // Загрузка отчета
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/interviews/${interviewId}/assessment`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка при загрузке отчета');
        }

        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Ошибка загрузки отчета:', error);
        setError(error instanceof Error ? error.message : 'Не удалось загрузить отчет');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReport();
    }
  }, [user, interviewId]);

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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REQUIRES_CLARIFICATION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return 'Нанять';
      case 'REJECT':
        return 'Отклонить';
      case 'REQUIRES_CLARIFICATION':
        return 'Требует уточнения';
      default:
        return recommendation;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 bg-vtb-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-vtb-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-vtb-text mb-2">Ошибка</h3>
          <p className="text-vtb-text-secondary mb-6">{error || 'Отчет не найден'}</p>
          <button
            onClick={() => router.push('/hr/jobs')}
            className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all"
          >
            Вернуться к вакансиям
          </button>
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
              <div className="h-10 w-10 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shadow-lg">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-vtb-text">
                  Отчет по интервью
                </h1>
                <p className="text-xs text-vtb-text-secondary">
                  {report.applicant.firstName} {report.applicant.lastName}
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              {user && (
                <>
                  <span className="text-sm text-vtb-text-secondary">
                    {user.firstName} {user.lastName}
                  </span>
                  <Link
                    href={`/hr/jobs/${report.job.id}/applications`}
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    К заявкам
                  </Link>
                  <button
                    onClick={() => router.push('/hr/jobs')}
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Вакансии
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
        
        {/* Header Info */}
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-vtb-text mb-2">
                {report.job.title}
              </h1>
              <p className="text-vtb-text-secondary text-lg mb-4">
                Интервью с {report.applicant.firstName} {report.applicant.lastName}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-vtb-text-secondary">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Создано: {formatDate(report.interview.createdAt)}</span>
                </div>
                {report.interview.startedAt && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>Начато: {formatDate(report.interview.startedAt)}</span>
                  </div>
                )}
                {report.interview.durationMinutes && (
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Длительность: {report.interview.durationMinutes} мин</span>
                  </div>
                )}
              </div>
            </div>
            
            {report.assessment && (
              <div className="text-center lg:text-right">
                <div className="text-4xl font-bold text-vtb-primary mb-2">
                  {Math.round(report.assessment.overallScore)}%
                </div>
                <div className={`inline-block px-4 py-2 rounded-xl font-medium border ${getRecommendationColor(report.assessment.recommendation)}`}>
                  {getRecommendationText(report.assessment.recommendation)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Candidate Details */}
            <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="w-6 h-6 text-vtb-primary" />
                <h3 className="text-lg font-semibold text-vtb-text">Кандидат</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-vtb-text">
                    {report.applicant.firstName} {report.applicant.lastName}
                  </p>
                  <p className="text-vtb-text-secondary">{report.applicant.email}</p>
                  {report.applicant.phone && (
                    <p className="text-vtb-text-secondary">{report.applicant.phone}</p>
                  )}
                </div>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-vtb-text-secondary">
                    Зарегистрирован: {formatDate(report.applicant.createdAt)}
                  </p>
                </div>

                {report.applicant.latestResume && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentIcon className="w-4 h-4 text-vtb-secondary" />
                      <span className="font-medium text-vtb-text">Резюме</span>
                    </div>
                    <p className="text-sm text-vtb-text-secondary mb-2">
                      {report.applicant.latestResume.fileName}
                    </p>
                    {report.applicant.latestResume.experience && (
                      <p className="text-sm text-vtb-text-secondary">
                        Опыт: {report.applicant.latestResume.experience} лет
                      </p>
                    )}
                    {report.applicant.latestResume.education && (
                      <p className="text-sm text-vtb-text-secondary">
                        Образование: {report.applicant.latestResume.education}
                      </p>
                    )}
                    {report.applicant.latestResume.skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-vtb-text mb-2">Навыки:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.applicant.latestResume.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-vtb-primary/10 text-vtb-primary text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-center gap-3 mb-4">
                <ChartBarIcon className="w-6 h-6 text-vtb-accent" />
                <h3 className="text-lg font-semibold text-vtb-text">Статистика по вакансии</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-vtb-text-secondary">Всего интервью:</span>
                  <span className="font-medium text-vtb-text">{report.stats.totalInterviews}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-vtb-text-secondary">Завершено:</span>
                  <span className="font-medium text-vtb-text">{report.stats.completedInterviews}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-vtb-text-secondary">Средний балл:</span>
                  <span className="font-medium text-vtb-text">
                    {report.stats.completedInterviews > 0 ? `${report.stats.averageScore}%` : '—'}
                  </span>
                </div>
                
                {report.stats.candidateRank && (
                  <div className="flex justify-between">
                    <span className="text-vtb-text-secondary">Позиция кандидата:</span>
                    <span className="font-medium text-vtb-text">
                      {report.stats.candidateRank} из {report.stats.completedInterviews}
                    </span>
                  </div>
                )}

                {/* Status Breakdown */}
                {Object.keys(report.stats.statusBreakdown).length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium text-vtb-text mb-2">По статусам:</p>
                    <div className="space-y-2">
                      {Object.entries(report.stats.statusBreakdown).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-sm">
                          <span className="text-vtb-text-secondary">
                            {status === 'SCHEDULED' ? 'Запланировано' :
                             status === 'IN_PROGRESS' ? 'Идет интервью' :
                             status === 'COMPLETED' ? 'Завершено' :
                             status === 'CANCELLED' ? 'Отменено' : status}:
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {Object.keys(report.stats.recommendations).length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium text-vtb-text mb-2">Рекомендации:</p>
                    <div className="space-y-2">
                      {Object.entries(report.stats.recommendations).map(([rec, count]) => (
                        <div key={rec} className="flex justify-between text-sm">
                          <span className="text-vtb-text-secondary">
                            {getRecommendationText(rec)}:
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Player or Interview Info */}
            <VideoPlayer
              interviewId={report.interview.id}
              candidateName={`${report.applicant.firstName} ${report.applicant.lastName}`}
              jobTitle={report.job.title}
            />
          </div>

          {/* Right Column - Assessment Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {report.assessment ? (
              <>
                {/* Overall Assessment */}
                <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
                  <h3 className="text-2xl font-bold text-vtb-text mb-6">Полные результаты AI-анализа</h3>
                  
                  <AssessmentDisplay 
                    assessment={report.assessment} 
                    compact={false}
                    className="border-0 pt-0"
                  />

                  <div className="mt-6 pt-6 border-t border-border text-sm text-vtb-text-secondary">
                    <p>
                      Оценка проведена: {formatDate(report.assessment.createdAt)}
                      {report.assessment.assessor && (
                        <span> · Оценщик: {report.assessment.assessor.firstName} {report.assessment.assessor.lastName}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Interview Transcript */}
                {report.interview.transcript && (
                  <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border">
                    <h3 className="text-lg font-semibold text-vtb-text mb-4">Транскрипт интервью</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-vtb-text-secondary text-sm leading-relaxed">
                        {report.interview.transcript}
                      </p>
                    </div>
                    
                    {report.interview.aiNotes && (
                      <div className="mt-4">
                        <h4 className="font-medium text-vtb-text mb-2">AI-заметки</h4>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                          <p className="text-sm text-blue-800">
                            {report.interview.aiNotes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-vtb-text mb-2">
                  Интервью еще не завершено
                </h3>
                <p className="text-vtb-text-secondary">
                  Статус: {report.interview.status === 'SCHEDULED' ? 'Запланировано' : 
                           report.interview.status === 'IN_PROGRESS' ? 'Идет интервью' : 
                           report.interview.status}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../../../../components/ThemeToggle';
import Link from 'next/link';

interface DialogueEntry {
  speaker: 'HR' | 'Candidate';
  message: string;
  timestamp: string;
  analysis?: string;
}

interface Analysis {
  overall_score: number;
  coverage_score: number;
  question_quality: number;
  adaptability: number;
  efficiency: number;
  recommendations: string[];
  red_flags: string[];
  best_moments: string[];
}

interface SimulationDetails {
  id: string;
  name: string;
  status: string;
  score?: number;
  hrPrompt: string;
  dialogue?: DialogueEntry[];
  analysis?: Analysis;
  createdAt: string;
  completedAt?: string;
  job: {
    title: string;
    description: string;
    requirements: string;
    skills: string[];
  };
  resume: {
    fileName: string;
    skills: string[];
    experience?: number;
    applicant: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function SimulationDetailsPage({ params }: { params: { id: string } }) {
  const [simulation, setSimulation] = useState<SimulationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'analysis' | 'prompt'>('dialogue');
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

  // Загрузка данных симуляции
  useEffect(() => {
    const fetchSimulation = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/admin/prompt-simulations/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Симуляция не найдена');
        }

        const data = await response.json();
        setSimulation(data.simulation);

      } catch (error) {
        console.error('Ошибка загрузки симуляции:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке симуляции');
      } finally {
        setLoading(false);
      }
    };

    fetchSimulation();
  }, [user, params.id]);

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
          <p className="text-vtb-text-secondary">Загрузка симуляции...</p>
        </div>
      </div>
    );
  }

  if (error || !simulation) {
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
            href="/admin/prompt-simulations"
            className="inline-flex px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
          >
            Вернуться к симуляциям
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
                href="/admin/prompt-simulations"
                className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
                </svg>
                <span>К симуляциям</span>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-vtb-text">
                  {simulation.name}
                </h1>
                <p className="text-xs text-vtb-text-secondary">
                  {simulation.job.title} • {simulation.resume.applicant.firstName} {simulation.resume.applicant.lastName}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-vtb-surface border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-vtb-primary mb-1">
              {simulation.score ? simulation.score.toFixed(0) : 'N/A'}/100
            </div>
            <div className="text-sm text-vtb-text-secondary">Общий балл</div>
          </div>
          
          {simulation.analysis && (
            <>
              <div className="bg-vtb-surface border border-border rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {simulation.analysis.coverage_score}/100
                </div>
                <div className="text-sm text-vtb-text-secondary">Покрытие тем</div>
              </div>
              
              <div className="bg-vtb-surface border border-border rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {simulation.analysis.question_quality}/100
                </div>
                <div className="text-sm text-vtb-text-secondary">Качество вопросов</div>
              </div>
              
              <div className="bg-vtb-surface border border-border rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {simulation.analysis.adaptability}/100
                </div>
                <div className="text-sm text-vtb-text-secondary">Адаптивность</div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-vtb-surface border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              {['dialogue', 'analysis', 'prompt'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-vtb-primary text-vtb-primary'
                      : 'border-transparent text-vtb-text-secondary hover:text-vtb-text hover:border-gray-300'
                  }`}
                >
                  {tab === 'dialogue' && 'Диалог'}
                  {tab === 'analysis' && 'Анализ'}
                  {tab === 'prompt' && 'Промпт'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Dialogue Tab */}
            {activeTab === 'dialogue' && (
              <div className="space-y-4">
                {simulation.dialogue && simulation.dialogue.length > 0 ? (
                  simulation.dialogue.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex ${entry.speaker === 'HR' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl px-4 py-3 rounded-lg ${
                          entry.speaker === 'HR'
                            ? 'bg-vtb-primary text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {entry.speaker === 'HR' ? 'HR' : 'Кандидат'}
                          </span>
                          <span className="text-xs opacity-50">{entry.timestamp}</span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{entry.message}</div>
                        {entry.analysis && (
                          <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-75">
                            💡 {entry.analysis}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-vtb-text-secondary">Диалог не найден или симуляция не завершена</p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {simulation.analysis ? (
                  <>
                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold text-vtb-text mb-3">💡 Рекомендации</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <ul className="space-y-2">
                          {simulation.analysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-green-800 text-sm">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Red Flags */}
                    {simulation.analysis.red_flags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-vtb-text mb-3">🚨 Проблемы</h3>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <ul className="space-y-2">
                            {simulation.analysis.red_flags.map((flag, index) => (
                              <li key={index} className="text-red-800 text-sm">
                                • {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Best Moments */}
                    {simulation.analysis.best_moments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-vtb-text mb-3">⭐ Лучшие моменты</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <ul className="space-y-2">
                            {simulation.analysis.best_moments.map((moment, index) => (
                              <li key={index} className="text-blue-800 text-sm">
                                • {moment}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Detailed Scores */}
                    <div>
                      <h3 className="text-lg font-semibold text-vtb-text mb-3">📊 Детальные оценки</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-vtb-surface-secondary rounded-lg p-4">
                          <div className="text-sm text-vtb-text-secondary mb-1">Эффективность</div>
                          <div className="text-xl font-bold text-vtb-text">
                            {simulation.analysis.efficiency}/100
                          </div>
                        </div>
                        <div className="bg-vtb-surface-secondary rounded-lg p-4">
                          <div className="text-sm text-vtb-text-secondary mb-1">Общая оценка</div>
                          <div className="text-xl font-bold text-vtb-text">
                            {simulation.analysis.overall_score}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-vtb-text-secondary">Анализ не найден или симуляция не завершена</p>
                  </div>
                )}
              </div>
            )}

            {/* Prompt Tab */}
            {activeTab === 'prompt' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-vtb-text">
                      {simulation.hrPrompt.trim() ? 'Кастомный HR промпт' : 'Реальный HR промпт (из продакшена)'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      simulation.hrPrompt.trim() 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {simulation.hrPrompt.trim() ? 'Эксперимент' : 'Продакшен'}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {simulation.hrPrompt.trim() ? (
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {simulation.hrPrompt}
                      </pre>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-green-600 mb-2">✅</div>
                        <p className="text-sm text-gray-600">
                          Использовался реальный промпт из продакшена, сгенерированный на основе данных вакансии и кандидата
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Этот промпт был автоматически создан с учетом навыков кандидата, требований вакансии и контекста ВТБ
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold text-vtb-text mb-3">Контекст вакансии</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm"><strong>Должность:</strong> {simulation.job.title}</p>
                      <p className="text-sm"><strong>Навыки:</strong> {simulation.job.skills.join(', ')}</p>
                      <p className="text-sm"><strong>Требования:</strong></p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{simulation.job.requirements}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-vtb-text mb-3">Профиль кандидата</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm">
                        <strong>Кандидат:</strong> {simulation.resume.applicant.firstName} {simulation.resume.applicant.lastName}
                      </p>
                      <p className="text-sm"><strong>Опыт:</strong> {simulation.resume.experience || 'не указан'} лет</p>
                      <p className="text-sm"><strong>Навыки:</strong> {simulation.resume.skills.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
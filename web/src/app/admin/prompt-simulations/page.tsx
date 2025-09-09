'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../../../components/ThemeToggle';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  skills: string[];
}

interface Resume {
  id: string;
  fileName: string;
  applicant: {
    firstName: string;
    lastName: string;
  };
}

interface Simulation {
  id: string;
  name: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  score?: number;
  createdAt: string;
  completedAt?: string;
  job: {
    title: string;
    skills: string[];
  };
  resume: {
    fileName: string;
    applicant: {
      firstName: string;
      lastName: string;
    };
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function PromptSimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Форма создания симуляции
  const [formData, setFormData] = useState({
    name: '',
    jobId: '',
    resumeId: '',
    hrPrompt: '' // Пустой по умолчанию - будет использован реальный промпт
  });
  
  const [showRealPrompt, setShowRealPrompt] = useState(false);
  const [realPrompt, setRealPrompt] = useState('');

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

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        // Загружаем все данные параллельно
        const [simulationsRes, jobsRes, resumesRes] = await Promise.all([
          fetch('/api/admin/prompt-simulations', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/jobs', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/admin/resumes', {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        ]);

        if (simulationsRes.ok) {
          const data = await simulationsRes.json();
          setSimulations(data.simulations);
        }

        if (jobsRes.ok) {
          const data = await jobsRes.json();
          setJobs(data.jobs);
        }

        if (resumesRes.ok) {
          const data = await resumesRes.json();
          setResumes(data.resumes);
        }

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Генерация реального промпта для предпросмотра
  const generateRealPrompt = async () => {
    if (!formData.jobId || !formData.resumeId) {
      setError('Выберите вакансию и резюме для генерации промпта');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      // Получаем данные для промпта
      const [jobRes, resumeRes] = await Promise.all([
        fetch(`/api/jobs/${formData.jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/resume/${formData.resumeId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (jobRes.ok && resumeRes.ok) {
        const jobData = await jobRes.json();
        const resumeData = await resumeRes.json();
        
        // Формируем данные для промпта (упрощенная версия)
        const candidateSkills = resumeData.resume?.skills?.length 
          ? `Навыки из резюме: ${resumeData.resume.skills.join(', ')}`
          : 'Навыки в резюме не указаны';
          
        const candidateExperience = resumeData.resume?.experience 
          ? `Заявленный опыт: ${resumeData.resume.experience} лет`
          : 'Опыт работы не указан';

        const requiredSkills = jobData.job?.skills?.length
          ? `Ключевые навыки: ${jobData.job.skills.join(', ')}`
          : 'Специфические навыки не указаны';

        const prompt = `Вы - опытный HR-специалист ВТБ, проводящий 40 минут видеоинтервью для предварительного отбора кандидатов. Сегодня вы собеседуете ${resumeData.resume?.applicant?.firstName} ${resumeData.resume?.applicant?.lastName} на позицию "${jobData.job?.title}".

КОНТЕКСТ ИНТЕРВЬЮ:
• Позиция: ${jobData.job?.title}
• Кандидат: ${resumeData.resume?.applicant?.firstName} ${resumeData.resume?.applicant?.lastName}
• ${candidateSkills}
• ${candidateExperience}
• ${requiredSkills}
• Требования к опыту: ${jobData.job?.experience || 'не указаны'}

ОПИСАНИЕ ПОЗИЦИИ:
${jobData.job?.description}

КЛЮЧЕВЫЕ ТРЕБОВАНИЯ:
${jobData.job?.requirements}

ВАШИ ЗАДАЧИ:
1. Проверить соответствие опыта кандидата заявленному в резюме
2. Оценить технические навыки: ${jobData.job?.skills?.slice(0, 3).join(', ')}${(jobData.job?.skills?.length || 0) > 3 ? ' и другие' : ''}
3. Выявить мотивацию и понимание роли
4. Оценить коммуникативные навыки и культурное соответствие
5. Дать количественную оценку по критериям (техническая экспертиза 40%, коммуникация 30%, опыт 20%, мотивация 10%)

СТРАТЕГИЯ ИНТЕРВЬЮ:
• Начните с приветствия и краткого рассказа о компании и позиции
• Попросите кандидата рассказать о себе и опыте
• Углубляйтесь в технические детали ТОЛЬКО если кандидат демонстрирует соответствующий опыт
• Задавайте конкретные вопросы о проектах и достижениях
• Адаптируйте сложность вопросов под уровень кандидата
• Завершите вопросами о мотивации и ожиданиях

ВАЖНЫЕ ПРИНЦИПЫ:
• Поддерживайте профессиональный, но дружелюбный тон
• Внимательно слушайте ответы и задавайте уточняющие вопросы
• Фиксируйте противоречия между резюме и ответами
• Оценивайте не только технические навыки, но и soft skills
• Давайте кандидату возможность задать вопросы о компании и роли

Вы видите кандидата через веб-камеру и можете оценивать невербальные сигналы. Учитывайте язык тела, уверенность в ответах, паузы и эмоциональную реакцию на вопросы.

Начните интервью с профессионального приветствия и представления себя как HR-специалиста ВТБ.`;

        setRealPrompt(prompt);
        setShowRealPrompt(true);
        setError('');
      }
    } catch (error) {
      console.error('Ошибка генерации промпта:', error);
      setError('Не удалось сгенерировать промпт');
    }
  };

  const handleCreateDemo = async () => {
    try {
      setCreating(true);
      setError('');

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/prompt-simulations/demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании демо симуляции');
      }

      const result = await response.json();
      
      // Обновляем список симуляций
      setSimulations(prev => [result.simulation, ...prev]);
      
    } catch (error) {
      console.error('Ошибка создания демо симуляции:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании демо симуляции');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.jobId || !formData.resumeId) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/prompt-simulations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании симуляции');
      }

      const result = await response.json();
      
      // Обновляем список симуляций
      setSimulations(prev => [result.simulation, ...prev]);
      
      // Сбрасываем форму
      setFormData({ ...formData, name: '' });
      setShowCreateForm(false);
      
    } catch (error) {
      console.error('Ошибка создания симуляции:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании симуляции');
    } finally {
      setCreating(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Завершено';
      case 'PENDING': return 'В процессе';
      case 'FAILED': return 'Ошибка';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка симуляций...</p>
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
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-vtb-text">
                  Симуляция промптов
                </h1>
                <p className="text-xs text-vtb-text-secondary">Тестирование и оптимизация AI HR</p>
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
        {/* Create Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            + Новая симуляция
          </button>
          <button
            onClick={handleCreateDemo}
            disabled={creating}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
          >
            🎬 Демо симуляция
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-vtb-surface border border-border rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-vtb-text mb-4">Создать симуляцию</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateSimulation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vtb-text mb-2">
                  Название симуляции *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-vtb-primary focus:border-transparent"
                  placeholder="Тестирование HR промпта v2.1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vtb-text mb-2">
                    Вакансия *
                  </label>
                  <select
                    value={formData.jobId}
                    onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-vtb-primary focus:border-transparent"
                  >
                    <option value="">Выберите вакансию</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} ({job.skills.slice(0, 2).join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-vtb-text mb-2">
                    Резюме кандидата *
                  </label>
                  <select
                    value={formData.resumeId}
                    onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-vtb-primary focus:border-transparent"
                  >
                    <option value="">Выберите резюме</option>
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.applicant.firstName} {resume.applicant.lastName} - {resume.fileName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-vtb-text">
                    HR промпт (опционально)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateRealPrompt}
                      disabled={!formData.jobId || !formData.resumeId}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      Показать реальный промпт
                    </button>
                    {realPrompt && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hrPrompt: realPrompt })}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Использовать реальный
                      </button>
                    )}
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-vtb-text-secondary">
                    {formData.hrPrompt.trim() 
                      ? '🔧 Будет использован кастомный промпт для эксперимента' 
                      : '⚡ Если поле пустое, будет использован реальный промпт из продакшена'
                    }
                  </p>
                </div>
                <textarea
                  value={formData.hrPrompt}
                  onChange={(e) => setFormData({ ...formData, hrPrompt: e.target.value })}
                  rows={12}
                  placeholder="Оставьте пустым для использования реального промпта, или введите кастомный промпт для тестирования..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-vtb-primary focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Создание симуляции...' : 'Создать и запустить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Simulations List */}
        {simulations.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
              <svg className="w-10 h-10 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-vtb-text mb-2">
              Нет симуляций
            </h3>
            <p className="text-vtb-text-secondary">
              Создайте первую симуляцию для тестирования промптов
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {simulations.map((simulation) => (
              <div key={simulation.id} className="bg-vtb-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-vtb-text">
                        {simulation.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(simulation.status)}`}>
                        {getStatusText(simulation.status)}
                      </span>
                      {simulation.score && (
                        <span className="px-2 py-1 bg-vtb-accent/10 text-vtb-accent text-xs font-medium rounded">
                          {simulation.score.toFixed(0)}/100
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        simulation.hrPrompt && simulation.hrPrompt.trim()
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {simulation.hrPrompt && simulation.hrPrompt.trim() ? 'Кастомный промпт' : 'Реальный промпт'}
                      </span>
                    </div>
                    <div className="text-sm text-vtb-text-secondary space-y-1">
                      <p>Вакансия: {simulation.job.title}</p>
                      <p>Кандидат: {simulation.resume.applicant.firstName} {simulation.resume.applicant.lastName}</p>
                      <p>Создано: {formatDate(simulation.createdAt)} - {simulation.creator.firstName} {simulation.creator.lastName}</p>
                      {simulation.completedAt && (
                        <p>Завершено: {formatDate(simulation.completedAt)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/prompt-simulations/${simulation.id}`}
                    className="px-3 py-1 text-xs bg-vtb-primary text-white rounded hover:bg-vtb-primary/90 transition-colors"
                  >
                    Посмотреть результаты
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно для просмотра реального промпта */}
      {showRealPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-vtb-surface rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl border border-border max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-vtb-text">
                Реальный HR промпт (из продакшена)
              </h3>
              <button
                onClick={() => setShowRealPrompt(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto flex-1">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {realPrompt}
              </pre>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setFormData({ ...formData, hrPrompt: realPrompt });
                  setShowRealPrompt(false);
                }}
                className="px-4 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-colors"
              >
                Использовать этот промпт
              </button>
              <button
                onClick={() => setShowRealPrompt(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
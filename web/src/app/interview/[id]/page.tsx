'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { BuildingIcon, MicrophoneIcon, PlayIcon, CheckCircleIcon } from '../../../components/Icons';
import { VideoConference } from '../../../components/VideoConference';

interface Interview {
  id: string;
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  job: {
    title: string;
    description: string;
  };
}

interface Assessment {
  id: string;
  overallScore: number;
  recommendation: string;
  feedback: string;
}

export default function InterviewPage() {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showVideoConference, setShowVideoConference] = useState(false);
  
  console.log('InterviewPage: рендер, showVideoConference =', showVideoConference);
  
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

  // Загрузка интервью
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/my-applications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке интервью');
        }

        const data = await response.json();
        const currentInterview = data.applications.find((app: any) => app.id === interviewId);
        
        if (!currentInterview) {
          setError('Интервью не найдено');
          return;
        }

        console.log('Загружено интервью:', currentInterview);
        console.log('Статус интервью:', currentInterview.status);
        setInterview(currentInterview);
        if (currentInterview.assessment) {
          setAssessment(currentInterview.assessment);
        }
      } catch (error) {
        console.error('Ошибка загрузки интервью:', error);
        setError('Не удалось загрузить интервью');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInterview();
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

  const refreshInterviewData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch('/api/my-applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении данных интервью');
      }

      const data = await response.json();
      const updatedInterview = data.applications.find((app: any) => app.id === interviewId);
      
      if (updatedInterview) {
        console.log('Обновлены данные интервью:', updatedInterview);
        setInterview(updatedInterview);
        if (updatedInterview.assessment) {
          setAssessment(updatedInterview.assessment);
        }
      }
    } catch (error) {
      console.error('Ошибка обновления данных интервью:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка интервью...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 bg-vtb-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-vtb-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-vtb-text mb-2">Ошибка</h3>
          <p className="text-vtb-text-secondary mb-6">{error || 'Интервью не найдено'}</p>
          <button
            onClick={() => router.push('/my-applications')}
            className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all"
          >
            Вернуться к заявкам
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
                  Видеоинтервью
                </h1>
                <p className="text-xs text-vtb-text-secondary">
                  {interview.job.title}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status: Scheduled or In Progress - Ready to Start Video Interview */}
        {(() => {
          const canStartVideo = interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS';
          console.log('Проверка условия SCHEDULED или IN_PROGRESS:', canStartVideo);
          console.log('Статус:', interview.status);
          if (canStartVideo) {
            console.log('Рендерим блок для видеоинтервью');
            return true;
          }
          return false;
        })() && (
          <div className="text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-vtb-primary to-vtb-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <PlayIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-vtb-text mb-6">
              {interview.status === 'SCHEDULED' 
                ? 'Добро пожаловать на видеоинтервью!' 
                : 'Продолжите видеоинтервью'
              }
            </h1>
            <p className="text-xl text-vtb-text-secondary max-w-2xl mx-auto mb-8">
              {interview.status === 'SCHEDULED'
                ? <>Вы готовы пройти видеоинтервью на позицию <strong>{interview.job.title}</strong>. Интервью будет проходить в режиме видеоконференции с HR-специалистом.</>
                : <>Ваше интервью на позицию <strong>{interview.job.title}</strong> уже началось. Продолжите в режиме видеоконференции.</>
              }
            </p>
            
            <div className="bg-vtb-surface rounded-2xl p-8 mb-8 border border-border">
              <h3 className="text-lg font-semibold text-vtb-text mb-4">Что вас ждет:</h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-vtb-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-vtb-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-vtb-text">Подключение</h4>
                    <p className="text-sm text-vtb-text-secondary">Настройка камеры и микрофона</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-vtb-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-vtb-secondary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-vtb-text">Видеоинтервью</h4>
                    <p className="text-sm text-vtb-text-secondary">Общение с HR-специалистом в реальном времени</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-vtb-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-vtb-accent font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-vtb-text">Обратная связь</h4>
                    <p className="text-sm text-vtb-text-secondary">Результаты и следующие шаги</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                console.log('Кнопка "Начать видеоинтервью" нажата!');
                setShowVideoConference(true);
                console.log('showVideoConference установлен в true');
              }}
              className="px-12 py-4 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-lg font-semibold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {interview.status === 'SCHEDULED' ? 'Начать видеоинтервью' : 'Продолжить видеоинтервью'}
            </button>
          </div>
        )}


        {/* Status: Completed - Results */}
        {(() => {
          console.log('Проверка условия COMPLETED:', interview.status === 'COMPLETED');
          console.log('assessment:', assessment);
          if (interview.status === 'COMPLETED' && assessment) {
            console.log('Рендерим блок COMPLETED');
            return true;
          }
          return false;
        })() && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-vtb-text mb-4">
              Интервью завершено!
            </h1>
            <p className="text-xl text-vtb-text-secondary mb-8">
              Спасибо за участие в собеседовании. Ваши результаты готовы.
            </p>

            {/* Results Card */}
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border text-left mb-8">
              <h3 className="text-2xl font-bold text-vtb-text mb-6 text-center">Результаты AI-анализа</h3>
              
              {/* Overall Score */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold text-vtb-text">Общий балл</span>
                  <span className="text-2xl font-bold text-vtb-primary">{Math.round(assessment.overallScore)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-vtb-primary to-vtb-secondary h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${assessment.overallScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mb-6">
                <h4 className="font-semibold text-vtb-text mb-3">Рекомендация:</h4>
                <div className={`px-4 py-2 rounded-xl inline-block font-medium ${
                  assessment.recommendation === 'HIRE' 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : assessment.recommendation === 'REJECT'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {assessment.recommendation === 'HIRE' ? '✅ Рекомендован к найму' :
                   assessment.recommendation === 'REJECT' ? '❌ Не рекомендован' : '⚠️ Требует дополнительного рассмотрения'}
                </div>
              </div>

              {/* Feedback */}
              <div className="mb-6">
                <h4 className="font-semibold text-vtb-text mb-3">Обратная связь:</h4>
                <p className="text-vtb-text-secondary leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {assessment.feedback}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/my-applications')}
                className="px-8 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
              >
                Вернуться к заявкам
              </button>
              <button
                onClick={() => router.push('/jobs')}
                className="px-8 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-lg transition-all"
              >
                Искать другие вакансии
              </button>
            </div>
          </div>
        )}
        
        {/* Status: Cancelled */}
        {interview.status === 'CANCELLED' && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-vtb-text mb-4">
              Интервью отменено
            </h1>
            <p className="text-xl text-vtb-text-secondary mb-8">
              К сожалению, интервью на позицию <strong>{interview.job.title}</strong> было отменено.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/my-applications')}
                className="px-8 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
              >
                Вернуться к заявкам
              </button>
              <button
                onClick={() => router.push('/jobs')}
                className="px-8 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-lg transition-all"
              >
                Искать другие вакансии
              </button>
            </div>
          </div>
        )}

        {(() => {
          if (interview.status !== 'SCHEDULED' && interview.status !== 'IN_PROGRESS' && interview.status !== 'COMPLETED' && interview.status !== 'CANCELLED') {
            console.log('Неожиданный статус интервью:', interview.status);
            console.log('Ни один блок не рендерится!');
          }
          return null;
        })()}
      </main>

      {/* Video Conference Modal */}
      {(() => {
        console.log('Проверка условий для модального окна:');
        console.log('showVideoConference =', showVideoConference);
        console.log('user =', user);
        console.log('условие выполняется =', showVideoConference && user);
        
        if (showVideoConference && user) {
          console.log('Рендерим VideoConference для:', user.firstName, user.lastName);
          return (
            <VideoConference
              participantName={`${user.firstName} ${user.lastName}`}
              interviewId={interviewId}
              onClose={async () => {
                console.log('Закрываем видеоконференцию');
                setShowVideoConference(false);
                // Обновляем данные интервью после закрытия видеоконференции
                await refreshInterviewData();
              }}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  BuildingIcon, 
  UserIcon, 
  SparklesIcon,
  TargetIcon,
  BrainIcon,
  BarChartIcon,
  DocumentIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  EditIcon
} from '@/components/Icons';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  phone?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('auth-token');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-vtb-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary font-medium">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Будет перенаправлен на login
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Администратор';
      case 'HR':
        return 'HR-специалист';
      case 'APPLICANT':
        return 'Соискатель';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'HR':
        return 'bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white';
      case 'APPLICANT':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default:
        return 'bg-vtb-surface text-vtb-text border border-border';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return SparklesIcon;
      case 'HR':
        return TargetIcon;
      case 'APPLICANT':
        return UserIcon;
      default:
        return UserIcon;
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-vtb-surface border-b border-border backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shadow-lg">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-vtb-text">HR-Аватар ВТБ</h1>
                <p className="text-xs text-vtb-text-secondary">Панель управления</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <RoleIcon className="w-4 h-4 text-vtb-text-secondary" />
                <span className="text-vtb-text font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getRoleColor(user.role)}`}>
                <RoleIcon className="w-3 h-3" />
                <span>{getRoleLabel(user.role)}</span>
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors rounded-lg hover:bg-muted"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-vtb-surface rounded-2xl p-8 shadow-xl border border-border mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-vtb-primary/5 to-vtb-accent/5 rounded-2xl"></div>
            <div className="relative z-10 flex items-center space-x-6">
              <div className="h-20 w-20 bg-gradient-to-br from-vtb-primary via-vtb-secondary to-vtb-accent rounded-2xl flex items-center justify-center shadow-xl">
                <RoleIcon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-vtb-text mb-2">
                  Добро пожаловать, {user.firstName}!
                </h2>
                <p className="text-vtb-text-secondary text-lg">
                  Вы вошли в систему как <span className="font-semibold text-vtb-primary">{getRoleLabel(user.role)}</span>
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="h-2 w-2 bg-vtb-primary rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-vtb-secondary rounded-full animate-pulse delay-100"></div>
                <div className="h-2 w-2 bg-vtb-accent rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border mb-8">
            <h3 className="text-xl font-bold text-vtb-text mb-6 flex items-center space-x-3">
              <UserIcon className="w-6 h-6 text-vtb-primary" />
              <span>Информация о профиле</span>
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-background rounded-xl p-4 border border-border">
                <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Email</dt>
                <dd className="text-vtb-text font-semibold">{user.email}</dd>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border">
                <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Роль</dt>
                <dd className="text-vtb-text font-semibold flex items-center space-x-2">
                  <RoleIcon className="w-4 h-4" />
                  <span>{getRoleLabel(user.role)}</span>
                </dd>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border">
                <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Имя</dt>
                <dd className="text-vtb-text font-semibold">{user.firstName}</dd>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border">
                <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Фамилия</dt>
                <dd className="text-vtb-text font-semibold">{user.lastName}</dd>
              </div>
              {user.phone && (
                <div className="bg-background rounded-xl p-4 border border-border">
                  <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Телефон</dt>
                  <dd className="text-vtb-text font-semibold">{user.phone}</dd>
                </div>
              )}
              <div className="bg-background rounded-xl p-4 border border-border">
                <dt className="text-sm font-medium text-vtb-text-secondary mb-2">Дата регистрации</dt>
                <dd className="text-vtb-text font-semibold flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </dd>
              </div>
            </div>
          </div>

          {/* Role-specific content */}
          {user.role === 'ADMIN' && (
            <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border mb-8">
              <h3 className="text-xl font-bold text-vtb-text mb-6 flex items-center space-x-3">
                <SparklesIcon className="w-6 h-6 text-red-500" />
                <span>Функции администратора</span>
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Управление пользователями</h4>
                  <p className="text-sm text-vtb-text-secondary">Создание и управление аккаунтами пользователей системы</p>
                </div>
                <div className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <EditIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Настройки системы</h4>
                  <p className="text-sm text-vtb-text-secondary">Конфигурация HR-аватара и системных параметров</p>
                </div>
                <div className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <BarChartIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Аналитика</h4>
                  <p className="text-sm text-vtb-text-secondary">Отчеты и статистика по работе системы</p>
                </div>
              </div>
            </div>
          )}

          {user.role === 'HR' && (
            <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border mb-8">
              <h3 className="text-xl font-bold text-vtb-text mb-6 flex items-center space-x-3">
                <TargetIcon className="w-6 h-6 text-vtb-primary" />
                <span>Функции HR-специалиста</span>
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/hr/jobs/create" className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Создание вакансий</h4>
                  <p className="text-sm text-vtb-text-secondary">Добавление новых позиций и требований</p>
                </Link>
                <Link href="/hr/jobs" className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-vtb-secondary to-vtb-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <BrainIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Собеседования с ИИ</h4>
                  <p className="text-sm text-vtb-text-secondary">Управление интервью и оценками</p>
                </Link>
                <div className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-vtb-accent to-vtb-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <BarChartIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Анализ кандидатов</h4>
                  <p className="text-sm text-vtb-text-secondary">Оценки и рекомендации по кандидатам</p>
                </div>
              </div>
            </div>
          )}

          {user.role === 'APPLICANT' && (
            <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border mb-8">
              <h3 className="text-xl font-bold text-vtb-text mb-6 flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-green-500" />
                <span>Функции соискателя</span>
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/jobs" className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <TargetIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Поиск вакансий</h4>
                  <p className="text-sm text-vtb-text-secondary">Просмотр открытых позиций и подача заявок</p>
                </Link>
                <Link href="/my-applications" className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Мои заявки</h4>
                  <p className="text-sm text-vtb-text-secondary">Отслеживание статусов откликов и собеседований</p>
                </Link>
                <Link href="/profile/resume" className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-vtb-primary">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <DocumentIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-vtb-text mb-2">Загрузка резюме</h4>
                  <p className="text-sm text-vtb-text-secondary">Добавление CV и портфолио для отклика</p>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
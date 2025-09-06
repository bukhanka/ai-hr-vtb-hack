'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BuildingIcon, UserIcon, SparklesIcon, LogInIcon } from '@/components/Icons';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Успешный вход
      localStorage.setItem('auth-token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const quickLogin = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);
    
    // Заполняем форму
    setFormData({ email, password });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Успешный вход
      localStorage.setItem('auth-token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-vtb-surface border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shadow-lg">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-vtb-text">
                  HR-Аватар ВТБ
                </h1>
                <p className="text-xs text-vtb-text-secondary">MORE.Tech</p>
              </div>
            </Link>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-vtb-primary via-vtb-secondary to-vtb-accent rounded-2xl flex items-center justify-center mb-6 shadow-xl transform hover:scale-105 transition-all duration-300">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-vtb-text mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-vtb-text-secondary">
              Войдите в HR-Аватар ВТБ для управления процессом отбора кандидатов
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-vtb-surface rounded-2xl p-8 shadow-xl border border-border">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <div className="h-5 w-5 text-red-500">⚠️</div>
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-vtb-text mb-2">
                    Email адрес
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-4 py-3 bg-background border border-border rounded-xl text-vtb-text placeholder-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-all duration-200"
                    placeholder="example@vtb.ru"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-vtb-text mb-2">
                    Пароль
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full px-4 py-3 bg-background border border-border rounded-xl text-vtb-text placeholder-vtb-text-secondary focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-all duration-200"
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-sm font-semibold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:shadow-vtb-primary/25"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Вход...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Войти в систему</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/register"
                  className="text-sm font-medium text-vtb-primary hover:text-vtb-secondary transition-colors"
                >
                  Нет аккаунта? Зарегистрируйтесь
                </Link>
              </div>
            </form>
          </div>

          {/* Test Accounts */}
          <div className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border">
            <h3 className="text-lg font-semibold text-vtb-text mb-4 flex items-center space-x-2">
              <div className="h-2 w-2 bg-vtb-accent rounded-full"></div>
              <span>Тестовые аккаунты</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <div className="font-medium text-vtb-text">Администратор</div>
                  <div className="text-vtb-text-secondary">admin@vtbhack.ru / admin123456</div>
                </div>
                <button
                  onClick={() => quickLogin('admin@vtbhack.ru', 'admin123456')}
                  disabled={isLoading}
                  className="p-2 text-vtb-primary hover:text-vtb-secondary hover:bg-vtb-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Войти как администратор"
                >
                  <LogInIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <div className="font-medium text-vtb-text">HR-специалист</div>
                  <div className="text-vtb-text-secondary">hr1@vtbhack.ru / hr123456</div>
                </div>
                <button
                  onClick={() => quickLogin('hr1@vtbhack.ru', 'hr123456')}
                  disabled={isLoading}
                  className="p-2 text-vtb-primary hover:text-vtb-secondary hover:bg-vtb-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Войти как HR-специалист"
                >
                  <LogInIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <div className="font-medium text-vtb-text">Соискатель</div>
                  <div className="text-vtb-text-secondary">applicant1@example.com / applicant123456</div>
                </div>
                <button
                  onClick={() => quickLogin('applicant1@example.com', 'applicant123456')}
                  disabled={isLoading}
                  className="p-2 text-vtb-primary hover:text-vtb-secondary hover:bg-vtb-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Войти как соискатель"
                >
                  <LogInIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
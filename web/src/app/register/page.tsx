'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserIcon, BuildingIcon } from '@/components/Icons'
import Link from 'next/link'

type UserRole = 'HR' | 'APPLICANT' | 'ADMIN'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'APPLICANT' as UserRole
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при регистрации')
      }

      // Успешная регистрация - сохраняем токен и перенаправляем
      if (data.token) {
        localStorage.setItem('auth-token', data.token)
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-vtb-primary via-vtb-secondary to-vtb-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <BuildingIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">HR-Аватар ВТБ</h1>
          <p className="text-xl opacity-90 text-center max-w-md leading-relaxed">
            Инновационная платформа для управления персоналом с использованием ИИ
          </p>
          <div className="mt-8 text-sm opacity-75">
            MORE.Tech × ВТБ Хакатон 2024
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-t from-white/10 to-transparent rounded-tl-full"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-b from-white/10 to-transparent rounded-br-full"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header with Theme Toggle */}
          <div className="flex justify-between items-center mb-8">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-vtb-text-secondary hover:text-vtb-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 12H5m0 0l7-7m-7 7l7 7"/>
              </svg>
              <span>Назад</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Logo and Title */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-vtb-text mb-2">
              Добро пожаловать
            </h2>
            <p className="text-vtb-text-secondary">
              Создайте аккаунт для работы с HR-аватаром
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-vtb-surface shadow-2xl rounded-2xl p-8 border border-border backdrop-blur-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-4">
                  <p className="text-vtb-error text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-vtb-text mb-2">
                    Имя
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                    placeholder="Введите имя"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-vtb-text mb-2">
                    Фамилия
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                    placeholder="Введите фамилию"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-vtb-text mb-2">
                  Email адрес
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                  placeholder="example@vtb.ru"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-vtb-text mb-2">
                  Телефон (опционально)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-vtb-text mb-2">
                  Роль в системе
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                >
                  <option value="APPLICANT">Соискатель</option>
                  <option value="HR">HR-специалист</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-vtb-text mb-2">
                    Пароль
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                    placeholder="Минимум 8 символов"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-vtb-text mb-2">
                    Подтвердите пароль
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
                    placeholder="Повторите пароль"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-vtb-primary to-vtb-secondary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtb-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-vtb-text-secondary">
                  Уже есть аккаунт?{' '}
                  <Link href="/login" className="font-semibold text-vtb-primary hover:text-vtb-primary-hover transition-colors">
                    Войти в систему
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Legal Notice */}
          <div className="text-center text-xs text-vtb-text-secondary leading-relaxed">
            Регистрируясь, вы соглашаетесь с{' '}
            <a href="#" className="text-vtb-primary hover:text-vtb-primary-hover underline transition-colors">
              политикой конфиденциальности
            </a>{' '}
            и{' '}
            <a href="#" className="text-vtb-primary hover:text-vtb-primary-hover underline transition-colors">
              условиями использования
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'

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

    setLoading(true)
    setError('')

    try {
      // TODO: Добавить API для регистрации
      console.log('Регистрация пользователя:', formData)
      // Здесь будет вызов API
    } catch (err) {
      setError('Ошибка при регистрации')
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
    <div className="min-h-screen bg-gradient-to-br from-vtb-secondary via-white to-vtb-light-gray flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-vtb-primary rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-2xl font-bold">HR</span>
          </div>
          <h2 className="text-3xl font-bold text-vtb-dark-gray">
            Регистрация в HR-системе ВТБ
          </h2>
          <p className="mt-2 text-sm text-vtb-gray">
            Создайте аккаунт для работы с HR-аватаром
          </p>
        </div>

        {/* Форма регистрации */}
        <div className="bg-white shadow-xl rounded-lg p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-vtb-error rounded-lg p-3">
                <p className="text-vtb-error text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                  Имя
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                  Фамилия
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                  placeholder="Введите фамилию"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                Email адрес
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                placeholder="example@vtb.ru"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                Телефон (опционально)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                Роль
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
              >
                <option value="APPLICANT">Соискатель</option>
                <option value="HR">HR-специалист</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                  placeholder="Минимум 8 символов"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-vtb-dark-gray mb-1">
                  Подтвердите пароль
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-transparent transition-colors"
                  placeholder="Повторите пароль"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-vtb-primary hover:bg-vtb-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtb-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-vtb-gray">
                Уже есть аккаунт?{' '}
                <a href="/login" className="font-medium text-vtb-primary hover:text-vtb-primary-dark transition-colors">
                  Войти в систему
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Дополнительная информация */}
        <div className="text-center text-xs text-vtb-gray">
          Регистрируясь, вы соглашаетесь с{' '}
          <a href="#" className="text-vtb-primary hover:underline">политикой конфиденциальности</a>{' '}
          и{' '}
          <a href="#" className="text-vtb-primary hover:underline">условиями использования</a>
        </div>
      </div>
    </div>
  )
}
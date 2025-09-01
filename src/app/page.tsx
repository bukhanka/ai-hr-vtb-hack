import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vtb-secondary via-white to-vtb-light-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-vtb-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">HR</span>
              </div>
              <h1 className="text-xl font-semibold text-vtb-dark-gray">
                HR-Аватар ВТБ
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-vtb-primary hover:text-vtb-primary-dark transition-colors"
              >
                Регистрация
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-vtb-primary text-white text-sm font-medium rounded-lg hover:bg-vtb-primary-dark transition-colors"
              >
                Войти
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="mx-auto h-24 w-24 bg-vtb-primary rounded-full flex items-center justify-center mb-8">
              <span className="text-white text-4xl font-bold">AI</span>
            </div>
            <h1 className="text-4xl font-bold text-vtb-dark-gray mb-4">
              Умный HR-Аватар для ВТБ
            </h1>
            <p className="text-xl text-vtb-gray max-w-3xl mx-auto mb-8">
              Автоматизированная система отбора кандидатов с использованием искусственного интеллекта
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-vtb-primary text-white text-lg font-medium rounded-lg hover:bg-vtb-primary-dark transition-colors shadow-lg"
              >
                Начать работу
              </Link>
              <button className="px-8 py-3 border border-vtb-primary text-vtb-primary text-lg font-medium rounded-lg hover:bg-vtb-primary hover:text-white transition-colors">
                Узнать больше
              </button>
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="h-12 w-12 bg-vtb-accent rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-vtb-dark-gray mb-2">
                Анализ резюме
              </h3>
              <p className="text-vtb-gray">
                Автоматический отбор кандидатов в соответствии с требованиями вакансии
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="h-12 w-12 bg-vtb-accent rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-vtb-dark-gray mb-2">
                AI Собеседования
              </h3>
              <p className="text-vtb-gray">
                Проведение структурированных интервью с динамической адаптацией вопросов
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="h-12 w-12 bg-vtb-accent rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-vtb-dark-gray mb-2">
                Оценка кандидатов
              </h3>
              <p className="text-vtb-gray">
                Количественное оценивание и генерация обоснованных решений по отбору
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="text-center">
            <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-100">
              <div className="h-16 w-16 bg-vtb-warning rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🚧</span>
              </div>
              <h2 className="text-2xl font-bold text-vtb-dark-gray mb-4">
                Система в разработке
              </h2>
              <p className="text-vtb-gray text-lg">
                Мы работаем над созданием инновационного HR-аватара для ВТБ. <br />
                Скоро здесь появится полнофункциональная система отбора кандидатов.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-vtb-dark-gray text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">
              © 2024 ВТБ Хакатон. HR-Аватар - Инновационное решение для подбора персонала.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

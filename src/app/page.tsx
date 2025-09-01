import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SparklesIcon, BuildingIcon, TargetIcon, BrainIcon, BarChartIcon, ConstructionIcon } from "@/components/Icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-vtb-surface border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center shadow-lg">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-vtb-text">
                  HR-Аватар ВТБ
                </h1>
                <p className="text-xs text-vtb-text-secondary">MORE.Tech</p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <ThemeToggle />
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
              >
                Регистрация
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Войти
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="mx-auto h-32 w-32 bg-gradient-to-br from-vtb-primary via-vtb-secondary to-vtb-accent rounded-2xl flex items-center justify-center mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <SparklesIcon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-vtb-text mb-6 leading-tight">
              Умный HR-Аватар<br/>
              <span className="bg-gradient-to-r from-vtb-primary to-vtb-accent bg-clip-text text-transparent">
                для ВТБ
              </span>
            </h1>
            <p className="text-xl text-vtb-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
              Автоматизированная система отбора кандидатов с использованием искусственного интеллекта. 
              Революционный подход к рекрутингу от команды MORE.Tech
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white text-lg font-semibold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-vtb-primary/25"
              >
                Начать работу
              </Link>
              <button className="px-8 py-4 bg-vtb-surface border border-border text-vtb-text text-lg font-semibold rounded-xl hover:bg-muted transition-all duration-200 transform hover:scale-105">
                Узнать больше
              </button>
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 group">
              <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <TargetIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-vtb-text mb-4">
                Анализ резюме
              </h3>
              <p className="text-vtb-text-secondary leading-relaxed">
                Автоматический отбор кандидатов в соответствии с требованиями вакансии. 
                ИИ анализирует навыки, опыт и соответствие позиции.
              </p>
            </div>
            
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 group">
              <div className="h-16 w-16 bg-gradient-to-br from-vtb-secondary to-vtb-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <BrainIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-vtb-text mb-4">
                AI Собеседования
              </h3>
              <p className="text-vtb-text-secondary leading-relaxed">
                Проведение структурированных интервью с динамической адаптацией вопросов. 
                Персонализированный подход к каждому кандидату.
              </p>
            </div>
            
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 group">
              <div className="h-16 w-16 bg-gradient-to-br from-vtb-accent to-vtb-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChartIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-vtb-text mb-4">
                Оценка кандидатов
              </h3>
              <p className="text-vtb-text-secondary leading-relaxed">
                Количественное оценивание и генерация обоснованных решений по отбору. 
                Детальная аналитика и прозрачные метрики.
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="text-center">
            <div className="bg-vtb-surface rounded-3xl p-16 shadow-xl border border-border relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-vtb-primary/5 to-vtb-accent/5 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="h-20 w-20 bg-gradient-to-br from-vtb-warning to-vtb-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <ConstructionIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-vtb-text mb-6">
                  Система в разработке
                </h2>
                <p className="text-vtb-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                  Мы работаем над созданием инновационного HR-аватара для ВТБ. 
                  Скоро здесь появится полнофункциональная система отбора кандидатов 
                  с использованием передовых технологий искусственного интеллекта.
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center space-x-2 text-vtb-text-secondary">
                    <div className="h-2 w-2 bg-vtb-primary rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-vtb-secondary rounded-full animate-pulse delay-100"></div>
                    <div className="h-2 w-2 bg-vtb-accent rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-vtb-surface-secondary border-t border-border py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-3 mb-6">
              <div className="h-8 w-8 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-lg flex items-center justify-center">
                <BuildingIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-vtb-text font-semibold">ВТБ × MORE.Tech</span>
            </div>
            <p className="text-vtb-text-secondary text-sm">
              © 2024 ВТБ Хакатон. HR-Аватар - Инновационное решение для подбора персонала.
            </p>
            <p className="text-vtb-text-secondary text-xs">
              Создано с использованием современных технологий ИИ
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

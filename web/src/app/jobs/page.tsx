'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobCard } from '../../components/JobCard';
import { JobSearch, JobFilters } from '../../components/JobSearch';
import { ThemeToggle } from '../../components/ThemeToggle';
import { BuildingIcon, SparklesIcon } from '../../components/Icons';

interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  salary?: string | null;
  experience?: string | null;
  status: string;
  createdAt: string;
  creatorName?: string;
  applicationsCount?: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFilters, setCurrentFilters] = useState<JobFilters>({
    search: '',
    skills: [],
  });
  const [user, setUser] = useState<any>(null);
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
      }
    };

    fetchUser();
  }, [router]);

  // Загрузка вакансий
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/jobs', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке вакансий');
        }

        const data = await response.json();
        setJobs(data.jobs);
        setFilteredJobs(data.jobs);
      } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        setError('Не удалось загрузить вакансии');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Фильтрация вакансий
  const handleSearch = (filters: JobFilters) => {
    setCurrentFilters(filters);
    
    let filtered = [...jobs];

    // Поиск по тексту
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Фильтр по навыкам
    if (filters.skills.length > 0) {
      filtered = filtered.filter(job =>
        filters.skills.every(filterSkill =>
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }

    // Фильтр по опыту
    if (filters.experience) {
      filtered = filtered.filter(job => 
        job.experience?.toLowerCase().includes(filters.experience!.toLowerCase())
      );
    }

    // Фильтр по зарплате (упрощенный)
    if (filters.salaryMin || filters.salaryMax) {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        
        // Простое извлечение числа из строки зарплаты
        const salaryMatch = job.salary.match(/(\d+)/);
        if (!salaryMatch) return false;
        
        const salary = parseInt(salaryMatch[1]);
        
        if (filters.salaryMin && salary < filters.salaryMin * 1000) return false;
        if (filters.salaryMax && salary > filters.salaryMax * 1000) return false;
        
        return true;
      });
    }

    setFilteredJobs(filtered);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Загрузка вакансий...</p>
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
                  Вакансии ВТБ
                </h1>
                <p className="text-xs text-vtb-text-secondary">
                  {filteredJobs.length} из {jobs.length} вакансий
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
                    href="/my-applications"
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Мои заявки
                  </Link>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-vtb-text-secondary hover:text-vtb-primary transition-colors"
                  >
                    Профиль
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-vtb-text mb-4">
            Найдите свою идеальную работу
          </h1>
          <p className="text-vtb-text-secondary max-w-2xl mx-auto">
            Просматривайте актуальные вакансии ВТБ, подавайте заявки и проходите инновационные AI-собеседования
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <JobSearch
            onSearch={handleSearch}
            initialFilters={currentFilters}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-vtb-error/10 border border-vtb-error/30 rounded-xl p-6 mb-8">
            <p className="text-vtb-error font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {!error && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-vtb-text">
                {currentFilters.search || currentFilters.skills.length > 0 
                  ? 'Результаты поиска' 
                  : 'Все вакансии'
                }
              </h2>
              <div className="text-sm text-vtb-text-secondary">
                Найдено: {filteredJobs.length}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                  <svg className="w-10 h-10 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-vtb-text mb-2">
                  Вакансии не найдены
                </h3>
                <p className="text-vtb-text-secondary mb-4">
                  Попробуйте изменить параметры поиска или сбросить фильтры
                </p>
                <button
                  onClick={() => handleSearch({ search: '', skills: [] })}
                  className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
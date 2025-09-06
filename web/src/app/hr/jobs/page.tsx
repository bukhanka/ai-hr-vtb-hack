'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobCard } from '../../../components/JobCard';
import { JobSearch, JobFilters } from '../../../components/JobSearch';
import { BuildingIcon, PlusIcon, BarChartIcon } from '../../../components/Icons';
import Link from 'next/link';

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

interface Statistics {
  total: number;
  active: number;
  draft: number;
  closed: number;
  totalApplications: number;
}

export default function HRJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    draft: 0,
    closed: 0,
    totalApplications: 0,
  });
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
        if (data.user.role !== 'HR' && data.user.role !== 'ADMIN') {
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

  // Загрузка вакансий
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch('/api/jobs', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке вакансий');
        }

        const data = await response.json();
        setJobs(data.jobs);
        setFilteredJobs(data.jobs);

        // Вычисляем статистику
        const stats = data.jobs.reduce((acc: Statistics, job: Job) => {
          acc.total++;
          acc.totalApplications += job.applicationsCount || 0;
          
          switch (job.status) {
            case 'ACTIVE':
              acc.active++;
              break;
            case 'DRAFT':
              acc.draft++;
              break;
            case 'CLOSED':
              acc.closed++;
              break;
          }
          
          return acc;
        }, { total: 0, active: 0, draft: 0, closed: 0, totalApplications: 0 });

        setStatistics(stats);
      } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        setError('Не удалось загрузить вакансии');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchJobs();
    }
  }, [user]);

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

    // Фильтр по статусу
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    // Фильтр по опыту
    if (filters.experience) {
      filtered = filtered.filter(job => 
        job.experience?.toLowerCase().includes(filters.experience!.toLowerCase())
      );
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-vtb-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-vtb-text-secondary text-sm font-medium">Всего вакансий</p>
                <p className="text-2xl font-bold text-vtb-text">{statistics.total}</p>
              </div>
              <div className="h-12 w-12 bg-vtb-primary/10 rounded-xl flex items-center justify-center">
                <BarChartIcon className="w-6 h-6 text-vtb-primary" />
              </div>
            </div>
          </div>

          <div className="bg-vtb-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-vtb-text-secondary text-sm font-medium">Активные</p>
                <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-vtb-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-vtb-text-secondary text-sm font-medium">Черновики</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.draft}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-vtb-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-vtb-text-secondary text-sm font-medium">Всего откликов</p>
                <p className="text-2xl font-bold text-vtb-accent">{statistics.totalApplications}</p>
              </div>
              <div className="h-12 w-12 bg-vtb-accent/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-vtb-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-vtb-text">Мои вакансии</h2>
            <p className="text-vtb-text-secondary mt-1">
              Управляйте вакансиями и просматривайте отклики кандидатов
            </p>
          </div>
          <Link
            href="/hr/jobs/create"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5" />
            Создать вакансию
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <JobSearch
            onSearch={handleSearch}
            showStatusFilter={true}
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
              <div className="text-sm text-vtb-text-secondary">
                Показано: {filteredJobs.length} из {jobs.length}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                  <BuildingIcon className="w-10 h-10 text-vtb-text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-vtb-text mb-2">
                  {jobs.length === 0 ? 'Пока нет вакансий' : 'Вакансии не найдены'}
                </h3>
                <p className="text-vtb-text-secondary mb-4">
                  {jobs.length === 0 
                    ? 'Создайте первую вакансию для начала поиска кандидатов'
                    : 'Попробуйте изменить параметры поиска или сбросить фильтры'
                  }
                </p>
                <div className="space-x-4">
                  {jobs.length === 0 ? (
                    <Link
                      href="/hr/jobs/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Создать первую вакансию
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSearch({ search: '', skills: [] })}
                      className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all duration-200"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    variant="hr"
                    showStatus={true}
                    showApplicationsCount={true}
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
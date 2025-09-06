'use client';

import { useState } from 'react';
import { JobStatus } from '../generated/prisma';

interface JobSearchProps {
  onSearch: (filters: JobFilters) => void;
  showStatusFilter?: boolean;
  initialFilters?: Partial<JobFilters>;
}

export interface JobFilters {
  search: string;
  skills: string[];
  status?: JobStatus;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
}

export function JobSearch({ onSearch, showStatusFilter = false, initialFilters }: JobSearchProps) {
  const [filters, setFilters] = useState<JobFilters>({
    search: initialFilters?.search || '',
    skills: initialFilters?.skills || [],
    status: initialFilters?.status,
    salaryMin: initialFilters?.salaryMin,
    salaryMax: initialFilters?.salaryMax,
    experience: initialFilters?.experience || '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, search: e.target.value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !filters.skills.includes(skill)) {
      const newFilters = { ...filters, skills: [...filters.skills, skill] };
      setFilters(newFilters);
      setSkillInput('');
      onSearch(newFilters);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newFilters = { ...filters, skills: filters.skills.filter(s => s !== skillToRemove) };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: JobFilters = {
      search: '',
      skills: [],
      status: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      experience: '',
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
    setSkillInput('');
  };

  const hasActiveFilters = filters.search || 
    filters.skills.length > 0 || 
    filters.status || 
    filters.salaryMin || 
    filters.salaryMax || 
    filters.experience;

  return (
    <div className="bg-vtb-surface border border-border rounded-xl p-6 space-y-4">
      {/* Main Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск по названию, описанию, навыкам..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Skills Filter */}
      <div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Добавить навык для поиска..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text text-sm"
          />
          <button
            onClick={addSkill}
            disabled={!skillInput.trim()}
            className="px-4 py-2 bg-vtb-primary text-white text-sm rounded-lg hover:bg-vtb-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            +
          </button>
        </div>
        
        {filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-vtb-accent/10 text-vtb-accent text-sm rounded-lg"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-vtb-accent hover:text-vtb-error transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-2 text-sm text-vtb-primary hover:text-vtb-primary/80 transition-colors"
        >
          <span>Расширенные фильтры</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-vtb-text-secondary hover:text-vtb-error transition-colors"
          >
            Очистить все
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <label className="block text-sm font-medium text-vtb-text mb-1">
                Статус
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text text-sm"
              >
                <option value="">Все статусы</option>
                <option value={JobStatus.ACTIVE}>Активные</option>
                <option value={JobStatus.DRAFT}>Черновики</option>
                <option value={JobStatus.CLOSED}>Закрытые</option>
              </select>
            </div>
          )}

          {/* Experience Filter */}
          <div>
            <label className="block text-sm font-medium text-vtb-text mb-1">
              Опыт работы
            </label>
            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text text-sm"
            >
              <option value="">Любой опыт</option>
              <option value="Без опыта">Без опыта</option>
              <option value="от 1 года">От 1 года</option>
              <option value="от 3 лет">От 3 лет</option>
              <option value="от 5 лет">От 5 лет</option>
            </select>
          </div>

          {/* Salary Range */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-vtb-text mb-1">
              Зарплата (тыс. руб.)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="От"
                value={filters.salaryMin || ''}
                onChange={(e) => handleFilterChange('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text text-sm"
              />
              <input
                type="number"
                placeholder="До"
                value={filters.salaryMax || ''}
                onChange={(e) => handleFilterChange('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-vtb-surface focus:outline-none focus:ring-2 focus:ring-vtb-primary focus:border-vtb-primary transition-all duration-200 text-vtb-text text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
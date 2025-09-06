'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScoreDisplay, ScoreBar } from './ScoreDisplay';
import { UserIcon, ChartBarIcon, CalendarIcon, EyeIcon } from './Icons';

interface Candidate {
  id: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  assessment?: {
    id: string;
    overallScore: number;
    technicalScore?: number;
    softSkillsScore?: number;
    communicationScore?: number;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
  };
  latestResume?: {
    skills: string[];
    experience?: number;
    education?: string;
  };
}

interface CandidateListProps {
  candidates: Candidate[];
  jobId?: string;
  loading?: boolean;
  sortBy?: 'score' | 'date' | 'name';
  onSortChange?: (sortBy: 'score' | 'date' | 'name') => void;
}

export function CandidateList({ 
  candidates, 
  jobId,
  loading = false,
  sortBy = 'score',
  onSortChange 
}: CandidateListProps) {
  const [filter, setFilter] = useState<'all' | 'hire' | 'reject' | 'pending'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'IN_PROGRESS':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Запланировано';
      case 'IN_PROGRESS':
        return 'Идёт интервью';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return 'success';
      case 'REJECT':
        return 'danger';
      case 'REQUIRES_CLARIFICATION':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return 'Рекомендован';
      case 'REJECT':
        return 'Отклонен';
      case 'REQUIRES_CLARIFICATION':
        return 'Требует уточнения';
      default:
        return recommendation;
    }
  };

  // Фильтрация кандидатов
  const filteredCandidates = candidates.filter(candidate => {
    if (filter === 'all') return true;
    
    const recommendation = candidate.assessment?.recommendation;
    switch (filter) {
      case 'hire':
        return recommendation === 'HIRE';
      case 'reject':
        return recommendation === 'REJECT';
      case 'pending':
        return !recommendation || recommendation === 'REQUIRES_CLARIFICATION';
      default:
        return true;
    }
  });

  // Сортировка кандидатов
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const scoreA = a.assessment?.overallScore || 0;
        const scoreB = b.assessment?.overallScore || 0;
        return scoreB - scoreA;
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
        return `${a.applicant.firstName} ${a.applicant.lastName}`.localeCompare(
          `${b.applicant.firstName} ${b.applicant.lastName}`
        );
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-vtb-surface rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-vtb-primary text-white' 
                : 'bg-vtb-surface-secondary text-vtb-text hover:bg-muted'
            }`}
          >
            Все ({candidates.length})
          </button>
          <button
            onClick={() => setFilter('hire')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'hire' 
                ? 'bg-green-500 text-white' 
                : 'bg-vtb-surface-secondary text-vtb-text hover:bg-muted'
            }`}
          >
            К найму ({candidates.filter(c => c.assessment?.recommendation === 'HIRE').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-vtb-surface-secondary text-vtb-text hover:bg-muted'
            }`}
          >
            Рассмотреть ({candidates.filter(c => !c.assessment?.recommendation || c.assessment.recommendation === 'REQUIRES_CLARIFICATION').length})
          </button>
          <button
            onClick={() => setFilter('reject')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'reject' 
                ? 'bg-red-500 text-white' 
                : 'bg-vtb-surface-secondary text-vtb-text hover:bg-muted'
            }`}
          >
            Отклонить ({candidates.filter(c => c.assessment?.recommendation === 'REJECT').length})
          </button>
        </div>

        {/* Sort */}
        {onSortChange && (
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-lg bg-white text-vtb-text text-sm"
            >
              <option value="score">По баллу</option>
              <option value="date">По дате</option>
              <option value="name">По имени</option>
            </select>
          </div>
        )}
      </div>

      {/* Candidates List */}
      {sortedCandidates.length === 0 ? (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-vtb-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
            <UserIcon className="w-8 h-8 text-vtb-text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-vtb-text mb-2">
            {filter === 'all' ? 'Нет кандидатов' : 'Нет кандидатов по выбранному фильтру'}
          </h3>
          <p className="text-vtb-text-secondary">
            {filter === 'all' 
              ? 'Когда кандидаты откликнутся на вакансию, они появятся здесь'
              : 'Попробуйте изменить фильтр или критерии поиска'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 bg-vtb-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 text-vtb-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-vtb-text mb-1">
                        {candidate.applicant.firstName} {candidate.applicant.lastName}
                      </h3>
                      <p className="text-vtb-text-secondary text-sm mb-2">
                        {candidate.applicant.email}
                      </p>
                      {candidate.applicant.phone && (
                        <p className="text-vtb-text-secondary text-sm">
                          {candidate.applicant.phone}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                      {getStatusText(candidate.status)}
                    </div>
                  </div>

                  {/* Resume Info */}
                  {candidate.latestResume && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-4 h-4 text-vtb-secondary" />
                        <span className="text-sm font-medium text-vtb-text">Профиль</span>
                      </div>
                      <div className="text-sm text-vtb-text-secondary space-y-1">
                        {candidate.latestResume.experience && (
                          <p>Опыт: {candidate.latestResume.experience} лет</p>
                        )}
                        {candidate.latestResume.education && (
                          <p>Образование: {candidate.latestResume.education}</p>
                        )}
                        {candidate.latestResume.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.latestResume.skills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-vtb-primary/10 text-vtb-primary text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.latestResume.skills.length > 5 && (
                              <span className="text-xs text-vtb-text-secondary">
                                +{candidate.latestResume.skills.length - 5} еще
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date Info */}
                  <div className="flex items-center gap-2 text-sm text-vtb-text-secondary">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Подал заявку: {formatDate(candidate.createdAt)}</span>
                  </div>
                </div>

                {/* Assessment Score */}
                <div className="lg:w-64 flex lg:flex-col items-center lg:items-end gap-4">
                  {candidate.assessment ? (
                    <div className="text-center lg:text-right">
                      <ScoreDisplay
                        score={candidate.assessment.overallScore}
                        size="md"
                        showLabel={false}
                        color={getRecommendationColor(candidate.assessment.recommendation) as any}
                      />
                      <div className={`mt-3 px-3 py-1 rounded-lg text-sm font-medium inline-block border
                        ${candidate.assessment.recommendation === 'HIRE' 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : candidate.assessment.recommendation === 'REJECT'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                        {getRecommendationText(candidate.assessment.recommendation)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center lg:text-right text-vtb-text-secondary">
                      <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <p className="text-sm">Ожидает оценки</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/hr/interviews/${candidate.id}/report`}
                    className="px-4 py-2 bg-vtb-primary text-white rounded-lg hover:bg-vtb-primary/90 transition-colors flex items-center gap-2 text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Подробнее
                  </Link>
                </div>
              </div>

              {/* Detailed Scores */}
              {candidate.assessment && (candidate.assessment.technicalScore || candidate.assessment.softSkillsScore || candidate.assessment.communicationScore) && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-vtb-text mb-3">Детальная оценка</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {candidate.assessment.technicalScore && (
                      <ScoreBar
                        score={candidate.assessment.technicalScore}
                        label="Технические навыки"
                        color="primary"
                        height="sm"
                      />
                    )}
                    {candidate.assessment.softSkillsScore && (
                      <ScoreBar
                        score={candidate.assessment.softSkillsScore}
                        label="Soft Skills"
                        color="success"
                        height="sm"
                      />
                    )}
                    {candidate.assessment.communicationScore && (
                      <ScoreBar
                        score={candidate.assessment.communicationScore}
                        label="Коммуникация"
                        color="warning"
                        height="sm"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
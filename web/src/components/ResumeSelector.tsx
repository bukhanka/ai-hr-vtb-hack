'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon, ClockIcon, ChevronLeftIcon } from './Icons';

interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  aiSummary?: string;
  skills: string[];
  experience?: number;
  education?: string;
  matchScore: number;
  matchDetails: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    confidence: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'WEAK_MATCH' | 'NO_MATCH';
  reasoningNotes: string;
}

interface Job {
  id: string;
  title: string;
  skills: string[];
}

interface ResumeSelectorProps {
  jobId: string;
  onResumeSelect: (resumeId: string, resumeData: Resume) => void;
  className?: string;
}

export default function ResumeSelector({ jobId, onResumeSelect, className = '' }: ResumeSelectorProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumeMatch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/jobs/${jobId}/resume-match`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка при анализе резюме');
        }

        setJob(data.job);
        setResumes(data.resumes || []);
        
        // Автоматически выбираем лучшее резюме
        if (data.bestResume) {
          setSelectedResumeId(data.bestResume.id);
        }

      } catch (error) {
        console.error('Ошибка загрузки анализа резюме:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchResumeMatch();
    }
  }, [jobId]);

  const handleResumeSelect = (resume: Resume) => {
    setSelectedResumeId(resume.id);
    onResumeSelect(resume.id, resume);
  };

  const getRecommendationColor = (recommendation: Resume['recommendation']) => {
    switch (recommendation) {
      case 'STRONG_MATCH': return 'text-green-600 bg-green-50';
      case 'GOOD_MATCH': return 'text-blue-600 bg-blue-50';
      case 'WEAK_MATCH': return 'text-yellow-600 bg-yellow-50';
      case 'NO_MATCH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationText = (recommendation: Resume['recommendation']) => {
    switch (recommendation) {
      case 'STRONG_MATCH': return 'Отличное соответствие';
      case 'GOOD_MATCH': return 'Хорошее соответствие';
      case 'WEAK_MATCH': return 'Слабое соответствие';
      case 'NO_MATCH': return 'Не подходит';
      default: return 'Неизвестно';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`resume-selector ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Анализируем соответствие ваших резюме...</span>
          </div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-4 bg-gray-50">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`resume-selector ${className}`}>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <XMarkIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className={`resume-selector ${className}`}>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-600 mb-4">
            У вас нет обработанных резюме для анализа соответствия
          </div>
          <a 
            href="/profile/resume" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            Загрузить резюме
            <ChevronLeftIcon className="w-4 h-4 rotate-180" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`resume-selector space-y-4 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Выберите резюме для отклика
        </h3>
        <p className="text-sm text-gray-600">
          Мы проанализировали соответствие ваших резюме вакансии &quot;{job?.title}&quot;
        </p>
      </div>

      <div className="space-y-4">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedResumeId === resume.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => handleResumeSelect(resume)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {resume.fileName}
                  </h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(resume.recommendation)}`}>
                    {getRecommendationText(resume.recommendation)}
                  </div>
                </div>

                {resume.aiSummary && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {resume.aiSummary}
                  </p>
                )}
              </div>

              <div className="text-right ml-4">
                <div className={`text-2xl font-bold ${getScoreColor(resume.matchScore)}`}>
                  {resume.matchScore}%
                </div>
                <div className="text-xs text-gray-500">соответствие</div>
              </div>
            </div>

            {/* Детальные метрики */}
            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
              <div className="text-center">
                <div className={`font-medium ${getScoreColor(resume.matchDetails.skillsMatch)}`}>
                  {Math.round(resume.matchDetails.skillsMatch)}%
                </div>
                <div className="text-xs text-gray-500">навыки</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getScoreColor(resume.matchDetails.experienceMatch)}`}>
                  {Math.round(resume.matchDetails.experienceMatch)}%
                </div>
                <div className="text-xs text-gray-500">опыт</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getScoreColor(resume.matchDetails.educationMatch)}`}>
                  {Math.round(resume.matchDetails.educationMatch)}%
                </div>
                <div className="text-xs text-gray-500">образование</div>
              </div>
            </div>

            {/* Совпадающие навыки */}
            {resume.matchedSkills.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">Совпадающие навыки:</div>
                <div className="flex flex-wrap gap-1">
                  {resume.matchedSkills.slice(0, 5).map((skill, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {resume.matchedSkills.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{resume.matchedSkills.length - 5} еще
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Отсутствующие навыки */}
            {resume.missingSkills.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">Требуется изучить:</div>
                <div className="flex flex-wrap gap-1">
                  {resume.missingSkills.slice(0, 3).map((skill, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {resume.missingSkills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{resume.missingSkills.length - 3} еще
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Обоснование */}
            {resume.reasoningNotes && (
              <div className="text-xs text-gray-600 italic mt-2 p-2 bg-gray-50 rounded">
                {resume.reasoningNotes}
              </div>
            )}

            {/* Индикатор выбора */}
            {selectedResumeId === resume.id && (
              <div className="flex items-center gap-2 mt-3 text-blue-600">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Выбрано для отклика</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {resumes.length > 0 && (
        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
          💡 Совет: Выберите резюме с наивысшим процентом соответствия для увеличения шансов на успех
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { UserIcon, BriefcaseIcon, AcademicCapIcon, DocumentIcon, EyeIcon } from './Icons';

interface ResumePreviewProps {
  resume: {
    id: string;
    fileName: string;
    content?: string;
    rawContent?: string;
    skills: string[];
    experience?: number;
    education?: string;
    uploadedAt: string;
    parsedData?: any;
    aiSummary?: string;
    matchScore?: number;
    processingStatus?: string;
    analyzedAt?: string;
  };
  onViewFull: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumePreview({ resume, onViewFull, onEdit, onDelete }: ResumePreviewProps) {
  const getStatusInfo = () => {
    switch (resume.processingStatus) {
      case 'PENDING':
        return { text: '⏳ Ожидает анализа', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'PROCESSING':
        return { text: '🔄 Анализируется...', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'COMPLETED':
        return { text: '✅ AI анализ завершен', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'FAILED':
        return { text: '❌ Ошибка анализа', color: 'text-red-600 bg-red-50 border-red-200' };
      default:
        return { text: '📄 Базовое резюме', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const statusInfo = getStatusInfo();
  const hasAIData = resume.parsedData && resume.processingStatus === 'COMPLETED';

  return (
    <div className="bg-vtb-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-vtb-primary/10 rounded-lg">
            <DocumentIcon className="w-5 h-5 text-vtb-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-vtb-text truncate">
              {resume.fileName}
            </h3>
            <p className="text-sm text-vtb-text-secondary">
              Загружено: {new Date(resume.uploadedAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
      </div>

      {/* AI Summary Preview */}
      {hasAIData && resume.aiSummary && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                AI Резюме профиля
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-2">
                {resume.aiSummary}
              </p>
              {resume.matchScore && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-blue-700 dark:text-blue-300">Полнота профиля:</span>
                  <div className="flex-1 bg-blue-200 dark:bg-blue-700 rounded-full h-1.5 max-w-24">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${resume.matchScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    {resume.matchScore}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Skills Preview */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4 text-vtb-text-secondary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-vtb-text-secondary mb-1">Навыки</p>
              <div className="flex flex-wrap gap-1">
                {resume.skills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-vtb-surface-secondary text-xs text-vtb-text rounded"
                  >
                    {skill}
                  </span>
                ))}
                {resume.skills.length > 3 && (
                  <span className="px-2 py-1 bg-vtb-surface-secondary text-xs text-vtb-text-secondary rounded">
                    +{resume.skills.length - 3} еще
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Experience */}
        {resume.experience !== null && resume.experience !== undefined && (
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4 text-vtb-text-secondary" />
            <div>
              <p className="text-xs text-vtb-text-secondary">Опыт</p>
              <p className="text-sm font-medium text-vtb-text">
                {resume.experience} {resume.experience === 1 ? 'год' : resume.experience < 5 ? 'года' : 'лет'}
              </p>
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education && (
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-4 h-4 text-vtb-text-secondary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-vtb-text-secondary">Образование</p>
              <p className="text-sm text-vtb-text truncate">
                {resume.education}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Preview */}
      {hasAIData && resume.parsedData && (
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Seniority Level */}
            {resume.parsedData.seniorityLevel && (
              <div>
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">Уровень:</span>
                <span className="ml-1 text-indigo-800 dark:text-indigo-200">
                  {resume.parsedData.seniorityLevel}
                </span>
              </div>
            )}

            {/* Key Strengths Preview */}
            {resume.parsedData.keyStrengths && resume.parsedData.keyStrengths.length > 0 && (
              <div>
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">Сильные стороны:</span>
                <span className="ml-1 text-indigo-800 dark:text-indigo-200">
                  {resume.parsedData.keyStrengths.slice(0, 2).join(', ')}
                  {resume.parsedData.keyStrengths.length > 2 && '...'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm bg-vtb-primary/10 text-vtb-primary rounded-lg hover:bg-vtb-primary/20 transition-colors"
          >
            Редактировать
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            Удалить
          </button>
        </div>

        {hasAIData && (
          <button
            onClick={onViewFull}
            className="flex items-center gap-2 px-4 py-2 bg-vtb-primary text-white text-sm font-medium rounded-lg hover:bg-vtb-primary-hover transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            Полный анализ
          </button>
        )}
      </div>
    </div>
  );
}

// CSS для line-clamp (если не настроен в Tailwind)
const style = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('resume-preview-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'resume-preview-styles';
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}
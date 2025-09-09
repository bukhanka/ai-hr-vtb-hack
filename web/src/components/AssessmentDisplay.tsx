'use client';

import { BarChartIcon } from './Icons';

interface Assessment {
  id: string;
  // Связь с фреймворком оценки
  frameworkId?: string | null;
  framework?: {
    name: string;
    version: string;
  } | null;
  
  // Динамические результаты по критериям
  scores: Record<string, any>; // JSON поле с динамическими критериями
  overallScore: number;
  
  // Результаты анализа
  analysisResults?: any; // JSON поле с полными результатами от Gemini
  recommendation: string; // "HIRE", "REJECT", "REQUIRES_CLARIFICATION"
  
  // Обратная связь
  feedback?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  redFlags?: string[];
  notes?: string | null;
  
  // Мета-информация
  analysisStatus: string; // "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"
  confidence?: number | null; // Уверенность AI в оценке (0-100)
  processingTime?: number | null; // Время анализа в секундах
  
  // Совместимость с текущей системой
  technicalScore?: number | null;
  softSkillsScore?: number | null;
  communicationScore?: number | null;
  
  createdAt: string;
}

interface AssessmentDisplayProps {
  assessment: Assessment;
  className?: string;
  compact?: boolean; // Компактный режим для отображения в карточках
}

export function AssessmentDisplay({ assessment, className = '', compact = false }: AssessmentDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return { label: 'Нанять', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' };
      case 'REJECT':
        return { label: 'Отклонить', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' };
      case 'REQUIRES_CLARIFICATION':
        return { label: 'Требует уточнения', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' };
      default:
        return { label: recommendation, color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };
    }
  };

  const getAnalysisStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Ожидает', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };
      case 'IN_PROGRESS':
        return { label: 'Анализируется', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' };
      case 'COMPLETED':
        return { label: 'Завершен', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' };
      case 'FAILED':
        return { label: 'Ошибка', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' };
      default:
        return { label: status, color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };
    }
  };

  const rec = getRecommendationLabel(assessment.recommendation);
  const analysisStatus = getAnalysisStatusLabel(assessment.analysisStatus);

  // Извлекаем динамические критерии из scores
  const dynamicScores = Object.entries(assessment.scores || {})
    .filter(([key, value]) => value && typeof value === 'object' && value.score !== undefined)
    .map(([key, value]) => ({
      name: key,
      score: value.score,
      label: value.label || key,
      description: value.description
    }));

  return (
    <div className={`border-t border-border pt-4 ${className}`}>
      {/* Основные показатели */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-vtb-primary" />
          <span className="text-sm font-medium text-vtb-text">Общий балл:</span>
          <span className={`text-lg font-bold ${getScoreColor(assessment.overallScore)}`}>
            {assessment.overallScore}%
          </span>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${rec.color}`}>
          {rec.label}
        </span>

        <span className={`px-3 py-1 rounded-full text-xs font-medium ${analysisStatus.color}`}>
          {analysisStatus.label}
        </span>
      </div>

      {/* В компактном режиме показываем только основные категории */}
      {compact && (assessment.technicalScore || assessment.softSkillsScore || assessment.communicationScore) && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {assessment.technicalScore && (
            <div className="text-center p-2 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
              <p className="text-xs text-vtb-text-secondary">Техническая</p>
              <p className={`text-sm font-semibold ${getScoreColor(assessment.technicalScore)}`}>
                {assessment.technicalScore}%
              </p>
            </div>
          )}
          {assessment.softSkillsScore && (
            <div className="text-center p-2 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
              <p className="text-xs text-vtb-text-secondary">Soft Skills</p>
              <p className={`text-sm font-semibold ${getScoreColor(assessment.softSkillsScore)}`}>
                {assessment.softSkillsScore}%
              </p>
            </div>
          )}
          {assessment.communicationScore && (
            <div className="text-center p-2 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
              <p className="text-xs text-vtb-text-secondary">Коммуникация</p>
              <p className={`text-sm font-semibold ${getScoreColor(assessment.communicationScore)}`}>
                {assessment.communicationScore}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Остальное содержимое только в полном режиме */}
      {!compact && (
        <>

      {/* Мета-информация */}
      {(assessment.confidence || assessment.processingTime || assessment.framework) && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-vtb-text-secondary">
          {assessment.confidence && (
            <div className="flex items-center gap-1">
              <span>Уверенность:</span>
              <span className="font-medium">{assessment.confidence}%</span>
            </div>
          )}
          {assessment.processingTime && (
            <div className="flex items-center gap-1">
              <span>Время анализа:</span>
              <span className="font-medium">{assessment.processingTime} сек</span>
            </div>
          )}
          {assessment.framework && (
            <div className="flex items-center gap-1">
              <span>Фреймворк:</span>
              <span className="font-medium">{assessment.framework.name} v{assessment.framework.version}</span>
            </div>
          )}
        </div>
      )}

      {/* Динамические критерии */}
      {dynamicScores.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-vtb-text mb-2">Оценки по критериям:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dynamicScores.map((criteria) => (
              <div key={criteria.name} className="text-center p-3 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
                <p className="text-sm text-vtb-text-secondary capitalize">
                  {criteria.label}
                </p>
                <p className={`text-lg font-semibold ${getScoreColor(criteria.score)}`}>
                  {criteria.score}%
                </p>
                {criteria.description && (
                  <p className="text-xs text-vtb-text-secondary mt-1">
                    {criteria.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Совместимость: старые поля */}
      {(assessment.technicalScore || assessment.softSkillsScore || assessment.communicationScore) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-vtb-text mb-2">Базовые оценки:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assessment.technicalScore && (
              <div className="text-center p-3 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
                <p className="text-sm text-vtb-text-secondary">Техническая</p>
                <p className={`text-lg font-semibold ${getScoreColor(assessment.technicalScore)}`}>
                  {assessment.technicalScore}%
                </p>
              </div>
            )}
            {assessment.softSkillsScore && (
              <div className="text-center p-3 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
                <p className="text-sm text-vtb-text-secondary">Soft Skills</p>
                <p className={`text-lg font-semibold ${getScoreColor(assessment.softSkillsScore)}`}>
                  {assessment.softSkillsScore}%
                </p>
              </div>
            )}
            {assessment.communicationScore && (
              <div className="text-center p-3 bg-vtb-surface-secondary dark:bg-gray-800 rounded-lg border border-border">
                <p className="text-sm text-vtb-text-secondary">Коммуникация</p>
                <p className={`text-lg font-semibold ${getScoreColor(assessment.communicationScore)}`}>
                  {assessment.communicationScore}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Сильные стороны, слабости и красные флаги */}
      {((assessment.strengths?.length || 0) > 0 || (assessment.weaknesses?.length || 0) > 0 || (assessment.redFlags?.length || 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
          {(assessment.strengths?.length || 0) > 0 && (
            <div>
              <p className="font-medium text-green-700 dark:text-green-400 mb-2">✅ Сильные стороны:</p>
              <ul className="space-y-1">
                {assessment.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-vtb-text-secondary">• {strength}</li>
                ))}
              </ul>
            </div>
          )}
          
          {(assessment.weaknesses?.length || 0) > 0 && (
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-400 mb-2">⚠️ Области развития:</p>
              <ul className="space-y-1">
                {assessment.weaknesses?.map((weakness, idx) => (
                  <li key={idx} className="text-vtb-text-secondary">• {weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {(assessment.redFlags?.length || 0) > 0 && (
            <div>
              <p className="font-medium text-red-700 dark:text-red-400 mb-2">🚩 Красные флаги:</p>
              <ul className="space-y-1">
                {assessment.redFlags?.map((flag, idx) => (
                  <li key={idx} className="text-vtb-text-secondary">• {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Обратная связь */}
      {assessment.feedback && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Обратная связь:</span> {assessment.feedback}
          </p>
        </div>
      )}

      {/* Заметки */}
      {assessment.notes && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-medium">Заметки:</span> {assessment.notes}
          </p>
        </div>
      )}

      {/* Детали анализа (для отладки) */}
      {assessment.analysisResults && process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-sm text-vtb-text-secondary cursor-pointer hover:text-vtb-primary transition-colors duration-200 flex items-center gap-2">
            <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Детали анализа (для разработки)
          </summary>
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-40 whitespace-pre-wrap">
              {JSON.stringify(assessment.analysisResults, null, 2)}
            </pre>
          </div>
        </details>
      )}
        </>
      )}
    </div>
  );
}
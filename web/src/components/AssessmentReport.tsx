'use client';

import { ScoreDisplay, ScoreBar, MultiScoreDisplay } from './ScoreDisplay';
import { UserIcon, ChartBarIcon, DocumentIcon, CalendarIcon } from './Icons';

interface Assessment {
  id: string;
  overallScore: number;
  technicalScore?: number;
  softSkillsScore?: number;
  communicationScore?: number;
  recommendation: string;
  feedback?: string;
  strengths: string[];
  weaknesses: string[];
  notes?: string;
  createdAt: string;
  assessor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AssessmentReportProps {
  assessment: Assessment;
  candidateName?: string;
  jobTitle?: string;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  compact?: boolean;
}

export function AssessmentReport({
  assessment,
  candidateName,
  jobTitle,
  showActions = false,
  onApprove,
  onReject,
  compact = false
}: AssessmentReportProps) {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '✅'
        };
      case 'REJECT':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: '❌'
        };
      case 'REQUIRES_CLARIFICATION':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '⚠️'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '❓'
        };
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'HIRE':
        return 'Рекомендован к найму';
      case 'REJECT':
        return 'Не рекомендован';
      case 'REQUIRES_CLARIFICATION':
        return 'Требует дополнительного рассмотрения';
      default:
        return recommendation;
    }
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const recommendationStyle = getRecommendationColor(assessment.recommendation);

  // Prepare scores for MultiScoreDisplay
  const detailedScores = [];
  if (assessment.technicalScore) {
    detailedScores.push({
      label: 'Технические навыки',
      score: assessment.technicalScore,
      color: getScoreColor(assessment.technicalScore)
    });
  }
  if (assessment.softSkillsScore) {
    detailedScores.push({
      label: 'Soft Skills',
      score: assessment.softSkillsScore,
      color: getScoreColor(assessment.softSkillsScore)
    });
  }
  if (assessment.communicationScore) {
    detailedScores.push({
      label: 'Коммуникативные навыки',
      score: assessment.communicationScore,
      color: getScoreColor(assessment.communicationScore)
    });
  }

  if (compact) {
    return (
      <div className="bg-vtb-surface rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vtb-text">Результаты AI-оценки</h3>
          <ScoreDisplay
            score={assessment.overallScore}
            size="sm"
            color={getScoreColor(assessment.overallScore)}
          />
        </div>
        
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${recommendationStyle.bg} ${recommendationStyle.text} ${recommendationStyle.border} mb-4`}>
          <span>{recommendationStyle.icon}</span>
          {getRecommendationText(assessment.recommendation)}
        </div>

        {assessment.feedback && (
          <p className="text-sm text-vtb-text-secondary bg-gray-50 p-3 rounded-lg">
            {assessment.feedback}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-vtb-primary" />
              <h2 className="text-2xl font-bold text-vtb-text">AI-Оценка кандидата</h2>
            </div>
            {candidateName && (
              <p className="text-lg text-vtb-text-secondary">
                {candidateName} {jobTitle && `· ${jobTitle}`}
              </p>
            )}
            <p className="text-sm text-vtb-text-secondary mt-2">
              Оценка проведена: {formatDate(assessment.createdAt)}
            </p>
          </div>
          
          <div className="text-center lg:text-right">
            <ScoreDisplay
              score={assessment.overallScore}
              size="lg"
              color={getScoreColor(assessment.overallScore)}
              label="Общий балл"
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-6">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-lg font-semibold border ${recommendationStyle.bg} ${recommendationStyle.text} ${recommendationStyle.border}`}>
            <span className="text-2xl">{recommendationStyle.icon}</span>
            {getRecommendationText(assessment.recommendation)}
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      {detailedScores.length > 0 && (
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
          <h3 className="text-xl font-semibold text-vtb-text mb-6">Детальная разбивка по навыкам</h3>
          <MultiScoreDisplay scores={detailedScores} />
        </div>
      )}

      {/* Feedback */}
      {assessment.feedback && (
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <DocumentIcon className="w-6 h-6 text-vtb-secondary" />
            <h3 className="text-xl font-semibold text-vtb-text">Обратная связь</h3>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-vtb-text leading-relaxed">
              {assessment.feedback}
            </p>
          </div>
        </div>
      )}

      {/* Strengths and Weaknesses */}
      {(assessment.strengths.length > 0 || assessment.weaknesses.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          {assessment.strengths.length > 0 && (
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
                <span className="text-xl">✅</span>
                Сильные стороны
              </h3>
              <ul className="space-y-3">
                {assessment.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-vtb-text">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {assessment.weaknesses.length > 0 && (
            <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Области для развития
              </h3>
              <ul className="space-y-3">
                {assessment.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-vtb-text">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Additional Notes */}
      {assessment.notes && (
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-vtb-text mb-4">Дополнительные заметки</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
            <p className="text-vtb-text text-sm leading-relaxed">
              {assessment.notes}
            </p>
          </div>
        </div>
      )}

      {/* Assessor Info */}
      {assessment.assessor && (
        <div className="text-center text-sm text-vtb-text-secondary">
          <div className="flex items-center justify-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span>
              Оценка проведена: {assessment.assessor.firstName} {assessment.assessor.lastName}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (onApprove || onReject) && (
        <div className="bg-vtb-surface rounded-2xl p-8 shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-vtb-text mb-4">Финальное решение HR</h3>
          <p className="text-vtb-text-secondary mb-6">
            Подтвердите решение по данному кандидату на основе AI-оценки
          </p>
          <div className="flex gap-4">
            {onApprove && (
              <button
                onClick={onApprove}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                ✅ Одобрить кандидата
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                ❌ Отклонить кандидата
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
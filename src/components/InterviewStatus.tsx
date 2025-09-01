'use client';

import { ClockIcon } from './Icons';

type InterviewStatusType = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface InterviewStatusProps {
  status: InterviewStatusType;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InterviewStatus({
  status,
  scheduledAt,
  startedAt,
  endedAt,
  showDetails = false,
  size = 'md'
}: InterviewStatusProps) {
  const getStatusInfo = (status: InterviewStatusType) => {
    switch (status) {
      case 'SCHEDULED':
        return {
          label: 'Запланировано',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '📅',
          description: 'Ожидается проведение AI-интервью'
        };
      case 'IN_PROGRESS':
        return {
          label: 'В процессе',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '🎤',
          description: 'AI-интервью в процессе'
        };
      case 'COMPLETED':
        return {
          label: 'Завершено',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          description: 'Интервью завершено, результат готов'
        };
      case 'CANCELLED':
        return {
          label: 'Отменено',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          description: 'Интервью отменено'
        };
      default:
        return {
          label: 'Неизвестно',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓',
          description: ''
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          badge: 'px-2 py-1 text-xs',
          icon: 'text-sm'
        };
      case 'lg':
        return {
          badge: 'px-4 py-2 text-base',
          icon: 'text-xl'
        };
      default:
        return {
          badge: 'px-3 py-1.5 text-sm',
          icon: 'text-base'
        };
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `сегодня в ${date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusInfo = getStatusInfo(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 border rounded-full font-medium transition-all duration-200 ${statusInfo.color} ${sizeClasses.badge}`}>
        <span className={sizeClasses.icon}>{statusInfo.icon}</span>
        <span>{statusInfo.label}</span>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-sm text-vtb-text-secondary space-y-1">
          {statusInfo.description && (
            <p className="italic">{statusInfo.description}</p>
          )}
          
          {scheduledAt && status === 'SCHEDULED' && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>Запланировано на {formatDateTime(scheduledAt)}</span>
            </div>
          )}

          {startedAt && status !== 'SCHEDULED' && (
            <div className="flex items-center gap-1">
              <span>▶️</span>
              <span>Начато {formatDateTime(startedAt)}</span>
            </div>
          )}

          {endedAt && status === 'COMPLETED' && (
            <div className="flex items-center gap-1">
              <span>🏁</span>
              <span>Завершено {formatDateTime(endedAt)}</span>
            </div>
          )}

          {startedAt && endedAt && (
            <div className="text-xs opacity-75">
              Длительность: {Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / (1000 * 60))} мин
            </div>
          )}
        </div>
      )}
    </div>
  );
}
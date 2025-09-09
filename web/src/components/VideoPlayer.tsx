'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, XMarkIcon } from './Icons';

interface VideoPlayerProps {
  interviewId: string;
  candidateName: string;
  jobTitle: string;
  onClose?: () => void;
  className?: string;
}

interface VideoData {
  videoUrl: string | null;
  isAvailable: boolean;
  status: string;
  interview: {
    id: string;
    status: string;
    startedAt?: string;
    endedAt?: string;
    job: {
      title: string;
    };
    applicant: {
      name: string;
    };
  };
}

interface VideoElementProps {
  videoUrl: string;
  onLoadedMetadata: (duration: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onVolumeChange: (volume: number) => void;
}

function VideoElement({ 
  videoUrl, 
  onLoadedMetadata, 
  onTimeUpdate, 
  onPlay, 
  onPause, 
  onVolumeChange 
}: VideoElementProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (videoUrl.startsWith('/api/video-proxy/')) {
          // Для нашего прокси API используем его напрямую с заголовками
          const token = localStorage.getItem('auth-token');
          
          // Создаем URL с токеном как query параметром для video element
          const videoUrlWithAuth = `${videoUrl}?auth=${encodeURIComponent(token || '')}`;
          setVideoSrc(videoUrlWithAuth);
        } else {
          // Для прямых URL просто используем их
          setVideoSrc(videoUrl);
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setError('Ошибка при загрузке видео');
      } finally {
        setLoading(false);
      }
    };

    if (videoUrl) {
      loadVideo();
    }

    // Cleanup
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-white text-sm">Загрузка видео...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-auto"
      src={videoSrc}
      controls
      preload="metadata"
      crossOrigin="anonymous"
      onLoadedMetadata={(e) => {
        const video = e.target as HTMLVideoElement;
        onLoadedMetadata(video.duration);
      }}
      onTimeUpdate={(e) => {
        const video = e.target as HTMLVideoElement;
        onTimeUpdate(video.currentTime);
      }}
      onPlay={onPlay}
      onPause={onPause}
      onVolumeChange={(e) => {
        const video = e.target as HTMLVideoElement;
        onVolumeChange(video.volume);
      }}
      onError={(e) => {
        console.error('Video playback error:', e);
        setError('Ошибка воспроизведения видео');
      }}
    >
      Ваш браузер не поддерживает воспроизведение видео.
    </video>
  );
}

export default function VideoPlayer({ 
  interviewId, 
  candidateName, 
  jobTitle, 
  onClose,
  className = ""
}: VideoPlayerProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Загрузка данных о видео
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        
        const response = await fetch(`/api/interviews/${interviewId}/video`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при загрузке видео');
        }

        const data = await response.json();
        console.log('VideoPlayer: Received data from API:', data);
        console.log('VideoPlayer: videoUrl:', data.videoUrl);
        console.log('VideoPlayer: isAvailable:', data.isAvailable);
        setVideoData(data);
      } catch (error) {
        console.error('Error fetching video data:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке видео');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [interviewId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
            <p className="text-vtb-text-secondary">Загрузка видеозаписи...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className={`bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 bg-vtb-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-vtb-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-vtb-text mb-2">Видеозапись недоступна</h3>
            <p className="text-vtb-text-secondary text-sm">{error || 'Произошла ошибка при загрузке'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoData?.isAvailable || !videoData?.videoUrl) {
    const statusText = {
      'SCHEDULED': 'Интервью еще не началось',
      'IN_PROGRESS': 'Интервью в процессе, запись будет доступна после завершения',
      'CANCELLED': 'Интервью было отменено'
    }[videoData?.status || ''] || 'Запись недоступна';

    return (
      <div className={`bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vtb-text">
            {videoData?.status === 'SCHEDULED' ? 'Информация об интервью' : 'Видеозапись интервью'}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-vtb-text-secondary hover:text-vtb-text transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {videoData?.status === 'SCHEDULED' ? (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <PlayIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h4 className="text-lg font-semibold text-vtb-text mb-2">
                {videoData?.status === 'SCHEDULED' ? 'Интервью запланировано' : 'Запись недоступна'}
              </h4>
              <p className="text-vtb-text-secondary text-sm mb-4">{statusText}</p>
            </div>
          </div>
          
          {/* Interview Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-vtb-text mb-3">Детали интервью</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-vtb-text-secondary">Кандидат:</span>
                <p className="font-medium text-vtb-text">{candidateName}</p>
              </div>
              <div>
                <span className="text-vtb-text-secondary">Позиция:</span>
                <p className="font-medium text-vtb-text">{jobTitle}</p>
              </div>
              <div>
                <span className="text-vtb-text-secondary">Статус:</span>
                <p className="font-medium text-vtb-text">
                  {videoData?.status === 'SCHEDULED' ? 'Запланировано' : 
                   videoData?.status === 'IN_PROGRESS' ? 'Идет интервью' : 
                   videoData?.status === 'CANCELLED' ? 'Отменено' : videoData?.status}
                </p>
              </div>
              {videoData?.interview.startedAt && (
                <div>
                  <span className="text-vtb-text-secondary">Начато:</span>
                  <p className="font-medium text-vtb-text">{formatDate(videoData.interview.startedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-vtb-surface rounded-2xl p-6 shadow-lg border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-vtb-text">Видеозапись интервью</h3>
          <p className="text-sm text-vtb-text-secondary">
            {candidateName} • {jobTitle}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-vtb-text-secondary hover:text-vtb-text transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-xl overflow-hidden mb-4">
        {videoData?.videoUrl ? (
          <VideoElement 
            videoUrl={videoData.videoUrl}
            onLoadedMetadata={(duration) => setDuration(duration)}
            onTimeUpdate={(currentTime) => setCurrentTime(currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={(volume) => setVolume(volume)}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-white">
            <div className="text-center">
              <p className="mb-2">Видеозапись недоступна</p>
              <p className="text-sm opacity-75">
                {videoData?.status === 'SCHEDULED' ? 'Интервью еще не началось' :
                 videoData?.status === 'CANCELLED' ? 'Интервью было отменено' :
                 'Видео еще обрабатывается'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="text-sm text-vtb-text-secondary space-y-1">
        {videoData?.interview.startedAt && (
          <p>Начато: {formatDate(videoData.interview.startedAt)}</p>
        )}
        {videoData?.interview.endedAt && (
          <p>Завершено: {formatDate(videoData.interview.endedAt)}</p>
        )}
        {duration > 0 && (
          <p>Длительность: {formatTime(duration)}</p>
        )}
      </div>

      {/* Additional Controls */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-vtb-text-secondary">
            Статус: <span className="text-vtb-text font-medium">
              {videoData.interview.status === 'COMPLETED' ? 'Завершено' : 'В процессе'}
            </span>
          </span>
          <span className="text-vtb-text-secondary">
            Качество: <span className="text-vtb-text font-medium">HD</span>
          </span>
        </div>
      </div>
    </div>
  );
}
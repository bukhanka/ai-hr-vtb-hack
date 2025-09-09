'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  RoomContext,
  VideoConference,
  LocalUserChoices,
  formatChatMessageLinks,
} from '@livekit/components-react';
import {
  Room,
  RoomOptions,
  RoomConnectOptions,
  VideoPresets,
  RoomEvent,
} from 'livekit-client';
import { ConnectionDetails, isLowPowerDevice } from '../../lib/livekit-utils';

interface VideoConferenceRoomProps {
  connectionDetails: ConnectionDetails;
  userChoices: LocalUserChoices;
  onDisconnect: () => void;
  interviewId?: string;
}

export function VideoConferenceRoom({
  connectionDetails,
  userChoices,
  onDisconnect,
  interviewId,
}: VideoConferenceRoomProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAutoEndSuggestion, setShowAutoEndSuggestion] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const roomOptions = useMemo((): RoomOptions => {
    const publishDefaults = {
      videoSimulcastLayers: isLowPowerDevice()
        ? [VideoPresets.h540, VideoPresets.h216]
        : [VideoPresets.h720, VideoPresets.h360],
      dtx: false,
      red: true,
    };

    return {
      publishDefaults,
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: isLowPowerDevice() ? VideoPresets.h540 : VideoPresets.h720,
      },
      audioCaptureDefaults: {
        deviceId: userChoices.audioDeviceId ?? undefined,
      },
    };
  }, [userChoices]);

  const connectOptions = useMemo((): RoomConnectOptions => ({
    autoSubscribe: true,
  }), []);

  // Функция для форматирования времени
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Функция завершения интервью
  const handleCompleteInterview = async () => {
    if (!interviewId) {
      console.error('Interview ID не найден');
      return;
    }

    try {
      setIsCompleting(true);
      const token = localStorage.getItem('auth-token');
      
      console.log('Завершаем интервью:', interviewId);
      
      const response = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Ошибка при завершении интервью';
        
        // Более понятные сообщения для пользователя
        if (errorMessage.includes('уже завершено')) {
          errorMessage = 'Интервью уже было завершено ранее. Обновляем страницу...';
          // Через 2 секунды закрываем видеоконференцию для обновления данных
          setTimeout(() => {
            setShowEndConfirmation(false);
            onDisconnect();
          }, 2000);
        } else if (errorMessage.includes('не найдено')) {
          errorMessage = 'Интервью не найдено. Возможно, оно было удалено.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Интервью успешно завершено:', result);

      // Закрываем модальное окно и завершаем конференцию
      setShowEndConfirmation(false);
      onDisconnect();
    } catch (error) {
      console.error('Ошибка завершения интервью:', error);
      setError(error instanceof Error ? error.message : 'Не удалось завершить интервью');
    } finally {
      setIsCompleting(false);
    }
  };

  // Функция для простого отключения без завершения интервью
  const handleDisconnectOnly = () => {
    setShowEndConfirmation(false);
    onDisconnect();
  };

  // Функция автоматического начала интервью при подключении к видеоконференции
  const startInterviewIfNeeded = async () => {
    if (!interviewId) {
      console.log('Interview ID не найден - пропускаем автостарт');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      console.log('Пытаемся автоматически начать интервью:', interviewId);
      
      const response = await fetch(`/api/interviews/${interviewId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Интервью автоматически переведено в IN_PROGRESS:', result);
      } else {
        // Если интервью уже началось или завершено - не показываем ошибку
        const errorData = await response.json();
        console.log('Интервью уже началось или завершено:', errorData.error);
      }
    } catch (error) {
      // Не показываем ошибку пользователю, просто логируем
      console.warn('Не удалось автоматически начать интервью (не критично):', error);
    }
  };

  useEffect(() => {
    let isCleanedUp = false;
    
    // Создаем новый Room объект для каждого подключения
    const room = new Room(roomOptions);
    roomRef.current = room;
    
    const handleDisconnected = () => {
      console.log('Отключение от комнаты');
      if (!isCleanedUp) {
        onDisconnect();
      }
    };

    const handleError = (error: Error) => {
      console.error('Ошибка в комнате:', error);
      if (!isCleanedUp) {
        setError(`Ошибка подключения: ${error.message}`);
      }
    };

    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      console.log('Состояние подключения изменилось:', state);
      if (state === 'connected' && !isCleanedUp) {
        setIsConnecting(false);
        // Запускаем таймер при подключении
        setStartTime(new Date());
        // Автоматически начинаем интервью
        startInterviewIfNeeded();
      }
    });

    // Подключаемся к комнате
    const connect = async () => {
      try {
        // Проверяем, что component не был unmounted
        if (isCleanedUp) {
          console.log('VideoConferenceRoom: Отменяем подключение - компонент был размонтирован');
          return;
        }
        
        console.log('VideoConferenceRoom: Начинаем подключение к комнате');
        console.log('URL:', connectionDetails.wsUrl);
        console.log('Token:', connectionDetails.token ? 'присутствует' : 'отсутствует');
        
        setIsConnecting(true);
        await room.connect(connectionDetails.wsUrl, connectionDetails.token, connectOptions);
        
        // Проверяем снова после async операции
        if (isCleanedUp) {
          console.log('VideoConferenceRoom: Отменяем настройку - компонент был размонтирован');
          return;
        }
        
        console.log('VideoConferenceRoom: Подключение к комнате успешно');

        // Включаем камеру и микрофон если они выбраны
        if (userChoices.videoEnabled) {
          console.log('VideoConferenceRoom: Включаем камеру');
          await room.localParticipant.setCameraEnabled(true);
        }
        if (userChoices.audioEnabled) {
          console.log('VideoConferenceRoom: Включаем микрофон');
          await room.localParticipant.setMicrophoneEnabled(true);
        }
        console.log('VideoConferenceRoom: Настройка завершена');
      } catch (err) {
        if (isCleanedUp) {
          console.log('VideoConferenceRoom: Игнорируем ошибку - компонент был размонтирован');
          return;
        }
        
        console.error('Ошибка подключения к комнате:', err);
        let errorMessage = 'Неизвестная ошибка';
        
        if (err instanceof Error) {
          if (err.message.includes('Firefox can\'t establish') || err.message.includes('WebSocket')) {
            errorMessage = 'Не удалось подключиться к серверу видеоконференции. Попробуйте:\n\n1. Отключить аппаратное ускорение в Firefox (about:preferences → Производительность)\n2. Использовать Chrome или Edge\n3. Проверить подключение к интернету';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      console.log('VideoConferenceRoom: Cleanup - отключаем комнату');
      isCleanedUp = true;
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.disconnect();
      roomRef.current = null;
      
      // Очищаем таймер
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connectionDetails, connectOptions, userChoices, onDisconnect, roomOptions]);

  // Отдельный useEffect для таймера
  useEffect(() => {
    if (!startTime) return;

    // Запускаем интервал для обновления времени каждую секунду
    timerRef.current = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);

      // Автопредложение завершения через 10 минут (600 секунд)
      if (elapsed === 600 && !showAutoEndSuggestion && !showEndConfirmation) {
        setShowAutoEndSuggestion(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startTime, showAutoEndSuggestion, showEndConfirmation]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="bg-vtb-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border text-center">
          <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-vtb-text mb-2">Ошибка подключения</h3>
          <p className="text-vtb-text-secondary mb-6">{error}</p>
          <button
            onClick={onDisconnect}
            className="px-6 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Подключение к видеоконференции...</p>
        </div>
      </div>
    );
  }

  // Не рендерим UI пока нет room объекта
  if (!roomRef.current) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Инициализация комнаты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50" data-lk-theme="default">
      <RoomContext.Provider value={roomRef.current}>
        <div className="h-full relative">
          {/* Header с таймером и кнопками */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            {/* Таймер */}
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Время интервью: {formatTime(elapsedTime)}</span>
              </div>
            </div>

            {/* Кнопки управления */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEndConfirmation(true)}
                className="px-4 py-2 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-lg hover:shadow-lg transition-all shadow-lg"
              >
                Завершить интервью
              </button>
            </div>
          </div>
          
          {/* Основной компонент видеоконференции */}
          <VideoConference
            chatMessageFormatter={formatChatMessageLinks}
          />
        </div>
      </RoomContext.Provider>

      {/* Модальное окно подтверждения завершения */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-vtb-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border">
            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-vtb-text mb-2">
                Завершить интервью?
              </h3>
              <p className="text-vtb-text-secondary mb-6">
                Вы уверены, что хотите завершить интервью? После завершения вы получите результаты AI-анализа и больше не сможете продолжить собеседование.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDisconnectOnly}
                  disabled={isCompleting}
                  className="flex-1 px-4 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCompleteInterview}
                  disabled={isCompleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCompleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Завершаем...
                    </>
                  ) : (
                    'Завершить интервью'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно автопредложения завершения */}
      {showAutoEndSuggestion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-vtb-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border">
            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-vtb-text mb-2">
                Интервью длится уже 10 минут
              </h3>
              <p className="text-vtb-text-secondary mb-6">
                Возможно, пора завершить интервью и получить результаты? Вы можете продолжить или завершить сейчас.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAutoEndSuggestion(false)}
                  className="flex-1 px-4 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
                >
                  Продолжить
                </button>
                <button
                  onClick={() => {
                    setShowAutoEndSuggestion(false);
                    setShowEndConfirmation(true);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Завершить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
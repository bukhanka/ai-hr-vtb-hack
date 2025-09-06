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
}

export function VideoConferenceRoom({
  connectionDetails,
  userChoices,
  onDisconnect,
}: VideoConferenceRoomProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

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
    };
  }, [connectionDetails, connectOptions, userChoices, onDisconnect, roomOptions]);

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
          {/* Header с кнопкой выхода */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Завершить конференцию
            </button>
          </div>
          
          {/* Основной компонент видеоконференции */}
          <VideoConference
            chatMessageFormatter={formatChatMessageLinks}
          />
        </div>
      </RoomContext.Provider>
    </div>
  );
}
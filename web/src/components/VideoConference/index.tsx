'use client';

import React, { useState } from 'react';
import { LocalUserChoices } from '@livekit/components-react';
import { PreJoin } from './PreJoin';
import { VideoConferenceRoom } from './VideoConferenceRoom';
import { ConnectionDetails, getConnectionDetails, generateRoomId } from '../../lib/livekit-utils';

interface VideoConferenceProps {
  participantName: string;
  interviewId: string;
  onClose: () => void;
}

type ConferenceState = 'pre-join' | 'connecting' | 'connected' | 'disconnected';

export function VideoConference({ participantName, interviewId, onClose }: VideoConferenceProps) {
  const [state, setState] = useState<ConferenceState>('pre-join');
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('VideoConference: Компонент отрендерен, состояние:', state);

  const handleJoin = async (choices: LocalUserChoices) => {
    try {
      console.log('Начинаем подключение к видеоконференции...');
      setState('connecting');
      setUserChoices(choices);
      
      // Генерируем уникальное имя комнаты на основе ID интервью
      const roomName = `interview-${interviewId}`;
      console.log('Имя комнаты:', roomName);
      console.log('Имя участника:', participantName);
      
      // Получаем токен подключения
      const details = await getConnectionDetails(roomName, participantName);
      console.log('Получены детали подключения:', details);
      setConnectionDetails(details);
      setState('connected');
    } catch (err) {
      console.error('Ошибка подключения:', err);
      setError(err instanceof Error ? err.message : 'Не удалось подключиться к конференции');
      setState('pre-join');
    }
  };

  const handleDisconnect = () => {
    setState('disconnected');
    setConnectionDetails(null);
    setUserChoices(null);
    onClose();
  };

  if (state === 'connecting') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtb-primary mx-auto mb-4"></div>
          <p className="text-vtb-text-secondary">Подготовка видеоконференции...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-vtb-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border text-center">
          <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-vtb-text mb-2">Ошибка</h3>
          <p className="text-vtb-text-secondary mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setError(null)}
              className="flex-1 px-4 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-vtb-primary text-white rounded-xl hover:bg-vtb-primary/90 transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'connected' && connectionDetails && userChoices) {
    return (
      <VideoConferenceRoom
        connectionDetails={connectionDetails}
        userChoices={userChoices}
        onDisconnect={handleDisconnect}
      />
    );
  }

  return (
    <PreJoin
      participantName={participantName}
      onJoin={handleJoin}
      onCancel={onClose}
    />
  );
}
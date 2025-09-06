'use client';

import React, { useState } from 'react';
import { LocalUserChoices } from '@livekit/components-react';

interface PreJoinProps {
  participantName: string;
  onJoin: (choices: LocalUserChoices) => void;
  onCancel: () => void;
}

export function PreJoin({ participantName, onJoin, onCancel }: PreJoinProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  console.log('PreJoin: Компонент отрендерен для участника:', participantName);

  const handleJoin = () => {
    onJoin({
      username: participantName,
      videoEnabled,
      audioEnabled,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-vtb-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border">
        <div className="text-center mb-6">
          <div className="h-16 w-16 bg-gradient-to-br from-vtb-primary to-vtb-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-vtb-text mb-2">
            Присоединиться к интервью
          </h2>
          <p className="text-vtb-text-secondary">
            Настройте камеру и микрофон перед началом
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-vtb-surface-secondary rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-vtb-text font-medium">Камера</span>
            </div>
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                videoEnabled ? 'bg-vtb-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  videoEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-vtb-surface-secondary rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-vtb-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-vtb-text font-medium">Микрофон</span>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioEnabled ? 'bg-vtb-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Участник:</strong> {participantName}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-vtb-surface-secondary border border-border text-vtb-text rounded-xl hover:bg-muted transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-vtb-primary to-vtb-secondary text-white rounded-xl hover:shadow-lg transition-all"
          >
            Присоединиться
          </button>
        </div>
      </div>
    </div>
  );
}
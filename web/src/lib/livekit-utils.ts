export function generateRoomId(): string {
  return `interview-${randomString(8)}-${Date.now()}`;
}

export function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export interface ConnectionDetails {
  wsUrl: string;
  token: string;
  roomName: string;
  identity: string;
  participantName: string;
}

export interface InterviewConnectionDetails extends ConnectionDetails {
  agentInstructions?: string; // Для отладки
}

export async function getConnectionDetails(
  roomName: string,
  participantName: string
): Promise<ConnectionDetails> {
  console.log('Отправляем запрос на получение токена...');
  
  const response = await fetch('/api/livekit/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomName,
      participantName,
    }),
  });

  console.log('Ответ от API:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json();
    console.error('Ошибка от API:', error);
    throw new Error(error.error || 'Не удалось получить токен для подключения');
  }

  const data = await response.json();
  console.log('Данные от API:', data);
  
  return {
    wsUrl: data.wsUrl,
    token: data.token,
    roomName,
    identity: data.identity,
    participantName,
  };
}

export async function getInterviewConnectionDetails(
  interviewId: string,
  participantName: string
): Promise<InterviewConnectionDetails> {
  console.log('Отправляем запрос на получение токена для интервью...');
  
  const response = await fetch('/api/livekit/interview-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify({
      interviewId,
      participantName,
    }),
  });

  console.log('Ответ от Interview API:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json();
    console.error('Ошибка от Interview API:', error);
    throw new Error(error.error || 'Не удалось получить токен для интервью');
  }

  const data = await response.json();
  console.log('Данные от Interview API:', data);
  
  return {
    wsUrl: data.wsUrl,
    token: data.token,
    roomName: data.roomName,
    identity: data.identity,
    participantName,
    agentInstructions: data.agentInstructions,
  };
}

export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.hardwareConcurrency < 6;
}
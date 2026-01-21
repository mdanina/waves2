/**
 * API для работы с транскрибацией аудио
 * Взаимодействие с бекендом для AssemblyAI
 */

import { supabase } from './supabase';

// URL backend сервиса
const API_URL = import.meta.env.VITE_AI_API_URL || '';

/**
 * Получить заголовки для аутентификации
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Необходима авторизация');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Инициировать транскрибацию аудио записи
 */
export async function initiateTranscription(recordingId: string): Promise<{
  transcript_id: string;
  status: string;
}> {
  if (!API_URL) {
    throw new Error('AI сервис не настроен (VITE_AI_API_URL)');
  }

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ recording_id: recordingId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Синхронизировать статус транскрибации с AssemblyAI
 */
export async function syncTranscriptionStatus(recordingId: string): Promise<{
  status: string;
  text?: string;
  synced: boolean;
}> {
  if (!API_URL) {
    throw new Error('AI сервис не настроен');
  }

  const response = await fetch(`${API_URL}/api/transcribe/${recordingId}/sync`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Получить статус транскрибации
 */
export async function getTranscriptionStatus(recordingId: string): Promise<{
  status: string;
  has_text: boolean;
}> {
  if (!API_URL) {
    throw new Error('AI сервис не настроен');
  }

  const response = await fetch(`${API_URL}/api/transcribe/${recordingId}/status`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Получить текст транскрипции
 */
export async function getTranscriptionText(recordingId: string): Promise<{
  status: string;
  text: string;
}> {
  if (!API_URL) {
    throw new Error('AI сервис не настроен');
  }

  const response = await fetch(`${API_URL}/api/transcribe/${recordingId}/text`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Проверить доступность сервиса транскрибации
 */
export async function checkTranscriptionHealth(): Promise<{
  available: boolean;
  error?: string;
}> {
  if (!API_URL) {
    return { available: false, error: 'AI сервис не настроен' };
  }

  try {
    const response = await fetch(`${API_URL}/api/transcribe/health`);
    const result = await response.json();
    return {
      available: result.available,
      error: result.error,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Ошибка подключения',
    };
  }
}

/**
 * Проверить доступность AI сервиса (OpenAI)
 */
export async function checkAIHealth(): Promise<{
  available: boolean;
  model?: string;
  error?: string;
}> {
  if (!API_URL) {
    return { available: false, error: 'AI сервис не настроен' };
  }

  try {
    const response = await fetch(`${API_URL}/api/ai/health`);
    const result = await response.json();
    return {
      available: result.available,
      model: result.model,
      error: result.error,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Ошибка подключения',
    };
  }
}

// Утилиты для работы с календарным фидом (iCal/ICS)
import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Получает базовый URL API с учетом относительных путей
 */
function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || '';

  if (!envUrl) {
    return 'http://localhost:3001';
  }

  // Если URL уже абсолютный, возвращаем как есть
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl;
  }

  // Для относительных путей добавляем origin
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = envUrl.startsWith('/') ? envUrl : `/${envUrl}`;
  return `${origin}${path}`;
}

const API_URL = getApiUrl();

export interface CalendarFeedToken {
  token: string;
  feedUrl: string;
}

/**
 * Генерирует или получает существующий токен календарного фида
 */
export async function generateCalendarFeedToken(): Promise<CalendarFeedToken> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error('Ошибка получения сессии:', sessionError);
      throw new Error('Ошибка авторизации. Попробуйте перезайти в аккаунт.');
    }

    if (!session?.access_token) {
      throw new Error('Необходима авторизация. Попробуйте перезайти в аккаунт.');
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/calendar/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (networkError) {
      logger.error('Сетевая ошибка при генерации токена:', networkError);
      throw new Error('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    }

    if (!response.ok) {
      let errorMessage = 'Ошибка генерации токена';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Если не удалось распарсить JSON, используем статус
        if (response.status === 401) {
          errorMessage = 'Сессия истекла. Попробуйте перезайти в аккаунт.';
        } else if (response.status === 404) {
          errorMessage = 'Сервер календаря недоступен. Проверьте настройки VITE_API_URL.';
        } else if (response.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        } else {
          errorMessage = `Ошибка сервера (${response.status}). Попробуйте позже.`;
        }
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Неверный формат ответа от сервера');
    }

    if (!data.success) {
      throw new Error(data.error || 'Ошибка генерации токена');
    }

    if (!data.token || !data.feedUrl) {
      throw new Error('Сервер не вернул данные токена');
    }

    return {
      token: data.token,
      feedUrl: data.feedUrl,
    };
  } catch (error) {
    logger.error('Ошибка генерации токена календаря:', error);
    throw error;
  }
}

/**
 * Отзывает токен календарного фида
 */
export async function revokeCalendarFeedToken(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_URL}/api/calendar/revoke-token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка отзыва токена');
    }
  } catch (error) {
    logger.error('Ошибка отзыва токена календаря:', error);
    throw error;
  }
}

/**
 * Получает существующий токен календарного фида (если есть)
 */
export async function getExistingCalendarToken(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('calendar_feed_tokens')
      .select('token')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data.token;
  } catch (error) {
    logger.error('Ошибка получения токена календаря:', error);
    return null;
  }
}

/**
 * Формирует URL фида по токену
 */
export function buildFeedUrl(token: string): string {
  return `${API_URL}/api/calendar/feed/${token}`;
}

// ============================================
// SPECIALIST FUNCTIONS
// ============================================

/**
 * Генерирует токен календарного фида для специалиста
 */
export async function generateSpecialistCalendarFeedToken(): Promise<CalendarFeedToken> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error('Ошибка получения сессии:', sessionError);
      throw new Error('Ошибка авторизации. Попробуйте перезайти в аккаунт.');
    }

    if (!session?.access_token) {
      throw new Error('Необходима авторизация. Попробуйте перезайти в аккаунт.');
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/calendar/specialist/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (networkError) {
      logger.error('Сетевая ошибка при генерации токена:', networkError);
      throw new Error('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    }

    if (!response.ok) {
      let errorMessage = 'Ошибка генерации токена';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 401) {
          errorMessage = 'Сессия истекла. Попробуйте перезайти в аккаунт.';
        } else if (response.status === 403) {
          errorMessage = 'Доступ запрещён. Убедитесь, что вы являетесь специалистом.';
        } else if (response.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        } else {
          errorMessage = `Ошибка сервера (${response.status}). Попробуйте позже.`;
        }
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Неверный формат ответа от сервера');
    }

    if (!data.success) {
      throw new Error(data.error || 'Ошибка генерации токена');
    }

    if (!data.token || !data.feedUrl) {
      throw new Error('Сервер не вернул данные токена');
    }

    return {
      token: data.token,
      feedUrl: data.feedUrl,
    };
  } catch (error) {
    logger.error('Ошибка генерации токена календаря специалиста:', error);
    throw error;
  }
}

/**
 * Отзывает токен календарного фида специалиста
 */
export async function revokeSpecialistCalendarFeedToken(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_URL}/api/calendar/specialist/revoke-token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка отзыва токена');
    }
  } catch (error) {
    logger.error('Ошибка отзыва токена календаря специалиста:', error);
    throw error;
  }
}

/**
 * Получает существующий токен календарного фида специалиста
 */
export async function getExistingSpecialistCalendarToken(specialistId: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('calendar_feed_tokens')
      .select('token')
      .eq('user_id', user.id)
      .eq('specialist_id', specialistId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.token;
  } catch (error) {
    logger.error('Ошибка получения токена календаря специалиста:', error);
    return null;
  }
}

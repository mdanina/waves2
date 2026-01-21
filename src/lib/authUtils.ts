// Утилиты для работы с авторизацией
import type { Session } from '@supabase/supabase-js';

/**
 * Проверяет, валидна ли сессия (не истекла)
 * БЕЗОПАСНОСТЬ: Требуем наличие expires_at для валидации
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;

  // Проверяем наличие access_token
  if (!session.access_token) return false;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;

  // БЕЗОПАСНОСТЬ: Если expires_at не указан, считаем сессию НЕВАЛИДНОЙ
  // Это предотвращает обход авторизации через подделку localStorage
  if (!expiresAt) return false;

  // Добавляем буфер в 60 секунд для предотвращения race conditions
  return expiresAt > now + 60;
}

/**
 * Проверяет, истекла ли сессия
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;

  // Если нет access_token - сессия истекла
  if (!session.access_token) return true;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;

  // Если нет expires_at - считаем истекшей (безопасный дефолт)
  if (!expiresAt) return true;

  return expiresAt < now;
}
















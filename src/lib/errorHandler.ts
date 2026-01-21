// Единая система обработки ошибок
import { logger } from './logger';
import { toast } from 'sonner';
import type { AppError } from '@/types/errors';

/**
 * Извлекает понятное сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'Произошла неизвестная ошибка';
}

/**
 * Обрабатывает ошибки Supabase
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code?: string; message?: string; details?: string };
    
    // Обработка специфичных кодов Supabase
    switch (supabaseError.code) {
      case 'PGRST116':
        return {
          message: 'Запись не найдена',
          code: 'NOT_FOUND',
        };
      case '23505': // Unique violation
        return {
          message: 'Запись с такими данными уже существует',
          code: 'DUPLICATE',
        };
      case '23503': // Foreign key violation
        return {
          message: 'Невозможно выполнить операцию: связанная запись не найдена',
          code: 'FOREIGN_KEY_VIOLATION',
        };
      case '42501': // Insufficient privilege
        return {
          message: 'Недостаточно прав доступа',
          code: 'INSUFFICIENT_PRIVILEGE',
        };
      case 'PGRST301': // Multiple rows returned
        return {
          message: 'Найдено несколько записей, ожидалась одна',
          code: 'MULTIPLE_ROWS',
        };
      default:
        return {
          message: supabaseError.message || supabaseError.details || 'Ошибка базы данных',
          code: supabaseError.code,
        };
    }
  }
  
  return {
    message: getErrorMessage(error),
  };
}

/**
 * Обрабатывает ошибку API с логированием и уведомлением пользователя
 */
export async function handleApiError<T>(
  operation: () => Promise<T>,
  userMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = handleSupabaseError(error);
    const message = userMessage || appError.message;
    
    logger.error('API Error:', {
      error,
      code: appError.code,
      message: appError.message,
    });
    
    // Показываем пользователю понятное сообщение
    toast.error(message);
    
    // Пробрасываем ошибку дальше для обработки в компонентах
    throw error;
  }
}

/**
 * Обрабатывает сетевые ошибки
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError') ||
      error.name === 'NetworkError'
    );
  }
  return false;
}

/**
 * Безопасно выполняет операцию с обработкой ошибок
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback?: T,
  userMessage?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logger.error('Safe execute error:', error);
    
    if (userMessage) {
      toast.error(userMessage);
    }
    
    return fallback;
  }
}
















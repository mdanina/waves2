import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getErrorMessage,
  handleSupabaseError,
  isNetworkError,
  safeExecute,
} from './errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('getErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should extract message from object with message property', () => {
    const error = { message: 'Object error message', code: 123 };
    expect(getErrorMessage(error)).toBe('Object error message');
  });

  it('should return default message for unknown types', () => {
    expect(getErrorMessage(null)).toBe('Произошла неизвестная ошибка');
    expect(getErrorMessage(undefined)).toBe('Произошла неизвестная ошибка');
    expect(getErrorMessage(123)).toBe('Произошла неизвестная ошибка');
    expect(getErrorMessage({})).toBe('Произошла неизвестная ошибка');
  });

  it('should handle empty string message', () => {
    expect(getErrorMessage('')).toBe('');
  });
});

describe('handleSupabaseError', () => {
  describe('specific Supabase error codes', () => {
    it('should handle PGRST116 (not found)', () => {
      const error = { code: 'PGRST116', message: 'Row not found' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Запись не найдена');
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle 23505 (unique violation)', () => {
      const error = { code: '23505', message: 'Duplicate key' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Запись с такими данными уже существует');
      expect(result.code).toBe('DUPLICATE');
    });

    it('should handle 23503 (foreign key violation)', () => {
      const error = { code: '23503', message: 'Foreign key violation' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Невозможно выполнить операцию: связанная запись не найдена');
      expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
    });

    it('should handle 42501 (insufficient privilege)', () => {
      const error = { code: '42501', message: 'Permission denied' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Недостаточно прав доступа');
      expect(result.code).toBe('INSUFFICIENT_PRIVILEGE');
    });

    it('should handle PGRST301 (multiple rows)', () => {
      const error = { code: 'PGRST301', message: 'Multiple rows returned' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Найдено несколько записей, ожидалась одна');
      expect(result.code).toBe('MULTIPLE_ROWS');
    });
  });

  describe('unknown Supabase errors', () => {
    it('should use message from unknown error code', () => {
      const error = { code: 'UNKNOWN123', message: 'Custom error message' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Custom error message');
      expect(result.code).toBe('UNKNOWN123');
    });

    it('should use details if message is not available', () => {
      const error = { code: 'UNKNOWN123', details: 'Error details' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Error details');
    });

    it('should fallback to generic message', () => {
      const error = { code: 'UNKNOWN123' };
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Ошибка базы данных');
    });
  });

  describe('non-Supabase errors', () => {
    it('should handle Error objects', () => {
      const error = new Error('Regular error');
      const result = handleSupabaseError(error);

      expect(result.message).toBe('Regular error');
    });

    it('should handle string errors', () => {
      const result = handleSupabaseError('String error');

      expect(result.message).toBe('String error');
    });

    it('should handle null/undefined', () => {
      const result = handleSupabaseError(null);

      expect(result.message).toBe('Произошла неизвестная ошибка');
    });
  });
});

describe('isNetworkError', () => {
  it('should return true for network-related errors', () => {
    expect(isNetworkError(new Error('network error'))).toBe(true);
    expect(isNetworkError(new Error('fetch failed'))).toBe(true);
    expect(isNetworkError(new Error('NetworkError: something went wrong'))).toBe(true);
  });

  it('should return true for errors with NetworkError name', () => {
    const error = new Error('Something failed');
    error.name = 'NetworkError';
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for non-network errors', () => {
    expect(isNetworkError(new Error('Validation error'))).toBe(false);
    expect(isNetworkError(new Error('Permission denied'))).toBe(false);
  });

  it('should return false for non-Error types', () => {
    expect(isNetworkError('network error')).toBe(false);
    expect(isNetworkError({ message: 'network error' })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});

describe('safeExecute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return result on success', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await safeExecute(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalled();
  });

  it('should return fallback on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));
    const result = await safeExecute(operation, 'fallback');

    expect(result).toBe('fallback');
  });

  it('should return undefined if no fallback provided', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));
    const result = await safeExecute(operation);

    expect(result).toBeUndefined();
  });

  it('should show toast if userMessage provided', async () => {
    const { toast } = await import('sonner');
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));

    await safeExecute(operation, undefined, 'User-friendly message');

    expect(toast.error).toHaveBeenCalledWith('User-friendly message');
  });

  it('should not show toast if no userMessage', async () => {
    const { toast } = await import('sonner');
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));

    await safeExecute(operation);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should handle async operations', async () => {
    const operation = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async result';
    });

    const result = await safeExecute(operation);

    expect(result).toBe('async result');
  });
});

describe('Error code coverage', () => {
  // Test all documented PostgreSQL/Supabase error codes
  const errorCodeMappings = [
    { code: 'PGRST116', expectedCode: 'NOT_FOUND' },
    { code: '23505', expectedCode: 'DUPLICATE' },
    { code: '23503', expectedCode: 'FOREIGN_KEY_VIOLATION' },
    { code: '42501', expectedCode: 'INSUFFICIENT_PRIVILEGE' },
    { code: 'PGRST301', expectedCode: 'MULTIPLE_ROWS' },
  ];

  it.each(errorCodeMappings)(
    'should correctly handle error code $code',
    ({ code, expectedCode }) => {
      const error = { code, message: 'Test' };
      const result = handleSupabaseError(error);
      expect(result.code).toBe(expectedCode);
    },
  );
});

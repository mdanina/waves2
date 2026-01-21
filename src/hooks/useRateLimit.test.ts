import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateLimit } from './useRateLimit';

describe('useRateLimit', () => {
  // Use real localStorage for these tests
  const originalLocalStorage = { ...window.localStorage };

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  describe('initial state', () => {
    it('should start with no blocked state', () => {
      const { result } = renderHook(() => useRateLimit('test_key_1'));

      expect(result.current.isBlocked).toBe(false);
      expect(result.current.attemptsRemaining).toBe(5);
      expect(result.current.timeRemaining).toBe(0);
    });

    it('should provide recordFailedAttempt function', () => {
      const { result } = renderHook(() => useRateLimit('test_key_2'));

      expect(typeof result.current.recordFailedAttempt).toBe('function');
    });

    it('should provide resetAttempts function', () => {
      const { result } = renderHook(() => useRateLimit('test_key_3'));

      expect(typeof result.current.resetAttempts).toBe('function');
    });
  });

  describe('return values', () => {
    it('should return isBlocked boolean', () => {
      const { result } = renderHook(() => useRateLimit('test_key_4'));

      expect(typeof result.current.isBlocked).toBe('boolean');
    });

    it('should return attemptsRemaining number', () => {
      const { result } = renderHook(() => useRateLimit('test_key_5'));

      expect(typeof result.current.attemptsRemaining).toBe('number');
    });

    it('should return timeRemaining number', () => {
      const { result } = renderHook(() => useRateLimit('test_key_6'));

      expect(typeof result.current.timeRemaining).toBe('number');
    });
  });

  describe('hook behavior', () => {
    it('should use different keys for different instances', () => {
      const { result: result1 } = renderHook(() => useRateLimit('key_a'));
      const { result: result2 } = renderHook(() => useRateLimit('key_b'));

      // Both should have initial values
      expect(result1.current.attemptsRemaining).toBe(5);
      expect(result2.current.attemptsRemaining).toBe(5);
    });

    it('should not crash when calling recordFailedAttempt', () => {
      const { result } = renderHook(() => useRateLimit('test_key_7'));

      expect(() => {
        act(() => {
          result.current.recordFailedAttempt();
        });
      }).not.toThrow();
    });

    it('should not crash when calling resetAttempts', () => {
      const { result } = renderHook(() => useRateLimit('test_key_8'));

      expect(() => {
        act(() => {
          result.current.resetAttempts();
        });
      }).not.toThrow();
    });
  });

  describe('initial state values', () => {
    it('should have exactly 5 max attempts', () => {
      const { result } = renderHook(() => useRateLimit('test_key_9'));

      // MAX_ATTEMPTS is 5 in the hook
      expect(result.current.attemptsRemaining).toBe(5);
    });

    it('should start unblocked', () => {
      const { result } = renderHook(() => useRateLimit('test_key_10'));

      expect(result.current.isBlocked).toBe(false);
    });

    it('should start with zero time remaining', () => {
      const { result } = renderHook(() => useRateLimit('test_key_11'));

      expect(result.current.timeRemaining).toBe(0);
    });
  });
});

describe('useRateLimit constants', () => {
  it('should have consistent initial state', () => {
    const { result } = renderHook(() => useRateLimit('constant_test'));

    // Test that constants are as expected
    expect(result.current.attemptsRemaining).toBe(5);
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.timeRemaining).toBe(0);
  });
});

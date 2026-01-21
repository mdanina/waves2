// Хук для ограничения частоты попыток входа (rate limiting)
import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  attempts: number;
  blockedUntil: number | null;
}

const DEFAULT_RATE_LIMIT_KEY = 'login_rate_limit';
const MAX_ATTEMPTS = 5; // Максимальное количество попыток
const BLOCK_DURATION = 15 * 60 * 1000; // 15 минут в миллисекундах

function getRateLimitState(key: string = DEFAULT_RATE_LIMIT_KEY): RateLimitState {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Проверяем, не истекла ли блокировка
      if (parsed.blockedUntil && parsed.blockedUntil > Date.now()) {
        return parsed;
      }
      // Если блокировка истекла, сбрасываем
      if (parsed.blockedUntil && parsed.blockedUntil <= Date.now()) {
        localStorage.removeItem(key);
        return { attempts: 0, blockedUntil: null };
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error reading rate limit state:', error);
  }
  return { attempts: 0, blockedUntil: null };
}

function saveRateLimitState(state: RateLimitState, key: string = DEFAULT_RATE_LIMIT_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving rate limit state:', error);
  }
}

export function useRateLimit(key: string = DEFAULT_RATE_LIMIT_KEY) {
  const [state, setState] = useState<RateLimitState>(() => {
    // Используем переданный ключ для хранения состояния
    return getRateLimitState(key);
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Обновляем таймер обратного отсчета
  useEffect(() => {
    if (!state.blockedUntil) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = state.blockedUntil! - Date.now();
      if (remaining > 0) {
        setTimeRemaining(Math.ceil(remaining / 1000)); // в секундах
      } else {
        setTimeRemaining(0);
        // Сбрасываем состояние при истечении блокировки
        const newState = { attempts: 0, blockedUntil: null };
        setState(newState);
        saveRateLimitState(newState, key);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [state.blockedUntil, key]);

  const recordFailedAttempt = useCallback(() => {
    const currentState = getRateLimitState(key);
    const newAttempts = currentState.attempts + 1;

    let newState: RateLimitState;
    if (newAttempts >= MAX_ATTEMPTS) {
      // Блокируем на указанное время
      newState = {
        attempts: newAttempts,
        blockedUntil: Date.now() + BLOCK_DURATION,
      };
    } else {
      newState = {
        attempts: newAttempts,
        blockedUntil: null,
      };
    }

    setState(newState);
    saveRateLimitState(newState, key);
  }, [key]);

  const resetAttempts = useCallback(() => {
    const newState = { attempts: 0, blockedUntil: null };
    setState(newState);
    saveRateLimitState(newState, key);
  }, [key]);

  const isBlocked = state.blockedUntil !== null && state.blockedUntil > Date.now();
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - state.attempts);

  return {
    isBlocked,
    attemptsRemaining,
    timeRemaining,
    recordFailedAttempt,
    resetAttempts,
  };
}


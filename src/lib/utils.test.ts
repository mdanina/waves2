import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatMessageTime,
  getInitials,
  pluralize,
  debounce,
  isValidPhoneNumber,
  formatPhoneInput,
  normalizePhone,
} from './utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('formatMessageTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return time for today', () => {
    const now = new Date('2024-01-15T14:30:00');
    vi.setSystemTime(now);

    const todayDate = new Date('2024-01-15T10:15:00');
    const result = formatMessageTime(todayDate.toISOString());

    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return "Вчера" for yesterday', () => {
    const now = new Date('2024-01-15T14:30:00');
    vi.setSystemTime(now);

    const yesterday = new Date('2024-01-14T10:15:00');
    const result = formatMessageTime(yesterday.toISOString());

    expect(result).toBe('Вчера');
  });

  it('should return weekday for dates within last week', () => {
    const now = new Date('2024-01-15T14:30:00'); // Monday
    vi.setSystemTime(now);

    const threeDaysAgo = new Date('2024-01-12T10:15:00'); // Friday
    const result = formatMessageTime(threeDaysAgo.toISOString());

    // Should be short weekday in Russian
    expect(result).toBeTruthy();
    expect(result).not.toBe('Вчера');
  });

  it('should return formatted date for older messages', () => {
    const now = new Date('2024-01-15T14:30:00');
    vi.setSystemTime(now);

    const oldDate = new Date('2024-01-01T10:15:00');
    const result = formatMessageTime(oldDate.toISOString());

    // Should include day and month
    expect(result).toMatch(/\d+/);
  });
});

describe('getInitials', () => {
  it('should return initials from full name', () => {
    expect(getInitials('Иван Петров')).toBe('ИП');
    expect(getInitials('Anna Smith')).toBe('AS');
  });

  it('should return single initial for single word', () => {
    expect(getInitials('Иван')).toBe('И');
    expect(getInitials('John')).toBe('J');
  });

  it('should limit to 2 characters', () => {
    expect(getInitials('Иван Петрович Сидоров')).toBe('ИП');
  });

  it('should return ?? for empty or invalid input', () => {
    expect(getInitials('')).toBe('??');
    expect(getInitials('   ')).toBe('??');
  });

  it('should handle null/undefined gracefully', () => {
    expect(getInitials(null as unknown as string)).toBe('??');
    expect(getInitials(undefined as unknown as string)).toBe('??');
  });

  it('should convert to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('иван петров')).toBe('ИП');
  });

  it('should handle extra spaces', () => {
    expect(getInitials('  Иван   Петров  ')).toBe('ИП');
  });
});

describe('pluralize', () => {
  it('should return "one" form for 1, 21, 31, etc.', () => {
    expect(pluralize(1, 'год', 'года', 'лет')).toBe('год');
    expect(pluralize(21, 'год', 'года', 'лет')).toBe('год');
    expect(pluralize(31, 'год', 'года', 'лет')).toBe('год');
    expect(pluralize(101, 'год', 'года', 'лет')).toBe('год');
  });

  it('should return "few" form for 2-4, 22-24, etc.', () => {
    expect(pluralize(2, 'год', 'года', 'лет')).toBe('года');
    expect(pluralize(3, 'год', 'года', 'лет')).toBe('года');
    expect(pluralize(4, 'год', 'года', 'лет')).toBe('года');
    expect(pluralize(22, 'год', 'года', 'лет')).toBe('года');
    expect(pluralize(23, 'год', 'года', 'лет')).toBe('года');
    expect(pluralize(24, 'год', 'года', 'лет')).toBe('года');
  });

  it('should return "many" form for 0, 5-20, 25-30, etc.', () => {
    expect(pluralize(0, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(5, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(10, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(11, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(12, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(19, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(20, 'год', 'года', 'лет')).toBe('лет');
    expect(pluralize(25, 'год', 'года', 'лет')).toBe('лет');
  });

  it('should handle 11-19 correctly (always "many")', () => {
    expect(pluralize(11, 'участник', 'участника', 'участников')).toBe('участников');
    expect(pluralize(12, 'участник', 'участника', 'участников')).toBe('участников');
    expect(pluralize(13, 'участник', 'участника', 'участников')).toBe('участников');
    expect(pluralize(14, 'участник', 'участника', 'участников')).toBe('участников');
    expect(pluralize(15, 'участник', 'участника', 'участников')).toBe('участников');
    expect(pluralize(19, 'участник', 'участника', 'участников')).toBe('участников');
  });

  it('should handle large numbers', () => {
    expect(pluralize(111, 'день', 'дня', 'дней')).toBe('дней');
    expect(pluralize(121, 'день', 'дня', 'дней')).toBe('день');
    expect(pluralize(122, 'день', 'дня', 'дней')).toBe('дня');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should only call once for rapid calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on each call', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('isValidPhoneNumber', () => {
  it('should validate Russian phone numbers starting with +7', () => {
    expect(isValidPhoneNumber('+79161234567')).toBe(true);
    expect(isValidPhoneNumber('+7 916 123 45 67')).toBe(true);
    expect(isValidPhoneNumber('+7 (916) 123-45-67')).toBe(true);
  });

  it('should validate Russian phone numbers starting with 8', () => {
    expect(isValidPhoneNumber('89161234567')).toBe(true);
    expect(isValidPhoneNumber('8 916 123 45 67')).toBe(true);
    expect(isValidPhoneNumber('8 (916) 123-45-67')).toBe(true);
  });

  it('should validate 10-digit numbers starting with 9', () => {
    expect(isValidPhoneNumber('9161234567')).toBe(true);
    expect(isValidPhoneNumber('916 123 45 67')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('12345678901234')).toBe(false);
    expect(isValidPhoneNumber('0161234567')).toBe(false); // 10 digits not starting with 9
  });

  it('should reject numbers with wrong prefix', () => {
    expect(isValidPhoneNumber('59161234567')).toBe(false);
    expect(isValidPhoneNumber('19161234567')).toBe(false);
  });
});

describe('formatPhoneInput', () => {
  it('should format empty input', () => {
    expect(formatPhoneInput('')).toBe('');
  });

  it('should add country code', () => {
    expect(formatPhoneInput('9')).toBe('+7 (9');
    expect(formatPhoneInput('916')).toBe('+7 (916');
  });

  it('should format partial numbers', () => {
    expect(formatPhoneInput('9161')).toBe('+7 (916) 1');
    expect(formatPhoneInput('91612')).toBe('+7 (916) 12');
    expect(formatPhoneInput('916123')).toBe('+7 (916) 123');
    expect(formatPhoneInput('9161234')).toBe('+7 (916) 123-4');
  });

  it('should format complete numbers', () => {
    expect(formatPhoneInput('9161234567')).toBe('+7 (916) 123-45-67');
  });

  it('should replace 8 with 7', () => {
    expect(formatPhoneInput('89161234567')).toBe('+7 (916) 123-45-67');
  });

  it('should limit to 11 digits', () => {
    expect(formatPhoneInput('791612345678999')).toBe('+7 (916) 123-45-67');
  });

  it('should strip non-numeric characters from input', () => {
    expect(formatPhoneInput('+7 (916) 123-45-67')).toBe('+7 (916) 123-45-67');
    expect(formatPhoneInput('abc9def1ghi6')).toBe('+7 (916');
  });
});

describe('normalizePhone', () => {
  it('should normalize +7 format', () => {
    expect(normalizePhone('+79161234567')).toBe('+79161234567');
    expect(normalizePhone('+7 (916) 123-45-67')).toBe('+79161234567');
  });

  it('should convert 8 to +7', () => {
    expect(normalizePhone('89161234567')).toBe('+79161234567');
    expect(normalizePhone('8 (916) 123-45-67')).toBe('+79161234567');
  });

  it('should handle 10-digit numbers', () => {
    expect(normalizePhone('9161234567')).toBe('+79161234567');
  });

  it('should return original if cannot normalize', () => {
    expect(normalizePhone('123')).toBe('123');
    expect(normalizePhone('invalid')).toBe('invalid');
  });
});

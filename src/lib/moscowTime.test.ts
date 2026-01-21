import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TIMEZONES,
  getUserTimezone,
  createMoscowDateTime,
  getMoscowNow,
  isDateInPast,
} from './moscowTime';

describe('TIMEZONES', () => {
  it('should contain Russian timezones', () => {
    const timezoneValues = TIMEZONES.map(tz => tz.value);

    expect(timezoneValues).toContain('Europe/Moscow');
    expect(timezoneValues).toContain('Europe/Kaliningrad');
    expect(timezoneValues).toContain('Asia/Vladivostok');
    expect(timezoneValues).toContain('Asia/Kamchatka');
  });

  it('should contain CIS timezones', () => {
    const timezoneValues = TIMEZONES.map(tz => tz.value);

    expect(timezoneValues).toContain('Europe/Minsk');
    expect(timezoneValues).toContain('Asia/Almaty');
    expect(timezoneValues).toContain('Asia/Tashkent');
  });

  it('should contain other popular timezones', () => {
    const timezoneValues = TIMEZONES.map(tz => tz.value);

    expect(timezoneValues).toContain('Europe/London');
    expect(timezoneValues).toContain('Europe/Paris');
    expect(timezoneValues).toContain('America/New_York');
    expect(timezoneValues).toContain('America/Los_Angeles');
  });

  it('should have labels for all timezones', () => {
    for (const tz of TIMEZONES) {
      expect(tz.label).toBeTruthy();
      expect(tz.value).toBeTruthy();
    }
  });

  it('should have UTC offset in labels', () => {
    for (const tz of TIMEZONES) {
      expect(tz.label).toMatch(/UTC[+-]?\d+/);
    }
  });
});

describe('getUserTimezone', () => {
  it('should return a string', () => {
    const timezone = getUserTimezone();
    expect(typeof timezone).toBe('string');
  });

  it('should return a non-empty timezone', () => {
    const timezone = getUserTimezone();
    // Should be a non-empty string
    expect(timezone.length).toBeGreaterThan(0);
  });
});

describe('createMoscowDateTime', () => {
  it('should create ISO string for Moscow time', () => {
    const date = new Date('2024-01-15');
    const result = createMoscowDateTime(date, 10, 30);

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should correctly handle Moscow timezone offset (+3)', () => {
    const date = new Date('2024-01-15');
    const result = createMoscowDateTime(date, 10, 30);
    const resultDate = new Date(result);

    // 10:30 Moscow time (UTC+3) = 07:30 UTC
    expect(resultDate.getUTCHours()).toBe(7);
    expect(resultDate.getUTCMinutes()).toBe(30);
  });

  it('should handle midnight correctly', () => {
    const date = new Date('2024-01-15');
    const result = createMoscowDateTime(date, 0, 0);
    const resultDate = new Date(result);

    // 00:00 Moscow time (UTC+3) = 21:00 UTC previous day
    expect(resultDate.getUTCHours()).toBe(21);
    expect(resultDate.getUTCDate()).toBe(14); // Previous day
  });

  it('should handle end of day correctly', () => {
    const date = new Date('2024-01-15');
    const result = createMoscowDateTime(date, 23, 59);
    const resultDate = new Date(result);

    // 23:59 Moscow time (UTC+3) = 20:59 UTC same day
    expect(resultDate.getUTCHours()).toBe(20);
    expect(resultDate.getUTCMinutes()).toBe(59);
  });

  it('should preserve the date from input', () => {
    const date = new Date('2024-06-20');
    const result = createMoscowDateTime(date, 12, 0);
    const resultDate = new Date(result);

    // 12:00 Moscow time = 09:00 UTC, same day
    expect(resultDate.getUTCFullYear()).toBe(2024);
    expect(resultDate.getUTCMonth()).toBe(5); // June (0-indexed)
    expect(resultDate.getUTCDate()).toBe(20);
  });

  it('should pad single-digit hours and minutes', () => {
    const date = new Date('2024-01-05');
    const result = createMoscowDateTime(date, 5, 5);

    // The function should handle single digits correctly
    expect(result).toBeTruthy();
    const resultDate = new Date(result);
    expect(resultDate.getUTCHours()).toBe(2); // 05:05 MSK = 02:05 UTC
    expect(resultDate.getUTCMinutes()).toBe(5);
  });
});

describe('getMoscowNow', () => {
  it('should return a Date object', () => {
    const result = getMoscowNow();
    expect(result).toBeInstanceOf(Date);
  });

  it('should return a valid date', () => {
    const result = getMoscowNow();
    // Should be a valid date (not NaN)
    expect(result.getTime()).not.toBeNaN();
  });
});

describe('isDateInPast', () => {
  it('should return true for past dates', () => {
    // Date from 2020 should definitely be in the past
    const pastDate = new Date('2020-01-01T10:00:00');
    expect(isDateInPast(pastDate)).toBe(true);
  });

  it('should return false for far future dates', () => {
    // Date in 2030 should definitely be in the future
    const futureDate = new Date('2030-01-15T16:00:00');
    expect(isDateInPast(futureDate)).toBe(false);
  });
});

describe('Timezone edge cases', () => {
  it('should handle DST-free Moscow time correctly', () => {
    // Moscow doesn't have DST since 2014
    const winterDate = new Date('2024-01-15');
    const summerDate = new Date('2024-07-15');

    const winterResult = createMoscowDateTime(winterDate, 12, 0);
    const summerResult = createMoscowDateTime(summerDate, 12, 0);

    const winterUTC = new Date(winterResult);
    const summerUTC = new Date(summerResult);

    // Both should have same offset (UTC+3)
    expect(winterUTC.getUTCHours()).toBe(9); // 12:00 MSK = 09:00 UTC
    expect(summerUTC.getUTCHours()).toBe(9); // 12:00 MSK = 09:00 UTC
  });
});

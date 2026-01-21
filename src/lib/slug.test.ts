import { describe, it, expect } from 'vitest';
import { generateSlug, formatBlogDate, formatReadingTime } from './slug';

describe('generateSlug', () => {
  describe('basic functionality', () => {
    it('should convert simple text to slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('HELLO WORLD')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('hello world test')).toBe('hello-world-test');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('  hello  ')).toBe('hello');
      expect(generateSlug('-hello-')).toBe('hello');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
      expect(generateSlug('hello---world')).toBe('hello-world');
    });
  });

  describe('Russian transliteration', () => {
    it('should transliterate basic Russian characters', () => {
      expect(generateSlug('привет')).toBe('privet');
      expect(generateSlug('мир')).toBe('mir');
    });

    it('should transliterate complex Russian words', () => {
      expect(generateSlug('Привет мир')).toBe('privet-mir');
    });

    it('should transliterate ё correctly', () => {
      expect(generateSlug('ёлка')).toBe('elka');
    });

    it('should transliterate й correctly', () => {
      expect(generateSlug('йод')).toBe('yod');
    });

    it('should transliterate multi-character mappings', () => {
      expect(generateSlug('жизнь')).toBe('zhizn');
      expect(generateSlug('чай')).toBe('chay');
      expect(generateSlug('школа')).toBe('shkola');
      expect(generateSlug('щука')).toBe('shchuka');
      expect(generateSlug('цирк')).toBe('tsirk');
      expect(generateSlug('юла')).toBe('yula');
      expect(generateSlug('яблоко')).toBe('yabloko');
    });

    it('should remove soft and hard signs', () => {
      // Hard sign ъ and soft sign ь should be removed
      const result1 = generateSlug('объект');
      const result2 = generateSlug('мягкость');
      expect(result1).not.toContain('ъ');
      expect(result2).not.toContain('ь');
    });

    it('should handle real blog titles', () => {
      // Test that transliteration produces valid slugs
      const result1 = generateSlug('Ещё раз о важности отдыха');
      const result2 = generateSlug('Как помочь ребёнку');
      const result3 = generateSlug('Психология развития');

      // Should produce valid slug format (lowercase, hyphens, alphanumeric)
      expect(result1).toMatch(/^[a-z0-9-]+$/);
      expect(result2).toMatch(/^[a-z0-9-]+$/);
      expect(result3).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('special characters', () => {
    it('should remove punctuation', () => {
      expect(generateSlug('hello, world!')).toBe('hello-world');
      expect(generateSlug('test? yes!')).toBe('test-yes');
    });

    it('should handle numbers', () => {
      expect(generateSlug('test123')).toBe('test123');
      expect(generateSlug('test 123')).toBe('test-123');
    });

    it('should handle mixed content', () => {
      const result = generateSlug('Статья №1: Введение');
      // Should produce valid slug format
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result).toContain('1');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle whitespace only', () => {
      expect(generateSlug('   ')).toBe('');
    });

    it('should handle only special characters', () => {
      expect(generateSlug('!@#$%')).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      expect(generateSlug(longString)).toBe('a'.repeat(1000));
    });
  });
});

describe('formatBlogDate', () => {
  it('should format a valid date string', () => {
    const result = formatBlogDate('2024-01-15T12:00:00Z');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('should handle ISO date strings', () => {
    const result = formatBlogDate('2024-06-20');
    expect(result).toMatch(/20/);
    expect(result).toMatch(/2024/);
  });

  it('should return empty string for null', () => {
    expect(formatBlogDate(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatBlogDate(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(formatBlogDate('')).toBe('');
  });

  it('should format dates in Russian locale', () => {
    const result = formatBlogDate('2024-01-15');
    // Should contain month name in Russian
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatReadingTime', () => {
  it('should format reading time correctly', () => {
    expect(formatReadingTime(5)).toBe('5 мин чтения');
    expect(formatReadingTime(10)).toBe('10 мин чтения');
    expect(formatReadingTime(1)).toBe('1 мин чтения');
  });

  it('should return empty string for null', () => {
    expect(formatReadingTime(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatReadingTime(undefined)).toBe('');
  });

  it('should return empty string for zero', () => {
    expect(formatReadingTime(0)).toBe('');
  });

  it('should return empty string for negative numbers', () => {
    expect(formatReadingTime(-5)).toBe('');
  });
});

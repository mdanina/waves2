import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test browser-specific utilities
describe('Client utilities', () => {
  describe('window availability', () => {
    it('should detect browser environment', () => {
      expect(typeof window).toBe('object');
    });

    it('should detect document availability', () => {
      expect(typeof document).toBe('object');
    });
  });

  describe('localStorage mock', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should mock localStorage.getItem', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('test');

      const result = localStorage.getItem('key');
      expect(result).toBe('test');
      expect(localStorage.getItem).toHaveBeenCalledWith('key');
    });

    it('should mock localStorage.setItem', () => {
      localStorage.setItem('key', 'value');

      expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');
    });

    it('should mock localStorage.removeItem', () => {
      localStorage.removeItem('key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('key');
    });
  });

  describe('navigator mock', () => {
    it('should have navigator object', () => {
      expect(typeof navigator).toBe('object');
    });
  });
});

describe('URL utilities', () => {
  describe('URL parsing', () => {
    it('should parse URL correctly', () => {
      const url = new URL('https://example.com/path?query=value');

      expect(url.hostname).toBe('example.com');
      expect(url.pathname).toBe('/path');
      expect(url.searchParams.get('query')).toBe('value');
    });

    it('should handle relative paths', () => {
      const baseUrl = 'https://example.com';
      const url = new URL('/api/endpoint', baseUrl);

      expect(url.href).toBe('https://example.com/api/endpoint');
    });
  });

  describe('URLSearchParams', () => {
    it('should create search params', () => {
      const params = new URLSearchParams();
      params.append('key', 'value');

      expect(params.toString()).toBe('key=value');
    });

    it('should handle multiple values', () => {
      const params = new URLSearchParams();
      params.append('a', '1');
      params.append('b', '2');

      expect(params.toString()).toBe('a=1&b=2');
    });

    it('should encode special characters', () => {
      const params = new URLSearchParams();
      params.append('text', 'hello world');

      expect(params.toString()).toBe('text=hello+world');
    });
  });
});

describe('Date utilities', () => {
  describe('Date formatting', () => {
    it('should create date from ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');

      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(15);
    });

    it('should convert to ISO string', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 0));

      expect(date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle timestamp conversion', () => {
      const timestamp = 1705315800000; // 2024-01-15T10:30:00.000Z
      const date = new Date(timestamp);

      expect(date.getTime()).toBe(timestamp);
    });
  });

  describe('Date comparison', () => {
    it('should compare dates correctly', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      expect(date1 < date2).toBe(true);
      expect(date2 > date1).toBe(true);
    });

    it('should check date equality', () => {
      const date1 = new Date('2024-01-15T10:30:00.000Z');
      const date2 = new Date('2024-01-15T10:30:00.000Z');

      expect(date1.getTime()).toBe(date2.getTime());
    });
  });
});

describe('JSON utilities', () => {
  describe('JSON.stringify', () => {
    it('should stringify objects', () => {
      const obj = { key: 'value', num: 42 };
      const json = JSON.stringify(obj);

      expect(json).toBe('{"key":"value","num":42}');
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      const json = JSON.stringify(arr);

      expect(json).toBe('[1,2,3]');
    });

    it('should handle nested objects', () => {
      const obj = { outer: { inner: 'value' } };
      const json = JSON.stringify(obj);

      expect(json).toBe('{"outer":{"inner":"value"}}');
    });
  });

  describe('JSON.parse', () => {
    it('should parse JSON strings', () => {
      const json = '{"key":"value","num":42}';
      const obj = JSON.parse(json);

      expect(obj.key).toBe('value');
      expect(obj.num).toBe(42);
    });

    it('should throw on invalid JSON', () => {
      expect(() => JSON.parse('invalid')).toThrow();
    });
  });
});

describe('Array utilities', () => {
  describe('Array methods', () => {
    it('should filter arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arr.filter(n => n > 3);

      expect(result).toEqual([4, 5]);
    });

    it('should map arrays', () => {
      const arr = [1, 2, 3];
      const result = arr.map(n => n * 2);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should reduce arrays', () => {
      const arr = [1, 2, 3, 4];
      const sum = arr.reduce((acc, n) => acc + n, 0);

      expect(sum).toBe(10);
    });

    it('should find elements', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = arr.find(item => item.id === 2);

      expect(result).toEqual({ id: 2 });
    });

    it('should check if element exists', () => {
      const arr = [1, 2, 3];

      expect(arr.includes(2)).toBe(true);
      expect(arr.includes(5)).toBe(false);
    });
  });
});

describe('String utilities', () => {
  describe('String methods', () => {
    it('should trim strings', () => {
      expect('  hello  '.trim()).toBe('hello');
    });

    it('should convert to lowercase', () => {
      expect('HELLO'.toLowerCase()).toBe('hello');
    });

    it('should convert to uppercase', () => {
      expect('hello'.toUpperCase()).toBe('HELLO');
    });

    it('should split strings', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    });

    it('should replace substrings', () => {
      expect('hello world'.replace('world', 'there')).toBe('hello there');
    });

    it('should check if string starts with', () => {
      expect('hello world'.startsWith('hello')).toBe(true);
      expect('hello world'.startsWith('world')).toBe(false);
    });

    it('should check if string ends with', () => {
      expect('hello world'.endsWith('world')).toBe(true);
      expect('hello world'.endsWith('hello')).toBe(false);
    });

    it('should check if string includes', () => {
      expect('hello world'.includes('lo wo')).toBe(true);
      expect('hello world'.includes('xyz')).toBe(false);
    });
  });
});

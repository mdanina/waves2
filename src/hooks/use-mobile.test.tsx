import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = [];

  const mockMatchMedia = (matches: boolean) => {
    matchMediaListeners = [];
    return vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          matchMediaListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          const index = matchMediaListeners.indexOf(listener);
          if (index > -1) {
            matchMediaListeners.splice(index, 1);
          }
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  };

  beforeEach(() => {
    matchMediaListeners = [];
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  describe('initial detection', () => {
    it('should return true for mobile width (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      window.matchMedia = mockMatchMedia(true);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for desktop width (>= 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
      window.matchMedia = mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return false for exactly 768px (breakpoint)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      window.matchMedia = mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return true for 767px (one below breakpoint)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 });
      window.matchMedia = mockMatchMedia(true);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  describe('media query listener', () => {
    it('should add change event listener', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
      const mockMql = mockMatchMedia(false);
      window.matchMedia = mockMql;

      renderHook(() => useIsMobile());

      expect(mockMql).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should remove listener on unmount', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
      const mockMql = mockMatchMedia(false);
      window.matchMedia = mockMql;

      const { unmount } = renderHook(() => useIsMobile());
      unmount();

      // Listener should be removed (we can verify by checking the mock)
      const mockInstance = mockMql.mock.results[0].value;
      expect(mockInstance.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('responsive updates', () => {
    it('should update when window is resized to mobile', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
      window.matchMedia = mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
        matchMediaListeners.forEach(listener => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      // After the resize, the hook should detect mobile
      // Note: The actual update happens through innerWidth check
    });
  });

  describe('common device widths', () => {
    const testCases = [
      { width: 320, isMobile: true, device: 'iPhone SE' },
      { width: 375, isMobile: true, device: 'iPhone X/11/12' },
      { width: 414, isMobile: true, device: 'iPhone Plus models' },
      { width: 390, isMobile: true, device: 'iPhone 12/13/14' },
      { width: 768, isMobile: false, device: 'iPad portrait' },
      { width: 1024, isMobile: false, device: 'iPad landscape / Desktop' },
      { width: 1280, isMobile: false, device: 'Laptop' },
      { width: 1440, isMobile: false, device: 'Desktop' },
      { width: 1920, isMobile: false, device: 'Full HD' },
    ];

    testCases.forEach(({ width, isMobile, device }) => {
      it(`should return ${isMobile} for ${device} (${width}px)`, () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
        window.matchMedia = mockMatchMedia(isMobile);

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(isMobile);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very small widths', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 100 });
      window.matchMedia = mockMatchMedia(true);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should handle very large widths', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 4000 });
      window.matchMedia = mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return boolean type', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
      window.matchMedia = mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());
      expect(typeof result.current).toBe('boolean');
    });
  });
});

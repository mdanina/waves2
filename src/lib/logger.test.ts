import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the Logger class behavior
// Since the logger is a singleton, we'll test the logging behavior

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error logging', () => {
    it('should always log errors', async () => {
      // Import fresh logger module
      const { logger } = await import('./logger');

      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Test error message');
    });

    it('should log Error objects', async () => {
      const { logger } = await import('./logger');

      const error = new Error('Test error');
      logger.error('Error occurred:', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error occurred:', error);
    });

    it('should log multiple arguments', async () => {
      const { logger } = await import('./logger');

      logger.error('Error', 123, { key: 'value' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error', 123, { key: 'value' });
    });
  });

  describe('log level methods exist', () => {
    it('should have log method', async () => {
      const { logger } = await import('./logger');
      expect(typeof logger.log).toBe('function');
    });

    it('should have info method', async () => {
      const { logger } = await import('./logger');
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', async () => {
      const { logger } = await import('./logger');
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', async () => {
      const { logger } = await import('./logger');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('in test environment', () => {
    // In test mode, only errors should be logged
    it('should not log regular messages in test mode', async () => {
      const { logger } = await import('./logger');

      logger.log('Test log');
      logger.info('Test info');
      logger.warn('Test warn');

      // In test environment, these should not be called
      // (only error always logs)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});

describe('Logger format', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prefix error messages with [ERROR]', async () => {
    const { logger } = await import('./logger');

    logger.error('Test');

    const call = consoleErrorSpy.mock.calls[0];
    expect(call[0]).toBe('[ERROR]');
  });

  it('should handle undefined and null arguments', async () => {
    const { logger } = await import('./logger');

    logger.error('Error with', undefined, null);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error with', undefined, null);
  });

  it('should handle empty arguments', async () => {
    const { logger } = await import('./logger');

    logger.error();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]');
  });
});

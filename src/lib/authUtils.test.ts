import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSessionValid, isSessionExpired } from './authUtils';
import type { Session } from '@supabase/supabase-js';

// Helper to create mock sessions
function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    refresh_token: 'mock-refresh-token',
    user: {
      id: 'user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    ...overrides,
  } as Session;
}

describe('isSessionValid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false for null session', () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it('should return false for session without access_token', () => {
    const session = createMockSession({ access_token: '' });
    expect(isSessionValid(session)).toBe(false);
  });

  it('should return false for session without expires_at', () => {
    const session = createMockSession({ expires_at: undefined });
    expect(isSessionValid(session)).toBe(false);
  });

  it('should return true for valid non-expired session', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 3600, // Expires in 1 hour
    });
    expect(isSessionValid(session)).toBe(true);
  });

  it('should return false for expired session', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now - 100, // Expired 100 seconds ago
    });
    expect(isSessionValid(session)).toBe(false);
  });

  it('should return false for session expiring within 60 seconds (buffer)', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 30, // Expires in 30 seconds (within 60 second buffer)
    });
    expect(isSessionValid(session)).toBe(false);
  });

  it('should return true for session expiring in more than 60 seconds', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 120, // Expires in 2 minutes
    });
    expect(isSessionValid(session)).toBe(true);
  });

  it('should handle edge case at exactly 60 seconds', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 60, // Expires in exactly 60 seconds
    });
    // Should be false because expires_at > now + 60 is false when expires_at === now + 60
    expect(isSessionValid(session)).toBe(false);
  });

  it('should handle edge case at 61 seconds', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 61, // Expires in 61 seconds
    });
    expect(isSessionValid(session)).toBe(true);
  });
});

describe('isSessionExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for null session', () => {
    expect(isSessionExpired(null)).toBe(true);
  });

  it('should return true for session without access_token', () => {
    const session = createMockSession({ access_token: '' });
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should return true for session without expires_at', () => {
    const session = createMockSession({ expires_at: undefined });
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should return false for valid non-expired session', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 3600, // Expires in 1 hour
    });
    expect(isSessionExpired(session)).toBe(false);
  });

  it('should return true for expired session', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now - 100, // Expired 100 seconds ago
    });
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should return true for session that just expired', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now - 1, // Expired 1 second ago
    });
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should return false for session expiring in 1 second', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now + 1, // Expires in 1 second
    });
    expect(isSessionExpired(session)).toBe(false);
  });

  it('should handle edge case at exactly current time', () => {
    const now = Math.floor(Date.now() / 1000);
    const session = createMockSession({
      expires_at: now, // Expires right now
    });
    // expires_at < now is false when equal, but it's essentially expired
    expect(isSessionExpired(session)).toBe(false); // Edge case: equal means not expired yet
  });
});

describe('Session validation security', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reject forged sessions without expires_at', () => {
    // Security test: someone might try to forge a session by not including expires_at
    const forgedSession = createMockSession({
      expires_at: undefined,
      access_token: 'forged-token',
    });
    expect(isSessionValid(forgedSession)).toBe(false);
    expect(isSessionExpired(forgedSession)).toBe(true);
  });

  it('should reject sessions with expires_at set to 0', () => {
    const session = createMockSession({
      expires_at: 0,
    });
    expect(isSessionValid(session)).toBe(false);
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should reject sessions with negative expires_at', () => {
    const session = createMockSession({
      expires_at: -1000,
    });
    expect(isSessionValid(session)).toBe(false);
    expect(isSessionExpired(session)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { applySessionResponse, clearSession, createInitialSessionState } from '@/core/auth/session-state';
import type { MobileSessionResponse } from '@/core/auth/types';

function sessionResponse(): MobileSessionResponse {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresAt: '2026-09-04T00:00:00Z',
    deviceInstallationId: '7d88b32d-130b-47f0-835f-79d871867d31',
    user: { id: 'a', email: 'person@example.com', displayName: 'Pessoa' },
  };
}

describe('session state', () => {
  it('keeps only the access token in in-memory session state', () => {
    const state = applySessionResponse(createInitialSessionState(), sessionResponse());

    expect(state.accessToken).toBe('access-token');
    expect(state.user?.email).toBe('person@example.com');
    expect('refreshToken' in state).toBe(false);
  });

  it('clears access and identity when a session cannot be restored', () => {
    const active = applySessionResponse(createInitialSessionState(), sessionResponse());

    expect(clearSession(active)).toEqual(createInitialSessionState());
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { applySessionResponse, clearSession, createInitialSessionState } from './session-state.ts';

test('keeps only the access token in in-memory session state', () => {
  const state = applySessionResponse(createInitialSessionState(), {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresAt: '2026-09-04T00:00:00Z',
    deviceInstallationId: '7d88b32d-130b-47f0-835f-79d871867d31',
    user: { id: 'a', email: 'person@example.com', displayName: 'Pessoa' },
  });

  assert.equal(state.accessToken, 'access-token');
  assert.equal(state.user?.email, 'person@example.com');
  assert.equal('refreshToken' in state, false);
});

test('clears access and identity when a session cannot be restored', () => {
  const active = applySessionResponse(createInitialSessionState(), {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresAt: '2026-09-04T00:00:00Z',
    deviceInstallationId: '7d88b32d-130b-47f0-835f-79d871867d31',
    user: { id: 'a', email: 'person@example.com', displayName: 'Pessoa' },
  });

  assert.deepEqual(clearSession(active), createInitialSessionState());
});

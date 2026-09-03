import type { MobileSessionResponse, SessionState } from './types';

export function createInitialSessionState(): SessionState {
  return { accessToken: null, expiresAt: null, user: null };
}

export function applySessionResponse(
  _current: SessionState,
  response: MobileSessionResponse,
): SessionState {
  return {
    accessToken: response.accessToken,
    expiresAt: response.expiresAt,
    user: response.user,
  };
}

export function clearSession(_current: SessionState): SessionState {
  return createInitialSessionState();
}

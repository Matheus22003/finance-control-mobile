import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, request } from '@/core/api/request';

type FetchArguments = [input: string, init?: RequestInit];

function respondWith(status: number, body: unknown = null): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(...args: FetchArguments) => Promise<Response>>(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('sends the bearer token and bypasses the tunnel interstitial when authenticated', async () => {
    const fetchMock = stubFetch(respondWith(200, { ok: true }));

    await request('/api/v1/dashboard', {}, 'access-token');

    const [url, init] = fetchMock.mock.calls[0]!;
    const headers = init?.headers as Headers;
    expect(url).toMatch(/^https:\/\/.+\/api\/v1\/dashboard$/);
    expect(headers.get('Authorization')).toBe('Bearer access-token');
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('skip_zrok_interstitial')).toBe('true');
  });

  it('omits the bearer token for anonymous calls', async () => {
    const fetchMock = stubFetch(respondWith(200, { ok: true }));

    await request('/api/v1/auth/login', { method: 'POST', body: '{}' });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('exposes the http status on failures so callers can react to 401', async () => {
    stubFetch(respondWith(401, { detail: 'The supplied email or password is invalid.' }));

    await expect(request('/api/v1/debts', {}, 'expired')).rejects.toThrowError(
      expect.objectContaining({ status: 401, message: 'The supplied email or password is invalid.' }),
    );
  });

  it('falls back to the problem title when no detail is present', async () => {
    stubFetch(respondWith(403, { title: 'Email not confirmed' }));

    const error = await request('/api/v1/debts', {}, 'token').catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Email not confirmed');
    expect((error as ApiError).status).toBe(403);
  });

  it('resolves with undefined for empty 204 responses', async () => {
    stubFetch(respondWith(204));

    await expect(request('/api/v1/debts/debt-id', { method: 'DELETE' }, 'token')).resolves.toBeUndefined();
  });
});

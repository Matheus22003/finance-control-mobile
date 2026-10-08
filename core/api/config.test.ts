import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from '@/core/api/config';

describe('resolveApiBaseUrl', () => {
  it('allows HTTPS BFF addresses and loopback HTTP only for development', () => {
    expect(resolveApiBaseUrl('https://bff.example/')).toBe('https://bff.example');
    expect(resolveApiBaseUrl('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
  });

  it('rejects insecure non-loopback and malformed BFF addresses', () => {
    expect(() => resolveApiBaseUrl('http://bff.example')).toThrow();
    expect(() => resolveApiBaseUrl('not-a-url')).toThrow();
  });
});

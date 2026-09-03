import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveApiBaseUrl } from './config.ts';

test('allows HTTPS BFF addresses and loopback HTTP only for development', () => {
  assert.equal(resolveApiBaseUrl('https://bff.example/'), 'https://bff.example');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:8080/'), 'http://127.0.0.1:8080');
});

test('rejects insecure non-loopback and malformed BFF addresses', () => {
  assert.throws(() => resolveApiBaseUrl('http://bff.example'));
  assert.throws(() => resolveApiBaseUrl('not-a-url'));
});

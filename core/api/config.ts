const defaultApiBaseUrl = 'https://finance-control.shares.zrok.io';

export function resolveApiBaseUrl(candidate = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiBaseUrl): string {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be an absolute BFF URL.');
  }

  const isLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
    throw new Error('The BFF URL must use HTTPS outside loopback development.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('The BFF URL must not contain credentials, query parameters, or fragments.');
  }
  return parsed.toString().replace(/\/$/, '');
}

export const apiBaseUrl = resolveApiBaseUrl();

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

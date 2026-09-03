import { apiUrl } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('skip_zrok_interstitial', 'true');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(apiUrl(path), { ...options, headers });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { detail?: string; title?: string } | null;
    throw new ApiError(detail?.detail || detail?.title || 'Não foi possível concluir a solicitação.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

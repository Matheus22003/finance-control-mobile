import { ApiError } from '@/core/api/request';

export async function withAuthorizedAccessToken<T>(
  accessToken: string | null,
  refresh: () => Promise<string | null>,
  operation: (token: string) => Promise<T>,
): Promise<T> {
  if (!accessToken) throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  try {
    return await operation(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const rotatedAccessToken = await refresh();
    if (!rotatedAccessToken) throw error;
    return operation(rotatedAccessToken);
  }
}

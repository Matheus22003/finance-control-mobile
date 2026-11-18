import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/core/api/request';
import { withAuthorizedAccessToken } from './authorized-request';

describe('withAuthorizedAccessToken', () => {
  it('retries a 401 with the rotated access token', async () => {
    const refresh = vi.fn().mockResolvedValue('rotated-token');
    const operation = vi.fn()
      .mockRejectedValueOnce(new ApiError('expired', 401))
      .mockResolvedValueOnce('ok');

    await expect(withAuthorizedAccessToken('expired-token', refresh, operation)).resolves.toBe('ok');
    expect(refresh).toHaveBeenCalledOnce();
    expect(operation).toHaveBeenNthCalledWith(1, 'expired-token');
    expect(operation).toHaveBeenNthCalledWith(2, 'rotated-token');
  });

  it('preserves non-auth failures without refreshing', async () => {
    const refresh = vi.fn();
    const failure = new ApiError('server failure', 503);

    await expect(withAuthorizedAccessToken('access-token', refresh, async () => {
      throw failure;
    })).rejects.toBe(failure);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('fails immediately when there is no access token', async () => {
    const operation = vi.fn();

    await expect(withAuthorizedAccessToken(null, vi.fn(), operation)).rejects.toMatchObject({ status: 401 });
    expect(operation).not.toHaveBeenCalled();
  });
});
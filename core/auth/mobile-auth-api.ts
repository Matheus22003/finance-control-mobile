import { request } from '@/core/api/request';

import type { MobileSessionResponse } from './types';

export type MobileLoginInput = {
  email: string;
  password: string;
  deviceInstallationId: string;
  deviceName: string;
  platform: 'android' | 'ios';
  appVersion: string;
};

export async function mobileLogin(input: MobileLoginInput): Promise<MobileSessionResponse> {
  return request<MobileSessionResponse>('/api/v1/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function mobileRefresh(
  refreshToken: string,
  deviceInstallationId: string,
): Promise<MobileSessionResponse> {
  return request<MobileSessionResponse>('/api/v1/auth/mobile/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken, deviceInstallationId }),
  });
}

export async function mobileLogout(refreshToken: string, deviceInstallationId: string): Promise<void> {
  return request<void>('/api/v1/auth/mobile/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken, deviceInstallationId }),
  });
}

import { request } from '@/core/api/request';

export const MOBILE_DEVICES_PATH = '/api/v1/notifications/mobile-devices';

export type MobilePushTestResponse = {
  configured: boolean;
  deviceCount: number;
  acceptedCount: number;
  rejectedCount: number;
};

export type MobileDeviceRegistration = {
  installationId: string;
  expoPushToken: string;
  platform: 'android' | 'ios';
  appVersion: string;
};

export function registerMobileDevice(
  accessToken: string,
  device: MobileDeviceRegistration,
): Promise<void> {
  return request<void>(MOBILE_DEVICES_PATH, {
    method: 'POST',
    body: JSON.stringify(device),
  }, accessToken);
}

export function unregisterMobileDevice(
  accessToken: string,
  device: Pick<MobileDeviceRegistration, 'installationId'>,
  platform: MobileDeviceRegistration['platform'],
): Promise<void> {
  return request<void>(
    `${MOBILE_DEVICES_PATH}/${encodeURIComponent(device.installationId)}/${platform}`,
    {
    method: 'DELETE',
    },
    accessToken,
  );
}

export function sendMobilePushTest(
  accessToken: string,
  message: { title: string; body: string; route?: string },
): Promise<MobilePushTestResponse> {
  return request<MobilePushTestResponse>(`${MOBILE_DEVICES_PATH}/test`, {
    method: 'POST',
    body: JSON.stringify(message),
  }, accessToken);
}

import { request } from '@/core/api/request';

export const MOBILE_DEVICES_PATH = '/api/v1/notifications/mobile-devices';

export type MobileDeviceRegistration = {
  deviceInstallationId: string;
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
  device: Pick<MobileDeviceRegistration, 'deviceInstallationId'>,
  platform: MobileDeviceRegistration['platform'],
): Promise<void> {
  return request<void>(
    `${MOBILE_DEVICES_PATH}/${encodeURIComponent(device.deviceInstallationId)}/${platform}`,
    {
    method: 'DELETE',
    },
    accessToken,
  );
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notificationResponseListener: vi.fn(),
  notificationReceivedListener: vi.fn(),
  removeResponseListener: vi.fn(),
  removeReceivedListener: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  registerMobileDevice: vi.fn(),
  unregisterMobileDevice: vi.fn(),
}));

vi.mock('expo-device', () => ({ isDevice: true }));
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: { eas: { projectId: 'project-id' } } },
  },
}));
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: mocks.getPermissionsAsync,
  requestPermissionsAsync: mocks.requestPermissionsAsync,
  getExpoPushTokenAsync: mocks.getExpoPushTokenAsync,
  addNotificationResponseReceivedListener: mocks.notificationResponseListener,
  addNotificationReceivedListener: mocks.notificationReceivedListener,
}));
vi.mock('@/core/api/mobile-device-api', () => ({
  registerMobileDevice: mocks.registerMobileDevice,
  unregisterMobileDevice: mocks.unregisterMobileDevice,
}));

const {
  notificationResponseListener,
  notificationReceivedListener,
  removeResponseListener,
  removeReceivedListener,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  registerMobileDevice,
  unregisterMobileDevice,
} = mocks;

import * as Device from 'expo-device';
import {
  getExpoPushToken,
  initializePushNotifications,
  mapNotificationResponseToRoute,
} from '@/core/notifications/push';

const response = (data: Record<string, unknown>) => ({
  notification: { request: { content: { data } } },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Device).isDevice = true;
  getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
  requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[test]' });
  registerMobileDevice.mockResolvedValue(undefined);
  unregisterMobileDevice.mockResolvedValue(undefined);
  notificationResponseListener.mockReturnValue({ remove: removeResponseListener });
  notificationReceivedListener.mockReturnValue({ remove: removeReceivedListener });
});

describe('getExpoPushToken', () => {
  it('does not ask for permission or create a token on a non-device runtime', async () => {
    vi.mocked(Device).isDevice = false;

    await expect(getExpoPushToken()).resolves.toBeNull();

    expect(getPermissionsAsync).not.toHaveBeenCalled();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('requests permission before obtaining the Expo token', async () => {
    await expect(getExpoPushToken()).resolves.toBe('ExponentPushToken[test]');

    expect(requestPermissionsAsync).toHaveBeenCalledOnce();
    expect(getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-id' });
  });

  it('does not obtain a token when permission is denied', async () => {
    requestPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(getExpoPushToken()).resolves.toBeNull();

    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

describe('mapNotificationResponseToRoute', () => {
  it('maps an internal route and primitive params', () => {
    expect(mapNotificationResponseToRoute(response({ route: '/debt/[id]', params: { id: 'debt-1' } }))).toEqual({
      pathname: '/debt/[id]',
      params: { id: 'debt-1' },
    });
  });

  it('rejects external and malformed routes', () => {
    expect(mapNotificationResponseToRoute(response({ route: 'https://example.com' }))).toBeNull();
    expect(mapNotificationResponseToRoute(response({ route: '//example.com' }))).toBeNull();
    expect(mapNotificationResponseToRoute(response({ route: 42 }))).toBeNull();
  });
});

describe('initializePushNotifications', () => {
  it('registers a device and unregisters it with the same installation id', async () => {
    const registration = await initializePushNotifications({
      accessToken: 'access-token',
      installationId: 'installation-id',
      platform: 'android',
      appVersion: '1.0.0',
      onRoute: vi.fn(),
      onHint: vi.fn(),
    });

    expect(registerMobileDevice).toHaveBeenCalledWith('access-token', {
      installationId: 'installation-id',
      expoPushToken: 'ExponentPushToken[test]',
      platform: 'android',
      appVersion: '1.0.0',
    });

    await registration?.unregister();
    expect(unregisterMobileDevice).toHaveBeenCalledWith('access-token', {
      installationId: 'installation-id',
    }, 'android');
    expect(removeResponseListener).toHaveBeenCalledOnce();
    expect(removeReceivedListener).toHaveBeenCalledOnce();
  });

  it('maps response routes and emits a hint for the app to reread BFF state', async () => {
    const onRoute = vi.fn();
    const onHint = vi.fn();
    await initializePushNotifications({
      accessToken: 'access-token',
      installationId: 'installation-id',
      platform: 'ios',
      appVersion: '1.0.0',
      onRoute,
      onHint,
    });

    const responseHandler = notificationResponseListener.mock.calls[0][0];
    await responseHandler(response({ route: '/(tabs)/debts' }));

    expect(onRoute).toHaveBeenCalledWith({ pathname: '/(tabs)/debts' });
    expect(onHint).toHaveBeenCalledOnce();
  });

  it('reports token acquisition failures without exposing the error or token', async () => {
    const onError = vi.fn();
    getExpoPushTokenAsync.mockRejectedValue(new Error('secret provider response'));

    await expect(initializePushNotifications({
      accessToken: 'access-token',
      installationId: 'installation-id',
      platform: 'android',
      appVersion: '1.0.0',
      onRoute: vi.fn(),
      onError,
    })).resolves.toBeNull();

    expect(onError).toHaveBeenCalledWith('token-acquisition-failed');
    expect(registerMobileDevice).not.toHaveBeenCalled();
    expect(onError.mock.calls.flat()).not.toContain('secret provider response');
  });

  it('reports registration failures without exposing the request or server error', async () => {
    const onError = vi.fn();
    registerMobileDevice.mockRejectedValue(new Error('secret server response'));

    await expect(initializePushNotifications({
      accessToken: 'access-token',
      installationId: 'installation-id',
      platform: 'android',
      appVersion: '1.0.0',
      onRoute: vi.fn(),
      onError,
    })).resolves.toBeNull();

    expect(onError).toHaveBeenCalledWith('registration-failed');
    expect(onError.mock.calls.flat()).not.toContain('secret server response');
  });

  it('reports denied permission without attempting token acquisition', async () => {
    const onError = vi.fn();
    requestPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(initializePushNotifications({
      accessToken: 'access-token',
      installationId: 'installation-id',
      platform: 'android',
      appVersion: '1.0.0',
      onRoute: vi.fn(),
      onError,
    })).resolves.toBeNull();

    expect(onError).toHaveBeenCalledWith('permission-denied');
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

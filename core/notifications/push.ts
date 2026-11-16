import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import {
  registerMobileDevice,
  unregisterMobileDevice,
  type MobileDeviceRegistration,
} from '@/core/api/mobile-device-api';

export type PushRouteTarget = {
  pathname: string;
  params?: Record<string, string>;
};

type NotificationResponseLike = {
  notification?: {
    request?: {
      content?: {
        data?: unknown;
      };
    };
  };
};

export type PushRegistrationOptions = {
  accessToken: string;
  deviceInstallationId: string;
  platform: MobileDeviceRegistration['platform'];
  appVersion: string;
  onRoute(target: PushRouteTarget): void | Promise<void>;
  onHint?(notification?: unknown): void | Promise<void>;
};

export type PushRegistration = {
  pushToken: string;
  unregister(): Promise<void>;
};

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function permissionGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  return permission.granted;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  let permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) {
    if (permission.canAskAgain === false) return null;
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permissionGranted(permission)) return null;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId() ? { projectId: projectId() } : undefined,
  );
  return token.data;
}

function routeData(response: NotificationResponseLike): Record<string, unknown> | null {
  const data = response.notification?.request?.content?.data;
  return data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
}

function routeParams(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const params = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item))
      .map(([key, item]) => [key, String(item)]),
  );
  return Object.keys(params).length > 0 ? params : undefined;
}

export function mapNotificationResponseToRoute(
  response: NotificationResponseLike,
): PushRouteTarget | null {
  const data = routeData(response);
  if (!data) return null;
  const pathname = typeof data.route === 'string' ? data.route : data.path;
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return null;
  }

  return {
    pathname,
    params: routeParams(data.params ?? data.routeParams),
  };
}

export async function initializePushNotifications(
  options: PushRegistrationOptions,
): Promise<PushRegistration | null> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) return null;

  const device: MobileDeviceRegistration = {
    deviceInstallationId: options.deviceInstallationId,
    expoPushToken: pushToken,
    platform: options.platform,
    appVersion: options.appVersion,
  };
  await registerMobileDevice(options.accessToken, device);

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    void (async () => {
      const target = mapNotificationResponseToRoute(response);
      if (target) await options.onRoute(target);
      await options.onHint?.(response);
    })();
  });
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    void options.onHint?.(notification);
  });

  let unregistered = false;
  return {
    pushToken,
    async unregister() {
      if (unregistered) return;
      unregistered = true;
      responseSubscription.remove();
      receivedSubscription.remove();
      await unregisterMobileDevice(options.accessToken, {
        deviceInstallationId: options.deviceInstallationId,
      }, options.platform);
    },
  };
}

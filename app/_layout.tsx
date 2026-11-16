import Constants from 'expo-constants';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { getDashboard } from '@/core/api/finance-api';
import { AuthProvider, useAuth } from '@/core/auth/auth-context';
import { getInstallationId } from '@/core/auth/secure-session';
import { initializePushNotifications, type PushRegistration } from '@/core/notifications/push';

SplashScreen.preventAutoHideAsync();
export { ErrorBoundary } from 'expo-router';

function PushRegistration() {
  const router = useRouter();
  const { accessToken, authorizedRequest, isRestoring } = useAuth();
  const registrationRef = useRef<PushRegistration | null>(null);

  useEffect(() => {
    let active = true;
    const cleanup = () => {
      active = false;
      const registration = registrationRef.current;
      registrationRef.current = null;
      void registration?.unregister().catch(() => undefined);
    };

    if (isRestoring || !accessToken) return cleanup;

    void (async () => {
      try {
        const registration = await initializePushNotifications({
          accessToken,
          installationId: await getInstallationId(),
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion: Constants.expoConfig?.version ?? '1.0.0',
          onRoute: target => router.push(target as never),
          // Push is only a hint. Screens reread their canonical BFF state after routing;
          // this dashboard read also refreshes the authenticated session boundary.
          onHint: () => authorizedRequest(getDashboard).then(() => undefined).catch(() => undefined),
        });

        if (!active) await registration?.unregister();
        else registrationRef.current = registration;
      } catch {
        // Push registration is optional and must not block authenticated app startup.
      }
    })();

    return cleanup;
  }, [accessToken, authorizedRequest, isRestoring, router]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold });

  useEffect(() => {
    if (error) throw error;
  }, [error]);
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;

  return (
    <AuthProvider>
      <PushRegistration />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="debt-create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="debt/[id]" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="settlement" />
        <Stack.Screen name="transaction-edit" />
      </Stack>
    </AuthProvider>
  );
}

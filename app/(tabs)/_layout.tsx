import { Redirect, Tabs } from 'expo-router';

import { MobileTabBar } from '@/components/MobileTabBar';
import { useAuth } from '@/core/auth/auth-context';

export default function TabsLayout() {
  const { accessToken, isRestoring } = useAuth();
  if (isRestoring) return null;
  if (!accessToken) return <Redirect href="/login" />;

  return (
    <Tabs tabBar={(props) => <MobileTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="finances" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="debts" />
      <Tabs.Screen name="friends" />
    </Tabs>
  );
}

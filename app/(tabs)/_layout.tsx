import { Tabs } from 'expo-router';
import { MobileTabBar } from '@/components/MobileTabBar';
export default function TabsLayout(){return <Tabs tabBar={(props)=><MobileTabBar {...props}/>} screenOptions={{headerShown:false}}><Tabs.Screen name="index"/><Tabs.Screen name="finances"/><Tabs.Screen name="reports"/><Tabs.Screen name="debts"/><Tabs.Screen name="friends"/></Tabs>}

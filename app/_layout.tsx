import { Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router'; import * as SplashScreen from 'expo-splash-screen'; import { useEffect } from 'react'; import 'react-native-reanimated';
SplashScreen.preventAutoHideAsync(); export { ErrorBoundary } from 'expo-router';
export default function RootLayout(){const [loaded,error]=useFonts({Inter_400Regular,Inter_500Medium,Inter_700Bold,Inter_800ExtraBold});useEffect(()=>{if(error)throw error},[error]);useEffect(()=>{if(loaded)SplashScreen.hideAsync()},[loaded]);if(!loaded)return null;return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="(tabs)"/><Stack.Screen name="create" options={{presentation:'modal'}}/></Stack>}

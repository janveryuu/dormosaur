import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold, useFonts } from '@expo-google-fonts/geist'
import { Gelasio_500Medium, Gelasio_700Bold } from '@expo-google-fonts/gelasio'
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { color } from '@/design/tokens'
import { AppProvider, useApp } from '@/state/app'

SplashScreen.preventAutoHideAsync()

function Routes() {
  const { ready, demo, session, profile } = useApp()
  const signedIn = demo || !!session
  const onboarded = demo || !!profile?.onboarding_completed

  useEffect(() => { if (ready) SplashScreen.hideAsync() }, [ready])
  if (!ready) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.8, 0.95], sheetGrabberVisible: true, sheetCornerRadius: 32, contentStyle: { backgroundColor: color.card } }} />
        <Stack.Screen name="class" options={{ presentation: 'modal', contentStyle: { backgroundColor: color.card } }} />
        <Stack.Screen name="task" options={{ presentation: 'modal', contentStyle: { backgroundColor: color.card } }} />
        <Stack.Screen name="import" />
        <Stack.Screen name="import-tasks" />
        <Stack.Screen name="copilot" />
        <Stack.Screen name="wallpaper" />
        <Stack.Screen name="meal-pick" options={{ presentation: 'modal', contentStyle: { backgroundColor: color.card } }} />
        <Stack.Screen name="alarms" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="recipe/[slug]" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold, Gelasio_500Medium, Gelasio_700Bold })
  if (!loaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.canvas }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Routes />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

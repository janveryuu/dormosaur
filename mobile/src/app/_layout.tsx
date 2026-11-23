import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '@/design/theme'
import { AppProvider, useApp } from '@/state/app'

SplashScreen.preventAutoHideAsync()

function Routes() {
  const { ready, demo, session, profile } = useApp()
  const { c, dark } = useTheme()
  const signedIn = demo || !!session
  const onboarded = demo || !!profile?.onboarding_completed

  useEffect(() => { if (ready) SplashScreen.hideAsync() }, [ready])
  useEffect(() => { SystemUI.setBackgroundColorAsync(c.bg).catch(() => {}) }, [c.bg])
  if (!ready) return null

  const sheet = { presentation: 'formSheet' as const, sheetGrabberVisible: true, sheetCornerRadius: 28, contentStyle: { backgroundColor: c.grouped } }
  const modal = { presentation: 'modal' as const, contentStyle: { backgroundColor: c.grouped } }

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'default', gestureEnabled: true }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
        {/* Scanner and class editor are also reachable from onboarding's schedule step. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="scan" />
          <Stack.Screen name="class" options={modal} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="add" options={{ ...sheet, sheetAllowedDetents: [0.78, 1] }} />
          <Stack.Screen name="task" options={modal} />
          <Stack.Screen name="import-tasks" />
          <Stack.Screen name="alarms" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="pro" options={{ presentation: 'modal', contentStyle: { backgroundColor: c.bg } }} />
          <Stack.Screen name="wallpaper" />
          <Stack.Screen name="widgets" />
          <Stack.Screen name="copilot" />
          <Stack.Screen name="meal-pick" options={{ ...sheet, sheetAllowedDetents: [0.7, 1] }} />
          <Stack.Screen name="recipe/[slug]" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <Routes />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

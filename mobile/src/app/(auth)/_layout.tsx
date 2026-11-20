import { Stack } from 'expo-router'
import { color } from '@/design/tokens'

export const unstable_settings = { anchor: 'welcome' }

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }} />
}

import { Tabs } from 'expo-router/js-tabs'
import { useTheme } from '@/design/theme'
import { TabBar } from '@/ui/tab-bar'

export default function TabsLayout() {
  const { c } = useTheme()
  return (
    <Tabs
      tabBar={props => <TabBar {...(props as unknown as Parameters<typeof TabBar>[0])} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.grouped }, animation: 'shift' }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="kitchen" />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}

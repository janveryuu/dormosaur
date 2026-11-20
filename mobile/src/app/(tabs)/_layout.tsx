import { Tabs } from 'expo-router/js-tabs'
import { TabBar } from '@/components/tab-bar'
import { color } from '@/design/tokens'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <TabBar {...(props as unknown as Parameters<typeof TabBar>[0])} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.canvas } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="kitchen" />
    </Tabs>
  )
}

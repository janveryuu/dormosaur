import { router } from 'expo-router'
import { CalendarDays, CookingPot, House, ListChecks, Plus, type LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { color, font, radius, shadowFloat } from '@/design/tokens'
import { Press, T } from './ui'

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Today' },
  schedule: { icon: CalendarDays, label: 'Schedule' },
  tasks: { icon: ListChecks, label: 'Tasks' },
  kitchen: { icon: CookingPot, label: 'Kitchen' },
}

const HREF = { index: '/', schedule: '/schedule', tasks: '/tasks', kitchen: '/kitchen' } as const

type Props = {
  state: { index: number; routes: { key: string; name: string }[] }
  navigation?: { emit?: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } | undefined }
}

/** Floating pill tab bar (active tab = green capsule) with a detached quick-add button. */
export function TabBar({ state, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const bottom = Math.max(insets.bottom, 14)

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 14, right: 14, bottom, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: color.card, borderRadius: radius.pill, borderWidth: 1, borderColor: color.line, padding: 5, height: 66 }, shadowFloat]}>
        {state.routes.map((route, i) => {
          const meta = ICONS[route.name]
          if (!meta) return null
          const focused = state.index === i
          const Icon = meta.icon
          return (
            <Press key={route.key} haptic accessibilityRole="tab" accessibilityLabel={meta.label} accessibilityState={{ selected: focused }}
              onPress={() => {
                const e = navigation?.emit?.({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!focused && !e?.defaultPrevented) router.navigate(HREF[route.name as keyof typeof HREF])
              }}
              style={[{ flex: 1, height: '100%', borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: 2 },
                focused && { backgroundColor: color.green, borderWidth: 2, borderColor: color.greenSoft, outlineWidth: 2, outlineColor: color.green } as object]}>
              <Icon size={20} color={focused ? color.white : color.inkSoft} strokeWidth={focused ? 2.3 : 1.9} />
              <T style={{ fontFamily: focused ? font.bold : font.medium, fontSize: 11, color: focused ? color.white : color.inkSoft }}>{meta.label}</T>
            </Press>
          )
        })}
      </View>
      <Press haptic onPress={() => router.push('/add')} accessibilityLabel="Add" accessibilityRole="button"
        style={[{ width: 62, height: 62, borderRadius: 31, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }, shadowFloat]}>
        <Plus size={28} color={color.white} strokeWidth={2.4} />
      </Press>
    </View>
  )
}

/** Bottom padding for scroll views so content clears the floating bar. */
export const TAB_CLEARANCE = 120

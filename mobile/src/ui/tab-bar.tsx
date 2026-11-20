import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import { CalendarDays, ChefHat, House, ListChecks, Plus, type LucideIcon } from 'lucide-react-native'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { elevation, useTheme } from '@/design/theme'
import { Press, haptic } from './index'

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  today: { icon: House, label: 'Today' },
  schedule: { icon: CalendarDays, label: 'Schedule' },
  tasks: { icon: ListChecks, label: 'Tasks' },
  kitchen: { icon: ChefHat, label: 'Kitchen' },
}

type Props = { state: { index: number; routes: { key: string; name: string }[] } }

/** Floating glass pill with a spring-sliding indicator, plus a separate + button. */
export function TabBar({ state }: Props) {
  const { c, dark } = useTheme()
  const insets = useSafeAreaInsets()
  const [w, setW] = useState(0)
  const n = state.routes.length
  const seg = (w - 8) / n
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(state.index * seg, { damping: 19, stiffness: 230, mass: 0.8 }) }] }))

  const glass = (child: React.ReactNode, style: object) => (
    <View style={[{ overflow: 'hidden', borderWidth: 1, borderColor: c.glassBorder }, elevation(c, 3), style]}>
      {Platform.OS === 'ios'
        ? <BlurView intensity={60} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={{ position: 'absolute', inset: 0 }} />
        : <View style={{ position: 'absolute', inset: 0, backgroundColor: dark ? 'rgba(24,26,25,0.96)' : 'rgba(255,255,255,0.97)' }} />}
      {child}
    </View>
  )

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {glass(
        <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', padding: 4, height: 64 }}>
          {w > 0 && <Animated.View style={[{ position: 'absolute', top: 4, left: 4, bottom: 4, width: seg, borderRadius: 28, backgroundColor: c.greenSoft }, indicator]} />}
          {state.routes.map((r, i) => {
            const meta = ICONS[r.name]
            if (!meta) return null
            const on = state.index === i
            const Icon = meta.icon
            return (
              <Pressable key={r.key} accessibilityRole="tab" accessibilityLabel={meta.label} accessibilityState={{ selected: on }}
                onPress={() => { if (!on) { haptic.select(); router.navigate(`/${r.name}` as never) } }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <Icon size={22} color={on ? c.green : c.ink2} strokeWidth={on ? 2.5 : 2} />
                <Animated.Text style={{ fontSize: 10, fontWeight: on ? '700' : '500', color: on ? c.green : c.ink2 }}>{meta.label}</Animated.Text>
              </Pressable>
            )
          })}
        </View>,
        { flex: 1, borderRadius: 32 },
      )}
      <Press onPress={() => router.push('/add')} accessibilityLabel="Add" scale={0.88}
        style={[{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }, elevation(c, 3)]}>
        <Plus size={28} color={c.onGreen} strokeWidth={2.6} />
      </Press>
    </View>
  )
}

/** Space to leave under scroll content so it clears the floating tab bar. */
export const TAB_CLEARANCE = 110

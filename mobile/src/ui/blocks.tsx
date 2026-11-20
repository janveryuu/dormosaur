import { router } from 'expo-router'
import { Check, MapPin } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'
import { layout, springSnappy } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import type { ClassEntry, Deadline } from '@/lib/repo'
import { clockOf, formatRange, relativeDue } from '@/lib/time'
import { Press, T, haptic } from './index'

/** Re-renders every `ms` so countdowns stay live. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id) }, [ms])
  return now
}

export function ClassRow({ entry, live, past }: { entry: ClassEntry; live?: boolean; past?: boolean }) {
  const { c, subject } = useTheme()
  const tone = subject(entry.color)
  return (
    <Press onPress={() => router.push({ pathname: '/class', params: { id: entry.id } })} scale={0.98} accessibilityLabel={entry.subject}
      style={{ flexDirection: 'row', gap: 12, padding: 14, paddingLeft: 12, borderRadius: radius.md, backgroundColor: tone.bg, opacity: past ? 0.5 : 1 }}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: tone.bar }} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T v="headline" color={tone.ink} numberOfLines={1} style={{ flex: 1 }}>{entry.code || entry.subject}</T>
          {live && <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: tone.bar }}><T v="caption" color="#fff" style={{ fontWeight: '800' }}>NOW</T></View>}
        </View>
        {entry.code ? <T v="footnote" color={tone.ink} numberOfLines={1} style={{ opacity: 0.85 }}>{entry.subject}</T> : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
          <T v="footnote" color={tone.ink} style={{ fontWeight: '600' }}>{formatRange(entry.start, entry.end)}</T>
          {entry.room ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><MapPin size={12} color={tone.ink} /><T v="footnote" color={tone.ink} numberOfLines={1}>{entry.room}</T></View> : null}
        </View>
      </View>
    </Press>
  )
}

const TYPE_EMOJI: Record<string, string> = { exam: '📝', assignment: '📚', project: '🧪', quiz: '❓', other: '📌' }

export function TaskRow({ task, onToggle }: { task: Deadline; onToggle: () => void }) {
  const { c, subject } = useTheme()
  const tone = subject(task.color)
  const pop = useSharedValue(1)
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }))
  const overdue = !task.completed && new Date(task.due) < new Date()
  return (
    <Animated.View layout={layout}>
      <Press onPress={() => router.push({ pathname: '/task', params: { id: task.id } })} scale={0.98} accessibilityLabel={task.title}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, backgroundColor: c.card, borderWidth: c.scheme === 'dark' ? 1 : 0, borderColor: c.line }}>
        <Press onPress={() => { pop.set(withSequence(withSpring(1.25, springSnappy), withSpring(1, springSnappy))); if (!task.completed) haptic.success(); onToggle() }}
          haptics={false} scale={0.85} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`Complete ${task.title}`}>
          <Animated.View style={[{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: task.completed ? c.green : tone.bar, backgroundColor: task.completed ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }, popStyle]}>
            {task.completed && <Check size={16} color={c.onGreen} strokeWidth={3.2} />}
          </Animated.View>
        </Press>
        <View style={{ flex: 1, gap: 3 }}>
          <T v="headline" numberOfLines={1} color={task.completed ? c.ink3 : c.ink} style={task.completed && { textDecorationLine: 'line-through' }}>{task.title}</T>
          <T v="footnote" color={overdue ? c.danger : c.ink2}>{[TYPE_EMOJI[task.type] ?? '', task.code, `${relativeDue(task.due)} · ${clockOf(task.due)}`].filter(Boolean).join('  ')}</T>
        </View>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone.bar }} />
      </Press>
    </Animated.View>
  )
}

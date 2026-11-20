import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Check, FileText, Plus } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_CLEARANCE } from '@/components/tab-bar'
import { Card, Empty, IconButton, Press, ScreenHeader, Segmented, T } from '@/components/ui'
import { color, font, radius, shadow, subject } from '@/design/tokens'
import type { Deadline } from '@/lib/repo'
import { clockOf, relativeDue } from '@/lib/time'
import { useApp } from '@/state/app'

type Filter = 'open' | 'done'

export default function Tasks() {
  const insets = useSafeAreaInsets()
  const { deadlines, saveDeadline } = useApp()
  const [filter, setFilter] = useState<Filter>('open')

  const open = deadlines.filter(d => !d.completed)
  const [weekEnd] = useState(() => Date.now() + 7 * 86400_000)
  const thisWeek = open.filter(d => new Date(d.due).getTime() <= weekEnd).length

  const groups = useMemo(() => {
    const list = deadlines.filter(d => (filter === 'open' ? !d.completed : d.completed))
    const map = new Map<string, Deadline[]>()
    for (const d of filter === 'done' ? [...list].reverse() : list) {
      const key = relativeDue(d.due)
      map.set(key, [...(map.get(key) ?? []), d])
    }
    return [...map.entries()]
  }, [deadlines, filter])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.canvas }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 16, paddingBottom: TAB_CLEARANCE, gap: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 4 }}>
        <ScreenHeader eyebrow="Deadlines" title="What's due next." subtitle="Tick things off as you go."
          right={<>
            <IconButton icon={FileText} label="Import tasks" tone="soft" onPress={() => router.push('/import-tasks')} />
            <IconButton icon={Plus} label="New task" tone="green" onPress={() => router.push('/task')} />
          </>} />
      </View>

      <View style={[{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#1C4F35' }, shadow]}>
        <LinearGradient colors={[color.night, '#0B3A23']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <T v="label" style={{ color: color.highlight }}>Due this week</T>
            <T style={{ fontFamily: font.black, fontSize: 56, lineHeight: 62, letterSpacing: -2.5, color: color.white, fontVariant: ['tabular-nums'] }}>{thisWeek}</T>
            <T style={{ fontFamily: font.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{open.length} open in total</T>
          </View>
          <View style={{ alignItems: 'flex-end', paddingLeft: 16, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
            <T style={{ fontFamily: font.black, fontSize: 28, letterSpacing: -1, color: color.highlight }}>{deadlines.length - open.length}</T>
            <T style={{ fontFamily: font.bold, fontSize: 10, letterSpacing: 1.6, color: 'rgba(255,255,255,0.62)' }}>DONE</T>
          </View>
        </LinearGradient>
      </View>

      <Segmented<Filter> value={filter} onChange={setFilter} options={[{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }]} />

      {groups.length ? groups.map(([label, items]) => (
        <View key={label} style={{ gap: 8 }}>
          <T v="label" style={{ paddingHorizontal: 4, color: label === 'Overdue' ? color.coral : color.inkSoft }}>{label}</T>
          <Card pad={6}>
            {items.map((d, i) => (
              <Press key={d.id} onPress={() => router.push({ pathname: '/task', params: { id: d.id } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderTopWidth: i ? 1 : 0, borderColor: color.line }}>
                <Press haptic accessibilityLabel={d.completed ? 'Mark open' : 'Mark done'} hitSlop={8}
                  onPress={() => saveDeadline({ ...d, completed: !d.completed })}
                  style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: subject[d.color].dot, backgroundColor: d.completed ? subject[d.color].dot : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {d.completed && <Check size={15} color={color.white} strokeWidth={3} />}
                </Press>
                <View style={{ flex: 1 }}>
                  <T v="strong" numberOfLines={1} style={d.completed ? { textDecorationLine: 'line-through', color: color.inkMute } : undefined}>{d.title}</T>
                  <T v="meta" numberOfLines={1}>{[d.code, d.type[0].toUpperCase() + d.type.slice(1)].filter(Boolean).join(' · ')}</T>
                </View>
                <T style={{ fontFamily: font.bold, fontSize: 13, color: color.inkSoft }}>{clockOf(d.due)}</T>
              </Press>
            ))}
          </Card>
        </View>
      )) : (
        <Empty image={require('@/assets/mascots/dormosaur-you-got-this.png')} title={filter === 'open' ? 'Nothing due' : 'Nothing done yet'}
          action={filter === 'open' ? { title: 'Add task', onPress: () => router.push('/task') } : undefined} />
      )}
    </ScrollView>
  )
}

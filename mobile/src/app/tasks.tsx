import { router } from 'expo-router'
import { Plus, ScanText } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { layout, rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import type { Deadline } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Empty, IconButton, LargeTitle, NavHeader, Segmented, T } from '@/ui'
import { TaskRow } from '@/ui/blocks'

type Filter = 'upcoming' | 'done' | 'all'

function bucket(d: Deadline, now: Date) {
  const due = new Date(d.due)
  if (due < now) return 'Overdue'
  const days = Math.floor((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return 'This week'
  return 'Later'
}

export default function Tasks() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { deadlines, saveDeadline } = useApp()
  const [filter, setFilter] = useState<Filter>('upcoming')
  const now = new Date()
  const open = deadlines.filter(d => !d.completed)
  const list = filter === 'upcoming' ? open : filter === 'done' ? deadlines.filter(d => d.completed) : deadlines
  const groups = filter === 'upcoming'
    ? ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later'].map(k => ({ k, items: list.filter(d => bucket(d, now) === k) })).filter(g => g.items.length)
    : [{ k: '', items: list }]
  const week = open.filter(d => ['Today', 'Tomorrow', 'This week'].includes(bucket(d, now))).length
  const overdue = open.filter(d => bucket(d, now) === 'Overdue').length
  const doneCount = deadlines.length - open.length
  const pct = deadlines.length ? doneCount / deadlines.length : 0

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader />
      <LargeTitle title="Tasks" eyebrow="Deadline tracker" right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon={ScanText} label="Import from syllabus" onPress={() => router.push('/import-tasks')} />
          <IconButton icon={Plus} label="New task" tone="green" onPress={() => router.push('/task')} />
        </View>
      } />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)} style={{ flexDirection: 'row', gap: 10 }}>
          <Stat n={week} label="This week" tint={c.green} />
          <Stat n={overdue} label="Overdue" tint={overdue ? c.danger : c.ink3} />
          <View style={{ flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: c.card, gap: 8 }}>
            <T v="title2" style={{ fontVariant: ['tabular-nums'] }}>{Math.round(pct * 100)}%</T>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
              <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c.green }} />
            </View>
            <T v="caption" color={c.ink2}>Done</T>
          </View>
        </Animated.View>

        <Segmented value={filter} onChange={setFilter} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'done', label: 'Done' }, { value: 'all', label: 'All' }]} />

        {!list.length ? (
          <Empty image={require('@/assets/mascots/dormosaur-you-got-this.png')} title={filter === 'done' ? 'Nothing done yet' : 'All clear'}
            body={filter === 'done' ? 'Tick off a task and it lands here.' : 'Add a task or scan a syllabus to track deadlines.'}
            action={filter === 'done' ? undefined : 'Add task'} onAction={() => router.push('/task')} />
        ) : groups.map(g => (
          <Animated.View key={g.k || 'all'} layout={layout} style={{ gap: 10 }}>
            {g.k ? <T v="footnote" color={g.k === 'Overdue' ? c.danger : c.ink3} style={{ fontWeight: '700', textTransform: 'uppercase', marginLeft: 4 }}>{g.k}</T> : null}
            {g.items.map(d => <TaskRow key={d.id} task={d} onToggle={() => saveDeadline({ ...d, completed: !d.completed })} />)}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  )
}

function Stat({ n, label, tint }: { n: number; label: string; tint: string }) {
  const { c } = useTheme()
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: c.card, gap: 4 }}>
      <T v="title1" color={tint} style={{ fontVariant: ['tabular-nums'] }}>{n}</T>
      <T v="caption" color={c.ink2}>{label}</T>
    </View>
  )
}

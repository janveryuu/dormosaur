import { router } from 'expo-router'
import { Camera, ChevronRight, ClipboardType, FileUp, ListChecks, ListPlus, PencilLine, ScanText, type LucideIcon } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { useApp } from '@/state/app'
import { Press, T } from '@/ui'

/** "+" sheet: MySched-style choice grid, with Scan as the hero option. */
export default function Add() {
  const { c } = useTheme()
  const open = useApp().deadlines.filter(d => !d.completed).length
  const go = (href: Parameters<typeof router.push>[0]) => { router.back(); setTimeout(() => router.push(href), 60) }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 14 }}>
      <Animated.View entering={rise(0)} style={{ gap: 4, marginBottom: 8 }}>
        <T v="title1" center>Add your schedule</T>
        <T v="callout" color={c.ink2} center>Choose how you want to start.</T>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile i={1} hero icon={Camera} title="Scan photo" sub="Fastest way in" onPress={() => go({ pathname: '/scan', params: { src: 'library' } })} />
        <Tile i={2} icon={ClipboardType} title="Paste text" sub="From your portal" onPress={() => go({ pathname: '/scan', params: { src: 'text' } })} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile i={3} icon={FileUp} title="Import a file" sub="PDF or image" onPress={() => go({ pathname: '/scan', params: { src: 'file' } })} />
        <Tile i={4} icon={PencilLine} title="Add manually" sub="Type it yourself" onPress={() => go('/class')} />
      </View>

      <Animated.View entering={rise(5)} style={{ marginTop: 10, gap: 10 }}>
        <T v="footnote" color={c.ink3} style={{ fontWeight: '700', textTransform: 'uppercase', marginLeft: 4 }}>Tasks</T>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Wide icon={ListPlus} title="New task" onPress={() => go('/task')} />
          <Wide icon={ScanText} title="Scan syllabus" onPress={() => go('/import-tasks')} />
        </View>
        <Press onPress={() => go('/tasks')} accessibilityLabel={`My tasks, ${open} open`} scale={0.97}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 60, borderRadius: radius.md, paddingHorizontal: 16, backgroundColor: c.greenSoft }}>
          <ListChecks size={22} color={c.green} strokeWidth={2.3} />
          <View style={{ flex: 1 }}>
            <T v="headline">My tasks</T>
            <T v="footnote" color={c.ink2}>{open ? `${open} open ${open === 1 ? 'task' : 'tasks'}` : 'All caught up'}</T>
          </View>
          <ChevronRight size={20} color={c.green} />
        </Press>
      </Animated.View>
    </ScrollView>
  )
}

function Tile({ icon: Icon, title, sub, hero, onPress, i }: { icon: LucideIcon; title: string; sub: string; hero?: boolean; onPress: () => void; i: number }) {
  const { c } = useTheme()
  const fg = hero ? c.onGreen : c.ink
  return (
    <Animated.View entering={rise(i)} style={{ flex: 1 }}>
      <Press onPress={onPress} accessibilityLabel={title} scale={0.95}
        style={{ height: 150, borderRadius: radius.lg, padding: 18, justifyContent: 'space-between', backgroundColor: hero ? c.green : c.card }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: hero ? 'rgba(255,255,255,0.18)' : c.greenSoft }}>
          <Icon size={23} color={hero ? c.onGreen : c.green} strokeWidth={2.2} />
        </View>
        <View style={{ gap: 2 }}>
          <T v="headline" color={fg} style={{ fontWeight: '700' }}>{title}</T>
          <T v="footnote" color={hero ? c.onGreen : c.ink2} style={{ opacity: hero ? 0.85 : 1 }}>{sub}</T>
        </View>
      </Press>
    </Animated.View>
  )
}

function Wide({ icon: Icon, title, onPress }: { icon: LucideIcon; title: string; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Press onPress={onPress} accessibilityLabel={title} scale={0.96}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, borderRadius: radius.md, paddingHorizontal: 16, backgroundColor: c.card }}>
      <Icon size={20} color={c.green} strokeWidth={2.3} />
      <T v="headline">{title}</T>
    </Press>
  )
}

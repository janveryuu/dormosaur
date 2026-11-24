import { router } from 'expo-router'
import { BellRing } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Switch, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout, rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import type { Alarm } from '@/lib/repo'
import { formatTime, minutesOf } from '@/lib/time'
import { useApp } from '@/state/app'
import { openPaywall } from '@/lib/pro'
import { ProPill, useMyPro } from '@/ui/pro-gate'
import { Empty, NavHeader, Press, T, haptic } from '@/ui'

const LEADS: Alarm['lead'][] = [15, 30, 60]

function ringAt(a: Alarm, start: string) {
  const m = (minutesOf(start) - a.lead + 1440) % 1440
  return formatTime(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)
}

export default function Alarms() {
  const { isPro } = useMyPro()
  const { c, subject } = useTheme()
  const insets = useSafeAreaInsets()
  const { alarms, classes, saveAlarm, saveAlarms } = useApp()
  const [open, setOpen] = useState<string | null>(null)
  const on = alarms.filter(a => a.enabled).length
  const allOn = alarms.length > 0 && on === alarms.length

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader title="Class alarms" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: insets.bottom + 32 }}>
        <Animated.View entering={rise(0)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: c.green }}>
          <BellRing size={28} color={c.onGreen} />
          <View style={{ flex: 1 }}>
            <T v="title3" color={c.onGreen}>{on} of {alarms.length} on</T>
            <T v="footnote" color={c.onGreen} style={{ opacity: 0.85 }}>Rings before every class, even offline.</T>
          </View>
          {alarms.length > 0 && (
            <Switch value={allOn} onValueChange={v => { haptic.select(); void saveAlarms(alarms.map(a => ({ ...a, enabled: v }))) }}
              trackColor={{ true: 'rgba(255,255,255,0.4)', false: 'rgba(255,255,255,0.2)' }} thumbColor="#fff" accessibilityLabel="All alarms" />
          )}
        </Animated.View>

        {alarms.length ? alarms.map((a, i) => {
          const cls = classes.find(x => x.id === a.classId)
          const start = cls?.start || a.time
          const expanded = open === a.id
          const tone = subject(a.color)
          return (
            <Animated.View key={a.id} entering={rise(i + 1)} layout={layout} style={{ backgroundColor: a.enabled ? tone.bg : c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
              <Press onPress={() => setOpen(expanded ? null : a.id)} scale={0.98} accessibilityLabel={`${a.subject} alarm settings`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
                <View style={{ flex: 1 }}>
                  <T v="title1" color={a.enabled ? c.ink : c.ink3} style={{ fontVariant: ['tabular-nums'], fontWeight: '300', letterSpacing: -1 }}>{ringAt(a, start)}</T>
                  <T v="footnote" color={c.ink2} numberOfLines={1}>{a.code || a.subject} · {(cls?.days ?? [a.day]).join(' ')} · {a.lead} min before</T>
                </View>
                <Switch value={a.enabled} onValueChange={v => { haptic.select(); saveAlarm({ ...a, enabled: v }) }}
                  trackColor={{ true: c.green, false: c.fillStrong }} thumbColor="#fff" accessibilityLabel={`Alarm for ${a.subject}`} />
              </Press>
              {expanded && (
                <Animated.View entering={fade(0, 200)} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 18 }}>
                  {LEADS.map(l => {
                    // Free: 15 min before every class. Pro: choose per class.
                    const locked = !isPro && l !== 15
                    return (
                      <Press key={l} onPress={() => locked ? openPaywall('alarms') : saveAlarm({ ...a, lead: l })} scale={0.94} accessibilityState={{ selected: a.lead === l }}
                        accessibilityLabel={locked ? `${l} minutes before, Pro` : `${l} minutes before`}
                        style={{ flex: 1, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: a.lead === l ? c.green : c.fill }}>
                        <T v="subhead" color={a.lead === l ? c.onGreen : locked ? c.ink3 : c.ink2} style={{ fontWeight: '700' }}>{l} min</T>
                        {locked && <ProPill />}
                      </Press>
                    )
                  })}
                </Animated.View>
              )}
            </Animated.View>
          )
        }) : <Empty image={require('@/assets/images/sleeping-dino.png')} title="No alarms yet" body="Alarms appear automatically when you add classes." action="Scan schedule" onAction={() => router.replace('/scan')} />}
      </ScrollView>
    </View>
  )
}

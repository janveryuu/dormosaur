import { useState } from 'react'
import { ScrollView, Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeader } from '@/components/headers'
import { Card, Empty, Press, T } from '@/components/ui'
import { color, font, radius, subject } from '@/design/tokens'
import type { Alarm } from '@/lib/repo'
import { formatTime, minutesOf } from '@/lib/time'
import { useApp } from '@/state/app'

const LEADS: Alarm['lead'][] = [15, 30, 60]

function ringAt(alarm: Alarm, start: string) {
  const m = (minutesOf(start) - alarm.lead + 1440) % 1440
  return formatTime(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)
}

export default function Alarms() {
  const insets = useSafeAreaInsets()
  const { alarms, classes, saveAlarm } = useApp()
  const [open, setOpen] = useState<string | null>(null)
  const on = alarms.filter(a => a.enabled).length

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <PageHeader title="Alarms" right={
        <View style={{ backgroundColor: color.greenSoft, borderRadius: radius.pill, paddingHorizontal: 14, justifyContent: 'center' }}>
          <T v="strong" style={{ color: color.green }}>{on} on</T>
        </View>} />
      <View style={{ padding: 16, gap: 10 }}>
        {alarms.length ? alarms.map(a => {
          const cls = classes.find(c => c.id === a.classId)
          const start = cls?.start || a.time
          const expanded = open === a.id
          return (
            <Card key={a.id} pad={0} style={{ overflow: 'hidden' }}>
              <Press onPress={() => setOpen(expanded ? null : a.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
                <View style={{ width: 6, height: 44, borderRadius: 3, backgroundColor: subject[a.color].dot, opacity: a.enabled ? 1 : 0.3 }} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.black, fontSize: 26, lineHeight: 32, letterSpacing: -1, color: a.enabled ? color.ink : color.inkMute }}>{ringAt(a, start)}</T>
                  <T v="meta" numberOfLines={1}>{a.subject} · {(cls?.days ?? [a.day]).join(' ')}</T>
                </View>
                <Switch value={a.enabled} onValueChange={v => saveAlarm({ ...a, enabled: v })}
                  trackColor={{ true: color.green, false: color.line }} thumbColor={color.white} accessibilityLabel={`Alarm for ${a.subject}`} />
              </Press>
              {expanded && (
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 18 }}>
                  {LEADS.map(l => (
                    <Press key={l} haptic onPress={() => saveAlarm({ ...a, lead: l })} accessibilityState={{ selected: a.lead === l }}
                      style={{ flex: 1, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: a.lead === l ? color.green : color.sunken }}>
                      <T v="strong" style={{ fontSize: 14, color: a.lead === l ? color.white : color.inkSoft }}>{l} min before</T>
                    </Press>
                  ))}
                </View>
              )}
            </Card>
          )
        }) : <Empty image={require('@/assets/images/sleeping-dino.png')} title="No alarms yet" />}
      </View>
    </ScrollView>
  )
}

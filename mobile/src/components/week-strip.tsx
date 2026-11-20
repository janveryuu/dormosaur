import { View } from 'react-native'
import { color, font, radius, subject } from '@/design/tokens'
import { DAYS } from '@/lib/repo'
import type { ClassEntry } from '@/lib/repo'
import { classesOn, dayOf } from '@/lib/time'
import { Press, T } from './ui'

/** Mon–Sun selector. Each day shows its class colors as dots. */
export function WeekStrip({ classes, value, onChange }: { classes: ClassEntry[]; value: string; onChange: (d: string) => void }) {
  const today = dayOf()
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {DAYS.map((d, i) => {
        const on = d === value
        const date = new Date(monday); date.setDate(monday.getDate() + i)
        const dots = classesOn(classes, d).slice(0, 3)
        return (
          <Press key={d} haptic onPress={() => onChange(d)} accessibilityLabel={d} accessibilityState={{ selected: on }}
            style={{ width: 44, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 6, backgroundColor: on ? color.green : 'transparent' }}>
            <T v="label" style={{ color: on ? '#BFD8C9' : d === today ? color.green : color.inkMute, letterSpacing: 0.4 }}>{d.slice(0, 2)}</T>
            <T style={{ fontFamily: font.black, fontSize: 17, color: on ? color.white : color.ink }}>{date.getDate()}</T>
            <View style={{ flexDirection: 'row', gap: 3, height: 5 }}>
              {dots.map(c => <View key={c.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: on ? color.sun : subject[c.color].dot }} />)}
            </View>
          </Press>
        )
      })}
    </View>
  )
}

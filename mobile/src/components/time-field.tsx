import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Platform, View } from 'react-native'
import { color, font, radius } from '@/design/tokens'
import { formatTime } from '@/lib/time'
import { Press, T } from './ui'

const pad = (n: number) => String(n).padStart(2, '0')

/** value: "HH:mm" for time, "YYYY-MM-DD" for date. */
export function PickerField({ label, mode, value, onChange }: { label: string; mode: 'time' | 'date'; value: string; onChange: (v: string) => void }) {
  const asDate = (() => {
    const d = new Date()
    if (mode === 'time') {
      const [h, m] = value.split(':').map(Number)
      d.setHours(h || 0, m || 0, 0, 0)
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, mo, day] = value.split('-').map(Number)
      d.setFullYear(y, mo - 1, day)
    }
    return d
  })()

  const commit = (_e: DateTimePickerEvent, picked?: Date) => {
    if (!picked) return
    onChange(mode === 'time'
      ? `${pad(picked.getHours())}:${pad(picked.getMinutes())}`
      : `${picked.getFullYear()}-${pad(picked.getMonth() + 1)}-${pad(picked.getDate())}`)
  }

  const display = mode === 'time'
    ? formatTime(value)
    : asDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 52, backgroundColor: color.sunken, borderRadius: radius.md, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
          <DateTimePicker value={asDate} mode={mode} display="compact" onChange={commit} accentColor={color.green} />
        </View>
      ) : (
        <Press haptic accessibilityRole="button" accessibilityLabel={`${label}, ${display}`}
          onPress={() => Platform.OS === 'android' && DateTimePickerAndroid.open({ value: asDate, mode, onChange: commit, is24Hour: false })}
          style={{ height: 52, backgroundColor: color.sunken, borderRadius: radius.md, justifyContent: 'center', paddingHorizontal: 16 }}>
          <T style={{ fontFamily: font.medium, fontSize: 16, color: color.ink }}>{display}</T>
        </Press>
      )}
    </View>
  )
}

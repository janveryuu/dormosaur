import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Platform, View } from 'react-native'
import { radius, useTheme } from '@/design/theme'
import { formatTime } from '@/lib/time'
import { Press, T } from './index'

const pad = (n: number) => String(n).padStart(2, '0')

/** value: "HH:mm" for time, "YYYY-MM-DD" for date. */
export function PickerField({ label, mode, value, onChange }: { label: string; mode: 'time' | 'date'; value: string; onChange: (v: string) => void }) {
  const { c, dark } = useTheme()
  const asDate = (() => {
    const d = new Date()
    if (mode === 'time') { const [h, m] = value.split(':').map(Number); d.setHours(h || 0, m || 0, 0, 0) }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const [y, mo, day] = value.split('-').map(Number); d.setFullYear(y, mo - 1, day) }
    return d
  })()
  const commit = (_e: DateTimePickerEvent, picked?: Date) => {
    if (!picked) return
    onChange(mode === 'time' ? `${pad(picked.getHours())}:${pad(picked.getMinutes())}` : `${picked.getFullYear()}-${pad(picked.getMonth() + 1)}-${pad(picked.getDate())}`)
  }
  const display = mode === 'time' ? formatTime(value) : asDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <View style={{ gap: 6 }}>
      <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>{label}</T>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 52, backgroundColor: c.fill, borderRadius: radius.md, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
          <DateTimePicker value={asDate} mode={mode} display="compact" onChange={commit} accentColor={c.green} themeVariant={dark ? 'dark' : 'light'} />
        </View>
      ) : (
        <Press accessibilityLabel={`${label}, ${display}`} scale={0.97}
          onPress={() => Platform.OS === 'android' && DateTimePickerAndroid.open({ value: asDate, mode, onChange: commit, is24Hour: false })}
          style={{ height: 52, backgroundColor: c.fill, borderRadius: radius.md, justifyContent: 'center', paddingHorizontal: 16 }}>
          <T v="body" style={{ fontWeight: '600' }}>{display}</T>
        </Press>
      )}
    </View>
  )
}

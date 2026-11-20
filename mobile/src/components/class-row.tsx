import { Clock3, MapPin } from 'lucide-react-native'
import { View } from 'react-native'
import { color, font, radius, shadow, subject } from '@/design/tokens'
import type { ClassEntry } from '@/lib/repo'
import { formatTime } from '@/lib/time'
import { Press, T } from './ui'

/** Timetable card — tinted subject block with a solid left edge (web week view). */
export function ClassRow({ entry, onPress, live }: { entry: ClassEntry; onPress?: () => void; live?: boolean }) {
  const tone = subject[entry.color]
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 58, paddingTop: 14, alignItems: 'flex-end' }}>
        <T style={{ fontFamily: font.bold, fontSize: 13, color: color.ink, fontVariant: ['tabular-nums'] }}>{formatTime(entry.start)}</T>
        <T v="meta" style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>{formatTime(entry.end)}</T>
      </View>
      <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={`${entry.subject}, ${formatTime(entry.start)}`}
        style={[{ flex: 1, backgroundColor: tone.bg, borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: tone.dot, padding: 14, paddingLeft: 14, gap: 5 },
          live ? [{ borderWidth: 1.5, borderColor: tone.dot, borderLeftWidth: 4 }, shadow] : { borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', borderLeftWidth: 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T style={{ fontFamily: font.black, fontSize: 12, letterSpacing: 0.4, color: tone.ink }}>{entry.code || 'CLASS'}</T>
          {live && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: tone.ink, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color.highlight }} />
              <T style={{ fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: color.white }}>NOW</T>
            </View>
          )}
        </View>
        <T v="heading" style={{ fontSize: 16, color: color.ink }} numberOfLines={2}>{entry.subject}</T>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock3 size={12} color={tone.ink} strokeWidth={2.2} />
            <T v="meta" style={{ fontSize: 12, color: tone.ink }}>{formatTime(entry.start)} – {formatTime(entry.end)}</T>
          </View>
          {!!entry.room && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color={tone.ink} strokeWidth={2.2} />
              <T v="meta" style={{ fontSize: 12, color: tone.ink }} numberOfLines={1}>{entry.room}</T>
            </View>
          )}
        </View>
      </Press>
    </View>
  )
}

import { router } from 'expo-router'
import { Clock3, MapPin, User } from 'lucide-react-native'
import { View } from 'react-native'
import type { SFSymbol } from 'expo-symbols'
import type { LucideIcon } from 'lucide-react-native'
import { radius, useTheme, type SubjectTone } from '@/design/theme'
import type { NextClass } from '@/lib/time'
import { formatTime, splitDuration } from '@/lib/time'
import { Press, T } from './index'
import { Sym } from './symbol'

/** "PALMA, MARK JUSTINE E." → "Palma, Mark Justine E." (leaves mixed-case input alone). */
export function displayName(s: string) {
  if (!s || s !== s.toUpperCase()) return s
  return s.toLowerCase().replace(/(^|[\s,.(-])(\p{L})/gu, (_, p: string, ch: string) => p + ch.toUpperCase())
}

function countdown(ms: number) {
  const { days, hours, minutes } = splitDuration(ms)
  if (days) return `${days}d ${hours}h`
  if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`
  return `${Math.max(1, minutes)} min`
}

/**
 * The next class as a Calendar-style event, washed in the subject's own
 * colour (the one the student picked for it in Schedule).
 */
export function NextCard({ next, now }: { next: NextClass; now: Date }) {
  const { subject } = useTheme()
  const tone = subject(next.entry.color)
  const e = next.entry
  const startDay = new Date(next.startsAt); startDay.setHours(0, 0, 0, 0)
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const dayGap = Math.round((startDay.getTime() - today.getTime()) / 86400000)

  const status = next.live ? 'Happening now' : dayGap === 0 ? 'Up next' : dayGap === 1 ? 'Tomorrow' : next.startsAt.toLocaleDateString(undefined, { weekday: 'long' })
  const trailing = next.live
    ? `${countdown(next.endsAt.getTime() - now.getTime())} left`
    : dayGap === 0 ? `in ${countdown(next.startsAt.getTime() - now.getTime())}` : formatTime(e.start)
  const progress = next.live ? Math.min(1, Math.max(0, (now.getTime() - next.startsAt.getTime()) / (next.endsAt.getTime() - next.startsAt.getTime()))) : 0

  return (
    <Press onPress={() => router.push({ pathname: '/class', params: { id: e.id } })} scale={0.98}
      accessibilityLabel={`${status}: ${e.code || e.subject}, ${trailing}`}
      style={{ borderRadius: radius.lg, backgroundColor: tone.bg, borderWidth: 1, borderColor: tone.bar + '55', overflow: 'hidden' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T v="footnote" color={tone.ink} style={{ fontWeight: '700', flex: 1, opacity: 0.8 }}>{status}</T>
          <View style={{ paddingHorizontal: 10, height: 26, borderRadius: 13, justifyContent: 'center', backgroundColor: tone.bar + '33' }}>
            <T v="footnote" color={tone.ink} style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{trailing}</T>
          </View>
        </View>

        <T v="title1" color={tone.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ marginTop: 10 }}>{e.code || e.subject}</T>
        {e.code ? <T v="subhead" color={tone.ink} numberOfLines={1} style={{ marginTop: 1, opacity: 0.75 }}>{e.subject}</T> : null}

        {next.live && (
          <View style={{ height: 4, borderRadius: 2, backgroundColor: tone.bar + '40', marginTop: 14, overflow: 'hidden' }} accessibilityLabel={`${Math.round(progress * 100)} percent through class`}>
            <View style={{ width: `${progress * 100}%`, height: 4, borderRadius: 2, backgroundColor: tone.bar }} />
          </View>
        )}
      </View>

      <View style={{ borderTopWidth: 1, borderColor: tone.bar + '40', paddingHorizontal: 20, paddingVertical: 14, gap: 10 }}>
        <Fact tone={tone} sf="clock" icon={Clock3} text={`${formatTime(e.start)} – ${formatTime(e.end)}`} />
        {e.room ? <Fact tone={tone} sf="mappin.and.ellipse" icon={MapPin} text={e.room} /> : null}
        {e.instructor ? <Fact tone={tone} sf="person" icon={User} text={displayName(e.instructor)} /> : null}
      </View>
    </Press>
  )
}

function Fact({ tone, sf, icon, text }: { tone: SubjectTone; sf: SFSymbol; icon: LucideIcon; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 20, alignItems: 'center', opacity: 0.7 }}><Sym name={sf} fallback={icon} size={16} color={tone.ink} /></View>
      <T v="subhead" color={tone.ink} numberOfLines={1} style={{ flex: 1, fontVariant: ['tabular-nums'] }}>{text}</T>
    </View>
  )
}

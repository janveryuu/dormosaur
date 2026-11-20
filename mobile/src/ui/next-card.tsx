import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Clock3, MapPin, User } from 'lucide-react-native'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { elevation, radius, useTheme } from '@/design/theme'
import type { NextClass } from '@/lib/time'
import { dayOf, formatTime, splitDuration } from '@/lib/time'
import { Dormo } from './dormo'
import { Press, T } from './index'

/**
 * "Up next" hero: a light, layered card tinted by the class's own colour,
 * a countdown ring, and Dormo perched on the corner.
 */
export function NextCard({ next, now }: { next: NextClass; now: Date }) {
  const { c, subject, dark } = useTheme()
  const tone = subject(next.entry.color)
  const target = next.live ? next.endsAt : next.startsAt
  const ms = target.getTime() - now.getTime()
  const { days, hours, minutes } = splitDuration(ms)
  const big = days ? `${days}d` : hours ? `${hours}h` : `${minutes}`
  const small = days ? `${hours}h` : hours ? `${minutes}m` : 'min'
  // Ring: during class, how much is done; before class, fills as it gets close (last 3 hours).
  const pct = next.live
    ? (now.getTime() - next.startsAt.getTime()) / (next.endsAt.getTime() - next.startsAt.getTime())
    : Math.max(0.04, 1 - ms / (3 * 3600000))
  const R = 34
  const C = 2 * Math.PI * R
  const sameDay = dayOf(next.startsAt) === dayOf(now) && next.startsAt.getDate() === now.getDate()
  const when = next.live ? 'Happening now' : sameDay ? 'Up next today' : `Up next · ${next.startsAt.toLocaleDateString(undefined, { weekday: 'long' })}`
  const lines = [
    next.live ? 'Focus mode! You got this.' : `${next.entry.code || next.entry.subject} soon. Ready?`,
    next.entry.room ? `It's in ${next.entry.room}.` : 'Don’t be late!',
    'Rawr! I’ll ring before class.',
  ]

  return (
    <View>
      <Press onPress={() => router.push({ pathname: '/class', params: { id: next.entry.id } })} scale={0.98} accessibilityLabel={`${when}: ${next.entry.subject}`}
        style={[{ borderRadius: radius.xl, backgroundColor: c.card, overflow: 'hidden' }, elevation(c, 3)]}>
        {/* soft wash of the class colour */}
        <LinearGradient colors={[tone.bg, dark ? c.card : '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
        <View style={{ position: 'absolute', right: -50, top: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: tone.bar, opacity: dark ? 0.12 : 0.08 }} />
        <View style={{ position: 'absolute', left: 0, top: 22, bottom: 22, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: tone.bar }} />

        <View style={{ padding: 20, paddingRight: 18, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: next.live ? c.danger : tone.bar }} />
            <T v="caption" color={tone.ink} style={{ fontWeight: '700' }}>{when}</T>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="title1" color={c.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{next.entry.code || next.entry.subject}</T>
              {next.entry.code ? <T v="subhead" color={c.ink2} numberOfLines={1}>{next.entry.subject}</T> : null}
            </View>
            {/* countdown ring */}
            <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={84} height={84} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={42} cy={42} r={R} stroke={tone.bar} strokeOpacity={0.15} strokeWidth={7} fill="none" />
                <Circle cx={42} cy={42} r={R} stroke={tone.bar} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - Math.min(1, pct))} />
              </Svg>
              <View style={{ alignItems: 'center' }}>
                <T style={{ fontSize: 22, lineHeight: 24, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] }} color={c.ink}>{big}</T>
                <T v="caption" color={c.ink2} style={{ fontWeight: '600' }}>{small}{next.live ? ' left' : ''}</T>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Meta icon={Clock3} text={`${formatTime(next.entry.start)} – ${formatTime(next.entry.end)}`} />
            {next.entry.room ? <Meta icon={MapPin} text={next.entry.room} /> : null}
            {next.entry.instructor ? <Meta icon={User} text={next.entry.instructor} /> : null}
          </View>
        </View>
      </Press>
      {/* Dormo perched on the top edge */}
      <View pointerEvents="box-none" style={{ position: 'absolute', right: 100, top: -46 }}>
        <Dormo mood={next.live ? 'cheer' : 'hi'} size={62} shadow={false} lines={lines} />
      </View>
    </View>
  )
}

function Meta({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  const { c, dark } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 99, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)', maxWidth: '100%' }}>
      <Icon size={14} color={c.ink2} strokeWidth={2.2} />
      <T v="footnote" color={c.ink} numberOfLines={1} style={{ fontWeight: '600', flexShrink: 1 }}>{text}</T>
    </View>
  )
}

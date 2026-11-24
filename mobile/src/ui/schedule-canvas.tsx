import { Image } from 'expo-image'
import { Flashlight, Camera } from 'lucide-react-native'
import { Text, View, type TextStyle } from 'react-native'
import { subjectOn } from '@/design/theme'
import { DAYS, type ClassEntry } from '@/lib/repo'
import { classesOn, formatTime, minutesOf } from '@/lib/time'
import type { WallpaperTheme } from '@/lib/wallpapers'
import { Sym } from './symbol'

/**
 * The schedule wallpaper, drawn in a 390-unit-wide design space and scaled to
 * whatever pixel width it renders at, so the preview and the saved image are
 * the same composition. Content sits in the band a Lock Screen leaves free:
 * below the clock and widgets, above the flashlight/camera row and the art.
 */
export const BASE_W = 390

export type CanvasLayout = 'list' | 'grid'

const LOCK_TOP = 300 // clear of date, clock and the Lock Screen widget row
const LOCK_BOTTOM = 128 // clear of flashlight, camera and the home indicator
const MIN_BAND = 330

export function isDarkHex(hex: string) {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5
}

/** Vertical band (in design units) the schedule may occupy. */
export function band(theme: WallpaperTheme, aspect: number) {
  const H = BASE_W * aspect
  const top = LOCK_TOP
  const artBottom = H * (1 - Math.min(theme.artwork, 0.4))
  const bottom = Math.max(top + MIN_BAND, Math.min(H - LOCK_BOTTOM, artBottom))
  return { H, top, bottom, height: bottom - top }
}

type Props = {
  theme: WallpaperTheme
  classes: ClassEntry[]
  layout: CanvasLayout
  showRooms: boolean
  width: number
  aspect: number
  /** Free wallpapers carry a small "Made with Dormosaur" mark; Pro removes it. */
  watermark?: boolean
}

export function ScheduleCanvas({ theme, classes, layout, showRooms, width, aspect, watermark }: Props) {
  const u = width / BASE_W
  const zone = band(theme, aspect)
  const days = DAYS.filter(d => classesOn(classes, d).length)
  return (
    <View style={{ width, height: width * aspect, backgroundColor: theme.bg, overflow: 'hidden' }}>
      {theme.image ? <Image source={theme.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" /> : null}
      <View style={{ position: 'absolute', left: 16 * u, right: 16 * u, top: zone.top * u, height: zone.height * u, justifyContent: 'center' }}>
        {!days.length ? (
          <Txt u={u} size={15} weight="700" color={theme.text} style={{ textAlign: 'center' }}>No classes yet</Txt>
        ) : layout === 'grid'
          ? <Timetable classes={classes} theme={theme} u={u} bandH={zone.height} showRooms={showRooms} />
          : <List days={days} classes={classes} theme={theme} u={u} bandH={zone.height} showRooms={showRooms} />}
      </View>
      {watermark && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: (zone.top + zone.height) * u + 6 * u, alignItems: 'center' }}>
          <Txt u={u} size={9} weight="700" color={theme.text} style={{ opacity: 0.55, letterSpacing: 0.4 }}>Made with Dormosaur 🦕</Txt>
        </View>
      )}
    </View>
  )
}

/** Preview-only Lock Screen furniture, drawn over the canvas so alignment is visible. Never captured. */
export function LockGuides({ theme, width, aspect, now }: { theme: WallpaperTheme; width: number; aspect: number; now: Date }) {
  const u = width / BASE_W
  const H = width * aspect
  const ink = isDarkHex(theme.text) ? 'rgba(20,20,22,0.82)' : 'rgba(255,255,255,0.94)'
  const chip = isDarkHex(theme.text) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.28)'
  const h = now.getHours() % 12 || 12
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <View style={{ position: 'absolute', top: 70 * u, left: 0, right: 0, alignItems: 'center' }}>
        <Txt u={u} size={19} weight="600" color={ink}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Txt>
        <Txt u={u} size={96} weight="700" color={ink} style={{ letterSpacing: -2 * u, lineHeight: 104 * u, fontVariant: ['tabular-nums'] }}>{h}:{String(now.getMinutes()).padStart(2, '0')}</Txt>
      </View>
      {[{ left: 46 * u, icon: Flashlight, sf: 'flashlight.off.fill' as const }, { right: 46 * u, icon: Camera, sf: 'camera.fill' as const }].map(b => (
        <View key={b.sf} style={{ position: 'absolute', bottom: 48 * u, left: b.left, right: b.right, width: 50 * u, height: 50 * u, borderRadius: 25 * u, backgroundColor: chip, alignItems: 'center', justifyContent: 'center' }}>
          <Sym name={b.sf} fallback={b.icon} size={20 * u} color={ink} />
        </View>
      ))}
      <View style={{ position: 'absolute', top: H - 14 * u, alignSelf: 'center', width: 134 * u, height: 5 * u, borderRadius: 3 * u, backgroundColor: ink }} />
    </View>
  )
}

// ─── List: one panel, four aligned columns ──────────────────────────────────

function List({ days, classes, theme, u, bandH, showRooms }: { days: string[]; classes: ClassEntry[]; theme: WallpaperTheme; u: number; bandH: number; showRooms: boolean }) {
  const dark = isDarkHex(theme.panel.startsWith('rgba') ? theme.bg : theme.panel)
  const rows = days.reduce((n, d) => n + classesOn(classes, d).length, 0)
  const PAD = 14, ROW = 25, GAP = 13
  const needed = 2 * PAD + rows * ROW + (days.length - 1) * GAP
  const k = Math.min(1.25, Math.max(0.55, bandH / needed))
  const U = u * k
  return (
    <View style={{ backgroundColor: theme.panel, borderColor: theme.border, borderWidth: Math.max(1, u * 0.6), borderRadius: 18 * u, paddingHorizontal: 14 * u, paddingVertical: PAD * U }}>
      {days.map((d, di) => (
        <View key={d} style={di ? { marginTop: GAP * U / 2, paddingTop: GAP * U / 2, borderTopWidth: Math.max(0.5, u * 0.5), borderColor: theme.border } : undefined}>
          {classesOn(classes, d).map((e, i) => (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', height: ROW * U }}>
              <Txt u={U} size={11} weight="800" color={theme.accent} style={{ width: 40 * U, letterSpacing: 0.6 * U }}>{i === 0 ? d.toUpperCase() : ''}</Txt>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <View style={{ maxWidth: '100%', height: 20 * U, paddingHorizontal: 8 * U, borderRadius: 6 * U, justifyContent: 'center', backgroundColor: subjectOn(dark, e.color).bg }}>
                  <Txt u={U} size={12.5} weight="700" color={subjectOn(dark, e.color).ink} numberOfLines={1}>{e.code || e.subject}</Txt>
                </View>
              </View>
              <Txt u={U} size={12} weight="600" color={theme.text} style={{ width: 66 * U, textAlign: 'right', opacity: 0.82, fontVariant: ['tabular-nums'] }}>{formatTime(e.start)}</Txt>
              {showRooms && <Txt u={U} size={12} weight="500" color={theme.text} numberOfLines={1} style={{ width: 92 * U, marginLeft: 12 * U, textAlign: 'right', opacity: 0.68 }}>{e.room || '—'}</Txt>}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

// ─── Timetable: days across, hours down ─────────────────────────────────────

function Timetable({ classes, theme, u, bandH, showRooms }: { classes: ClassEntry[]; theme: WallpaperTheme; u: number; bandH: number; showRooms: boolean }) {
  const dark = isDarkHex(theme.panel.startsWith('rgba') ? theme.bg : theme.panel)
  const cols = DAYS.filter((d, i) => i < 5 || classesOn(classes, d).length)
  const all = classes.filter(c => c.days.length && c.start && c.end)
  const h0 = all.length ? Math.floor(Math.min(...all.map(c => minutesOf(c.start))) / 60) : 8
  const h1 = all.length ? Math.ceil(Math.max(...all.map(c => minutesOf(c.end))) / 60) : 17
  const hours = Math.max(1, h1 - h0)
  const PAD = 10, HEAD = 22, RULER = 30
  const hourH = Math.min(46, (bandH - 2 * PAD - HEAD) / hours)
  const bodyH = hourH * hours
  const colW = (BASE_W - 32 - 2 * PAD - RULER) / cols.length
  const line = Math.max(0.5, u * 0.5)
  return (
    <View style={{ backgroundColor: theme.panel, borderColor: theme.border, borderWidth: Math.max(1, u * 0.6), borderRadius: 18 * u, padding: PAD * u }}>
      <View style={{ flexDirection: 'row', height: HEAD * u, alignItems: 'center', marginLeft: RULER * u }}>
        {cols.map(d => <Txt key={d} u={u} size={10.5} weight="800" color={theme.accent} style={{ width: colW * u, textAlign: 'center', letterSpacing: 0.5 * u }}>{d.toUpperCase()}</Txt>)}
      </View>
      <View style={{ height: bodyH * u, flexDirection: 'row' }}>
        <View style={{ width: RULER * u }}>
          {Array.from({ length: hours }, (_, i) => {
            const hr = h0 + i
            return <Txt key={hr} u={u} size={8.5} weight="600" color={theme.text} style={{ position: 'absolute', top: (i * hourH - 5) * u, left: 0, opacity: 0.6, fontVariant: ['tabular-nums'] }}>{`${hr % 12 || 12}${hr < 12 ? 'a' : 'p'}`}</Txt>
          })}
        </View>
        <View style={{ flex: 1 }}>
          {Array.from({ length: hours + 1 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * hourH * u, height: line, backgroundColor: theme.border }} />
          ))}
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {cols.map(d => (
              <View key={d} style={{ width: colW * u, height: bodyH * u }}>
                {classesOn(classes, d).map(e => {
                  const top = ((minutesOf(e.start) - h0 * 60) / 60) * hourH
                  const h = ((minutesOf(e.end) - minutesOf(e.start)) / 60) * hourH
                  const tone = subjectOn(dark, e.color)
                  return (
                    <View key={e.id} style={{ position: 'absolute', top: (top + 1) * u, left: 1.5 * u, right: 1.5 * u, height: Math.max(12, h - 2) * u, borderRadius: 6 * u, backgroundColor: tone.bg, borderWidth: line, borderColor: tone.bar, paddingHorizontal: 3.5 * u, paddingTop: 3 * u, overflow: 'hidden' }}>
                      <Txt u={u} size={8.5} weight="800" color={tone.ink} numberOfLines={h > 34 ? 2 : 1}>{e.code || e.subject}</Txt>
                      {h > 26 && <Txt u={u} size={7.5} weight="600" color={tone.ink} numberOfLines={1} style={{ opacity: 0.8, fontVariant: ['tabular-nums'] }}>{formatTime(e.start).replace(' ', '')}</Txt>}
                      {showRooms && h > 44 && e.room ? <Txt u={u} size={7.5} weight="500" color={tone.ink} numberOfLines={1} style={{ opacity: 0.72 }}>{e.room}</Txt> : null}
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

/** Canvas text: fixed size in design units, never scaled by Dynamic Type (it is an image). */
function Txt({ u, size, weight, color, style, numberOfLines, children }: { u: number; size: number; weight: TextStyle['fontWeight']; color: string; style?: TextStyle; numberOfLines?: number; children: React.ReactNode }) {
  return (
    <Text allowFontScaling={false} numberOfLines={numberOfLines} ellipsizeMode="tail"
      style={[{ fontSize: size * u, lineHeight: size * u * 1.25, fontWeight: weight, color, includeFontPadding: false }, style]}>
      {children}
    </Text>
  )
}

/** Plain-text version of the week for sharing into chats and notes. */
export function scheduleText(classes: ClassEntry[]) {
  const days = DAYS.filter(d => classesOn(classes, d).length)
  if (!days.length) return 'No classes yet.'
  return ['My class schedule', ...days.flatMap(d => [
    '',
    d.toUpperCase(),
    ...classesOn(classes, d).map(e => `${formatTime(e.start)}–${formatTime(e.end)}  ${[e.code || e.subject, e.code ? e.subject : '', e.room].filter(Boolean).join(' · ')}`),
  ])].join('\n')
}

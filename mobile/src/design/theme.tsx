import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Platform, useColorScheme } from 'react-native'

/**
 * Dormosaur design tokens.
 * Light = premium white + emerald. Dark = true black + luminous green.
 */
const light = {
  scheme: 'light' as 'light' | 'dark',
  bg: '#FFFFFF',
  grouped: '#F4F6F4',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  fill: '#EEF1EE',
  fillStrong: '#E2E7E3',
  line: 'rgba(12,32,20,0.08)',
  ink: '#0A1710',
  ink2: '#4B5A51',
  ink3: '#8A968F',
  green: '#0E7A4A',
  greenBright: '#1FA463',
  mint: '#34C77B',
  greenSoft: '#E5F4EC',
  greenInk: '#0A5A37',
  onGreen: '#FFFFFF',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warn: '#E8A317',
  warnSoft: '#FDF4E1',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  shadow: '#0B2A1A',
}

const dark: typeof light = {
  scheme: 'dark',
  bg: '#000000',
  grouped: '#000000',
  card: '#111312',
  elevated: '#1A1D1B',
  fill: '#1C201E',
  fillStrong: '#272C29',
  line: 'rgba(255,255,255,0.08)',
  ink: '#F4F7F5',
  ink2: '#A6B1AA',
  ink3: '#6A746E',
  green: '#3DD68C',
  greenBright: '#5BE3A1',
  mint: '#7DF0B5',
  greenSoft: 'rgba(61,214,140,0.14)',
  greenInk: '#7DF0B5',
  onGreen: '#00140A',
  danger: '#FF6369',
  dangerSoft: 'rgba(255,99,105,0.14)',
  warn: '#FFC53D',
  warnSoft: 'rgba(255,197,61,0.14)',
  glass: 'rgba(22,24,23,0.72)',
  glassBorder: 'rgba(255,255,255,0.08)',
  shadow: '#000000',
}

export type Palette = typeof light

/** Subject tones (1–5): soft fill, accent bar, readable ink. */
const subjectsLight = {
  1: { bg: '#E6F0FF', bar: '#3B82F6', ink: '#1E3A8A' },
  2: { bg: '#E3F6EC', bar: '#16A36A', ink: '#0B5134' },
  3: { bg: '#FDEAF3', bar: '#E0457B', ink: '#86163F' },
  4: { bg: '#FFF1E2', bar: '#F08A24', ink: '#7A3A05' },
  5: { bg: '#EFEAFE', bar: '#8B5CF6', ink: '#4C1D95' },
}
const subjectsDark: typeof subjectsLight = {
  1: { bg: 'rgba(59,130,246,0.18)', bar: '#60A5FA', ink: '#BFDBFE' },
  2: { bg: 'rgba(22,163,106,0.18)', bar: '#3DD68C', ink: '#BBF7D0' },
  3: { bg: 'rgba(224,69,123,0.18)', bar: '#F472B6', ink: '#FBCFE8' },
  4: { bg: 'rgba(240,138,36,0.18)', bar: '#FDBA74', ink: '#FED7AA' },
  5: { bg: 'rgba(139,92,246,0.2)', bar: '#A78BFA', ink: '#DDD6FE' },
}
export type SubjectTone = (typeof subjectsLight)[1]

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 }
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, page: 20 }

/** iOS-like type scale on the system font (SF Pro on iOS). */
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800' as const, letterSpacing: -0.8 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.6 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 23, fontWeight: '400' as const, letterSpacing: -0.2 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.15 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0 },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.6 },
  numeric: { fontSize: 44, lineHeight: 48, fontWeight: '800' as const, letterSpacing: -1.5, fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
}
export type TypeName = keyof typeof type

export type ThemePref = 'system' | 'light' | 'dark'
type ThemeCtx = { c: Palette; subject: (n: number) => SubjectTone; dark: boolean; pref: ThemePref; setPref: (p: ThemePref) => void }

const Ctx = createContext<ThemeCtx | null>(null)
const KEY = 'dormosaur.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [pref, setPrefState] = useState<ThemePref>('light')

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => { if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v) }).catch(() => {})
  }, [])

  const value = useMemo<ThemeCtx>(() => {
    const isDark = pref === 'system' ? system === 'dark' : pref === 'dark'
    const subjects = isDark ? subjectsDark : subjectsLight
    return {
      c: isDark ? dark : light,
      dark: isDark,
      subject: n => subjects[(([1, 2, 3, 4, 5].includes(n) ? n : 1)) as 1],
      pref,
      setPref: p => { setPrefState(p); AsyncStorage.setItem(KEY, p).catch(() => {}) },
    }
  }, [pref, system])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}

/** Soft, wide, low-opacity shadow, iOS style. */
export function elevation(c: Palette, level: 1 | 2 | 3 = 1) {
  if (c.scheme === 'dark') return {}
  const o = [0, 0.05, 0.08, 0.12][level]
  const r = [0, 12, 20, 32][level]
  return Platform.select({
    ios: { shadowColor: c.shadow, shadowOpacity: o, shadowRadius: r, shadowOffset: { width: 0, height: level * 4 } },
    android: { elevation: level * 2, shadowColor: c.shadow },
    default: { boxShadow: `0 ${level * 4}px ${r}px rgba(11,42,26,${o})` },
  }) as object
}

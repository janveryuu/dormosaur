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
// Soft, low-chroma pastels: bg = card wash, bar = accent/border, ink = text on bg (AA on bg).
const subjectsLight = {
  1: { name: 'Sky', bg: '#E9F0FB', bar: '#7FA4E0', ink: '#1E3A66' },
  2: { name: 'Sage', bg: '#E6F1EA', bar: '#7DB496', ink: '#1C4A33' },
  3: { name: 'Rose', bg: '#FAEBEF', bar: '#DE97AB', ink: '#702A40' },
  4: { name: 'Apricot', bg: '#FBEFE4', bar: '#E5AE80', ink: '#6B3D12' },
  5: { name: 'Lavender', bg: '#EFECFA', bar: '#A897DE', ink: '#3F2F78' },
}
const subjectsDark: typeof subjectsLight = {
  1: { name: 'Sky', bg: 'rgba(127,164,224,0.16)', bar: '#8FB2EA', ink: '#D3E1F7' },
  2: { name: 'Sage', bg: 'rgba(125,180,150,0.16)', bar: '#8DC4A5', ink: '#D2EBDD' },
  3: { name: 'Rose', bg: 'rgba(222,151,171,0.16)', bar: '#E8A6B8', ink: '#F5D8E0' },
  4: { name: 'Apricot', bg: 'rgba(229,174,128,0.16)', bar: '#EDBB91', ink: '#F6E0CC' },
  5: { name: 'Lavender', bg: 'rgba(168,151,222,0.18)', bar: '#B6A7E6', ink: '#E2DBF7' },
}
export type SubjectTone = (typeof subjectsLight)[1]

/** Subject tone for a surface whose lightness is fixed (e.g. a wallpaper), independent of app appearance. */
export function subjectOn(surfaceDark: boolean, n: number): SubjectTone {
  const set = surfaceDark ? subjectsDark : subjectsLight
  return set[(([1, 2, 3, 4, 5].includes(n) ? n : 1)) as 1]
}

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

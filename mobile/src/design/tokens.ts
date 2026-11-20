import { Platform } from 'react-native'

/**
 * "Campus Departures" — same system as the web app (app/globals.css):
 * warm paper, deep ink, Dormosaur emerald, highlighter yellow for wayfinding.
 */
export const color = {
  canvas: '#F4F4EB',
  card: '#FEFEFB',
  field: '#FBFBF3',
  sunken: '#ECEBDF',
  fill: '#E3E2D5',
  line: '#D9DDCF',
  lineStrong: '#BAC9BA',
  ink: '#0F1D14',
  inkSoft: '#56655A',
  inkMute: '#87938A',
  green: '#005D36',
  greenDeep: '#003F24',
  greenSoft: '#DCEBDF',
  night: '#082E1C',
  nightSoft: '#0E3B26',
  highlight: '#F7D560',
  sun: '#F7D560',
  sunSoft: '#FFF3C4',
  coral: '#D93A3A',
  coralSoft: '#FBE3E1',
  white: '#FFFFFF',
} as const

/** Subject palette — index matches SubjectColor 1..5 in the database. */
export const subject: Record<number, { bg: string; ink: string; dot: string }> = {
  1: { bg: '#EEF1FE', ink: '#2F49B8', dot: '#496CEF' },
  2: { bg: '#E3F5F3', ink: '#00716C', dot: '#00A29B' },
  3: { bg: '#FDEDE6', ink: '#A9441D', dot: '#E26333' },
  4: { bg: '#F8EAF4', ink: '#8E3477', dot: '#BF50A0' },
  5: { bg: '#E2F0E6', ink: '#005D36', dot: '#1F8A55' },
}

export const font = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  black: 'Geist_800ExtraBold',
  serif: 'Gelasio_700Bold',
  serifRegular: 'Gelasio_500Medium',
} as const

export const radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const

/** Brand-tinted shadows (never neutral black). */
export const shadow = Platform.select({
  ios: { shadowColor: '#092012', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  web: { boxShadow: '0 8px 24px -12px rgba(9,32,18,0.28), 0 1px 2px rgba(9,32,18,0.08)' } as object,
  default: { elevation: 2, shadowColor: '#092012' },
})!

export const shadowFloat = Platform.select({
  ios: { shadowColor: '#092012', shadowOpacity: 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 14 } },
  web: { boxShadow: '0 24px 52px -22px rgba(9,32,18,0.35), 0 2px 5px rgba(9,32,18,0.1)' } as object,
  default: { elevation: 10, shadowColor: '#092012' },
})!

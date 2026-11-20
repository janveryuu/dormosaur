import { LinearGradient } from 'expo-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'

/** iOS-style app icon: gradient squircle, top sheen, white glyph, soft tinted shadow. */
export function AppIcon({ icon: Icon, from, to, size = 48 }: { icon: LucideIcon; from: string; to: string; size?: number }) {
  const r = size * 0.3
  return (
    <View style={{ width: size, height: size, borderRadius: r, shadowColor: to, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
      <LinearGradient colors={[from, to]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1, borderRadius: r, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size * 0.5 }} />
        <Icon size={size * 0.48} color="#fff" strokeWidth={2.3} />
      </LinearGradient>
    </View>
  )
}

export const ICON_TONES = {
  green: ['#4ADE80', '#0E7A4A'],
  blue: ['#60A5FA', '#2563EB'],
  orange: ['#FDBA74', '#EA580C'],
  purple: ['#C4B5FD', '#7C3AED'],
  pink: ['#F9A8D4', '#DB2777'],
  amber: ['#FCD34D', '#D97706'],
  sky: ['#7DD3FC', '#0284C7'],
} as const

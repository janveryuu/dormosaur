import { Image } from 'expo-image'
import { View } from 'react-native'
import { useTheme } from '@/design/theme'
import { useAvatar } from '@/lib/avatar'
import { useApp } from '@/state/app'
import { T } from './index'

export function initialsOf(name: string) {
  return (name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'D').toUpperCase()
}

/** The student's profile picture, or their initials on a soft green circle. */
export function Avatar({ size = 44, uri: override }: { size?: number; uri?: string | null }) {
  const { c } = useTheme()
  const { profile, session, demo } = useApp()
  const stored = useAvatar(session?.user.id ?? (demo ? 'demo' : undefined), demo)
  const uri = override === undefined ? stored : override
  const initials = profile?.initials?.toUpperCase() || initialsOf(profile?.name || '')
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
      {uri
        ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={180} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
        : <T color={c.greenInk} style={{ fontSize: size * 0.36, fontWeight: '700' }}>{initials}</T>}
    </View>
  )
}

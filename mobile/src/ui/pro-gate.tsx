import { Lock } from 'lucide-react-native'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { radius, useTheme } from '@/design/theme'
import { handleUpgrade, openPaywall, usePro } from '@/lib/pro'
import { useApp } from '@/state/app'
import { Press, T } from './index'
import { PRO_GREEN } from './pro-badge'

/** Pro status for the signed-in student. */
export function useMyPro() {
  const { session, demo } = useApp()
  const userId = session?.user.id ?? (demo ? 'demo' : undefined)
  const p = usePro(userId, demo)
  return { ...p, userId, demo, onError: (e: unknown) => handleUpgrade(e, userId, demo) }
}

/** Small green "PRO" pill for locked options. */
export function ProPill({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: PRO_GREEN }, style]}>
      <Lock size={9} color="#fff" strokeWidth={3} />
      <T style={{ fontSize: 9.5, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }}>PRO</T>
    </View>
  )
}

/** A card that replaces a locked section: short pitch plus "Try Pro free". */
export function ProLockCard({ reason, title, body }: { reason: string; title: string; body: string }) {
  const { c } = useTheme()
  const { status } = useMyPro()
  return (
    <Press onPress={() => openPaywall(reason)} scale={0.98} accessibilityLabel={`${title}. Unlock with Pro`}
      style={{ borderRadius: radius.lg, padding: 18, gap: 10, backgroundColor: c.greenSoft, borderWidth: 1.5, borderColor: c.green }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ProPill />
        <T v="headline" style={{ flex: 1 }}>{title}</T>
      </View>
      <T v="subhead" color={c.ink2}>{body}</T>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 16, height: 38, borderRadius: radius.pill, backgroundColor: c.green, justifyContent: 'center' }}>
        <T v="subhead" color={c.onGreen} style={{ fontWeight: '700' }}>{status?.trialAvailable === false ? 'See Pro plans' : 'Try Pro free for 7 days'}</T>
      </View>
    </Press>
  )
}

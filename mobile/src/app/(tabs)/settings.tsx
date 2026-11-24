import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import {
  AlarmClock, CalendarDays, ChevronRight, Heart, Image as ImageIcon, LayoutGrid, ListChecks, LogOut, MessageCircle,
  MessageSquareText, RefreshCw, ScanLine, Sparkles, type LucideIcon,
} from 'lucide-react-native'
import { useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { elevation, radius, useTheme, type ThemePref } from '@/design/theme'
import { useApp } from '@/state/app'
import { proApi } from '@/lib/api'
import { LargeTitle, Press, Segmented, T } from '@/ui'
import { Avatar } from '@/ui/avatar'
import { ProBadge } from '@/ui/pro-badge'
import { TAB_CLEARANCE } from '@/ui/tab-bar'
import { useMyPro } from '@/ui/pro-gate'
import { daysLeft, pro } from '@/lib/pro'

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@dormosaur.app'
const FEEDBACK_EMAIL = `mailto:${SUPPORT_EMAIL}?subject=Dormosaur%20feedback`
const SITE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://dormosaur.vercel.app').replace(/\/$/, '')

/** The Settings tab: profile, Pro, schedule tools, appearance and account. */
export default function Settings() {
  const { c, pref, setPref } = useTheme()
  const insets = useSafeAreaInsets()
  const { profile, session, signOut, demo } = useApp()
  const name = profile?.name || 'Student'
  const details = [profile?.year, profile?.school].filter(Boolean).join(' · ')
  const { isPro } = useMyPro()
  const [restoring, setRestoring] = useState(false)

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Could not open link', 'Please try again in a moment.'))

  const restorePro = async () => {
    if (restoring) return
    if (demo || !session?.user.id) {
      Alert.alert('Sign in needed', 'Sign in to check your Dormosaur Pro entitlement.')
      return
    }
    setRestoring(true)
    try {
      const latest = await proApi.status()
      pro.apply(session.user.id, latest)
      if (latest.isPro) {
        Alert.alert('Pro restored', latest.lifetime ? 'Your Lifetime Pro plan is active.' : 'Your Dormosaur Pro access is active.')
      } else if (latest.pendingPayment) {
        Alert.alert('Payment under review', `Your ₱${latest.pendingPayment.amount} payment is still being verified.`)
      } else {
        Alert.alert('No active Pro found', 'This account is currently on the Free plan.')
      }
    } catch {
      Alert.alert('Could not check status', 'Check your connection and try again.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped, paddingTop: insets.top }}>
      <LargeTitle title="Settings" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, gap: 28, paddingBottom: TAB_CLEARANCE + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)}>
          <Press onPress={() => router.push('/profile')} scale={0.98} accessibilityLabel="Edit profile"
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: c.card }, elevation(c, 1)]}>
            <Avatar size={60} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T v="headline" numberOfLines={1} style={{ fontSize: 19, fontWeight: '700', flexShrink: 1 }}>{name}</T>
                {isPro && <ProBadge />}
              </View>
              <T v="subhead" color={c.ink2} numberOfLines={1}>{demo ? 'Preview mode' : session?.user.email}</T>
              {!!details && <T v="footnote" color={c.ink3} numberOfLines={1}>{details}</T>}
            </View>
            <ChevronRight size={20} color={c.ink3} />
          </Press>
        </Animated.View>

        <Animated.View entering={rise(1)}>
          <ProCard onPress={() => router.push('/pro')} />
        </Animated.View>

        <Animated.View entering={rise(2)}>
          <Section title="My schedule">
            <Item icon={CalendarDays} title="Manage classes" onPress={() => router.navigate('/schedule')} />
            <Item icon={ListChecks} title="Tasks & deadlines" onPress={() => router.push('/tasks')} />
            <Item icon={ScanLine} title="Scan a schedule" onPress={() => router.push('/scan')} />
            <Item icon={AlarmClock} title="Class alarms" onPress={() => router.push('/alarms')} last />
          </Section>
        </Animated.View>

        <Animated.View entering={rise(3)}>
          <Section title="Home & lock screen">
            <Item icon={LayoutGrid} title="Widgets" onPress={() => router.push('/widgets')} />
            <Item icon={ImageIcon} title="Schedule wallpaper" onPress={() => router.push('/wallpaper')} last />
          </Section>
        </Animated.View>

        <Animated.View entering={rise(4)}>
          <Section title="Student">
            <Item icon={MessageCircle} title="Copilot" onPress={() => router.push('/copilot')} last />
          </Section>
        </Animated.View>

        <Animated.View entering={rise(5)} style={{ gap: 10 }}>
          <Label>Appearance</Label>
          <Segmented<ThemePref> value={pref} onChange={setPref} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </Animated.View>

        <Animated.View entering={rise(6)}>
          <Section title="App">
            <Item icon={Heart} title="Rate Dormosaur" onPress={() => open(SITE)} />
            <Item icon={MessageSquareText} title="Send feedback" onPress={() => open(FEEDBACK_EMAIL)} />
            <Item icon={RefreshCw} title={restoring ? 'Checking Pro status...' : 'Restore Pro status'} onPress={restorePro} last />
          </Section>
        </Animated.View>

        {!demo && (
          <Section>
            <Item icon={LogOut} title="Sign out" destructive last onPress={() =>
              Alert.alert('Sign out?', 'Your classes and tasks stay saved to your account.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => { void signOut() } },
              ])} />
          </Section>
        )}
      </ScrollView>
    </View>
  )
}

function ProCard({ onPress }: { onPress: () => void }) {
  const { c, dark } = useTheme()
  const { status, isPro } = useMyPro()
  const left = daysLeft(status?.endsAt ?? null)
  const plan = status?.plan === 'trial' ? 'Free trial' : status?.plan ? status.plan[0].toUpperCase() + status.plan.slice(1) : 'Pro'
  const line = isPro
    ? (status?.lifetime ? `${plan} · yours forever` : `${plan} · ${left} ${left === 1 ? 'day' : 'days'} left`)
    : status?.pendingPayment ? `₱${status.pendingPayment.amount} payment under review`
    : status?.trialAvailable === false ? 'From ₱29 · pay with GCash, Maya and more'
    : '7 days free, then from ₱29. No auto-renewal.'
  const cta = isPro ? 'Manage Pro' : status?.pendingPayment ? 'View status' : status?.trialAvailable === false ? 'Get Pro' : 'Try Pro free'
  return (
    <Press onPress={onPress} scale={0.98} accessibilityLabel={`Dormosaur Pro. ${line}. ${cta}`} style={[{ borderRadius: radius.xl, overflow: 'hidden' }, elevation(c, 2)]}>
      <LinearGradient colors={dark ? ['#0F5A39', '#0A3D27'] : ['#14915A', '#0B6A40']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T v="title3" color="#fff">Dormosaur</T>
          <ProBadge />
          <View style={{ flex: 1 }} />
          <Sparkles size={20} color="rgba(255,255,255,0.75)" />
        </View>
        <T v="callout" color="rgba(255,255,255,0.92)" style={{ fontWeight: '600' }}>{line}</T>
        <View style={{ height: 48, borderRadius: radius.pill, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <T v="headline" color="#0B6A40" style={{ fontWeight: '700' }}>{cta}</T>
        </View>
      </LinearGradient>
    </Press>
  )
}

function Label({ children }: { children: string }) {
  const { c } = useTheme()
  return <T v="footnote" color={c.ink3} style={{ marginLeft: 4, fontWeight: '600' }}>{children}</T>
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ gap: 10 }}>
      {title && <Label>{title}</Label>}
      <View style={{ backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: c.scheme === 'dark' ? 1 : 0, borderColor: c.line }}>{children}</View>
    </View>
  )
}

function Item({ icon: Icon, title, onPress, last, destructive }: { icon: LucideIcon; title: string; onPress: () => void; last?: boolean; destructive?: boolean }) {
  const { c } = useTheme()
  const tint = destructive ? c.danger : c.green
  return (
    <Press onPress={onPress} scale={0.985} accessibilityLabel={title}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, gap: 14 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: destructive ? c.dangerSoft : c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={tint} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingRight: 14, borderBottomWidth: last ? 0 : 0.5, borderColor: c.line }}>
          <T v="body" color={destructive ? c.danger : c.ink} style={{ flex: 1, fontWeight: '500' }}>{title}</T>
          {!destructive && <ChevronRight size={18} color={c.ink3} />}
        </View>
      </View>
    </Press>
  )
}

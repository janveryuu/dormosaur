import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { AlertCircle, Clock3, PartyPopper, Sparkles, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { proApi, type PaidPlan } from '@/lib/api'
import { COMPARE, PLANS, REASONS, WALLETS, daysLeft, pro } from '@/lib/pro'
import { Button, Press, T, haptic } from '@/ui'
import { useMyPro } from '@/ui/pro-gate'
import { PRO_GREEN, ProBadge } from '@/ui/pro-badge'

const PLAN_NAME: Record<string, string> = { trial: 'Free trial', monthly: 'Monthly', semester: 'Semester', lifetime: 'Lifetime' }

/** Dormosaur Pro paywall: 7-day trial, plan picker, and the student's payment status. */
export default function Pro() {
  const { c, dark } = useTheme()
  const insets = useSafeAreaInsets()
  const { reason } = useLocalSearchParams<{ reason?: string }>()
  const { status, isPro, userId, demo } = useMyPro()
  const [plan, setPlan] = useState<PaidPlan>('semester')
  const [busy, setBusy] = useState(false)
  const pitch = (reason && REASONS[reason]) || { title: 'Do more with Pro', body: 'Unlimited scans, a smarter Dormo, weekly meal plans and every wallpaper.' }
  const chosen = PLANS.find(p => p.id === plan)!
  const pending = status?.pendingPayment
  const trial = !isPro && !pending && status?.trialAvailable !== false

  const startTrial = async () => {
    if (busy || !userId) return
    setBusy(true)
    try {
      if (demo) throw new Error('Sign in to start your free trial.')
      pro.apply(userId, await proApi.startTrial())
      haptic.success()
      Alert.alert('Pro is on! 🦕', `Enjoy ${status?.trialDays ?? 7} days of everything Dormosaur Pro unlocks.`, [{ text: 'Let’s go', onPress: () => router.back() }])
    } catch (e) {
      Alert.alert('Trial not started', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const top = dark ? ['#0F5A39', '#0A3D27'] as const : ['#1BA266', '#0B6A40'] as const
  const left = daysLeft(status?.endsAt ?? null)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        <LinearGradient colors={top} style={{ paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 12, height: 210 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 }}>
            <Press onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} color="#fff" strokeWidth={2.4} />
            </Press>
            <ProBadge />
          </View>
          <Animated.View entering={rise(0)} style={{ alignItems: 'center', marginTop: 2 }}>
            <Emblem />
          </Animated.View>
          {[[48, 70, 14], [300, 54, 18], [96, 150, 10], [272, 140, 12], [330, 100, 9]].map(([x, y, s], i) => (
            <Sparkles key={i} size={s} color="rgba(255,255,255,0.7)" style={{ position: 'absolute', left: x, top: y }} />
          ))}
        </LinearGradient>
        <Svg width="100%" height={36} viewBox="0 0 400 36" preserveAspectRatio="none" style={{ marginTop: -35 }}>
          <Path d="M0 0 Q50 36 100 18 T200 18 T300 18 T400 6 V36 H0 Z" fill={c.bg} />
        </Svg>

        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          {isPro ? (
            <Animated.View entering={rise(1)} style={[{ borderRadius: radius.lg, padding: 18, gap: 6, backgroundColor: c.greenSoft, borderWidth: 1.5, borderColor: c.green }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PartyPopper size={20} color={c.green} />
                <T v="headline">You’re Pro · {PLAN_NAME[status?.plan ?? ''] ?? 'Active'}</T>
              </View>
              <T v="subhead" color={c.ink2}>
                {status?.lifetime ? 'Yours forever. Thank you for supporting Dormosaur!' : `${left} ${left === 1 ? 'day' : 'days'} left. Buy another plan anytime and it adds on after this one.`}
              </T>
            </Animated.View>
          ) : (
            <Animated.View entering={rise(1)} style={{ alignItems: 'center', gap: 8 }}>
              <T v="title1" center>{pitch.title}</T>
              <T v="callout" color={c.ink2} center style={{ maxWidth: 330 }}>{pitch.body}</T>
            </Animated.View>
          )}

          {pending && (
            <Animated.View entering={rise(1)} style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
              <Clock3 size={22} color={c.green} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="headline">Payment under review</T>
                <T v="subhead" color={c.ink2}>₱{pending.amount} via {WALLETS.find(w => w.id === pending.wallet)?.name}. We usually confirm within 24 hours and will notify you.</T>
              </View>
            </Animated.View>
          )}

          {!pending && status?.lastRejection && (
            <Animated.View entering={rise(1)} style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: c.dangerSoft }}>
              <AlertCircle size={22} color={c.danger} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="headline" color={c.danger}>Last payment wasn’t approved</T>
                <T v="subhead" color={c.ink2}>{status.lastRejection.reason}</T>
              </View>
            </Animated.View>
          )}

          {!pending && (
            <Animated.View entering={rise(2)} style={{ flexDirection: 'row', gap: 10, paddingTop: 10 }}>
              {PLANS.map(p => {
                const on = p.id === plan
                return (
                  <Press key={p.id} onPress={() => { haptic.select(); setPlan(p.id) }} scale={0.97} accessibilityLabel={`${p.name} plan, ₱${p.amount}`} accessibilityState={{ selected: on }}
                    style={{ flex: 1, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? c.green : c.fillStrong, backgroundColor: on ? c.greenSoft : c.card, paddingVertical: 18, paddingHorizontal: 6, alignItems: 'center', gap: 4 }}>
                    {p.tag && (
                      <View style={{ position: 'absolute', top: -12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: c.green }}>
                        <T v="caption" color={c.onGreen} style={{ fontWeight: '700' }} numberOfLines={1}>{p.tag}</T>
                      </View>
                    )}
                    <T v="subhead" color={on ? c.green : c.ink2} style={{ fontWeight: '700' }}>{p.name}</T>
                    <T v="title3" adjustsFontSizeToFit numberOfLines={1}>₱{p.amount}</T>
                    <T v="caption" color={c.ink3} center numberOfLines={1} adjustsFontSizeToFit>{p.note}</T>
                  </Press>
                )
              })}
            </Animated.View>
          )}

          <Animated.View entering={rise(3)} style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.card, borderWidth: 1, borderColor: c.line }, elevation(c, 1)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T v="overline" color={c.ink3} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12 }}>FEATURES</T>
              <Col><T v="footnote" color={c.ink2} style={{ fontWeight: '600' }}>Free</T></Col>
              <Col pro><T v="footnote" color={c.onGreen} style={{ fontWeight: '800' }}>PRO</T></Col>
            </View>
            {COMPARE.map(f => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderColor: c.line }}>
                <T v="subhead" style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontWeight: '500' }}>{f.label}</T>
                <Col><T v="caption" color={c.ink2} center style={{ fontWeight: '600' }}>{f.free}</T></Col>
                <Col pro><T v="caption" color={c.onGreen} center style={{ fontWeight: '800' }}>{f.pro}</T></Col>
              </View>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {!pending && (
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 10, gap: 10, borderTopWidth: 0.5, borderColor: c.line, backgroundColor: c.bg }}>
          <T v="footnote" color={c.ink2} center>
            {trial
              ? `${status?.trialDays ?? 7} days free, no payment needed. After that, ${chosen.name} is ₱${chosen.amount}. No auto-renewal.`
              : `${chosen.length} for ₱${chosen.amount}. Pay with GCash, Maya, MariBank or GoTyme. No auto-renewal.`}
          </T>
          {trial
            ? <>
                <Button title={`Start ${status?.trialDays ?? 7}-day free trial`} onPress={startTrial} loading={busy} disabled={busy} />
                <Button title={`Pay ₱${chosen.amount} now instead`} kind="secondary" size="md" onPress={() => router.push({ pathname: '/pay', params: { plan } })} />
              </>
            : <Button title={isPro ? `Add ${chosen.name} · ₱${chosen.amount}` : `Continue · ₱${chosen.amount}`} onPress={() => router.push({ pathname: '/pay', params: { plan } })} />}
          <Press onPress={() => router.back()} accessibilityLabel="Not now" haptics={false} style={{ alignSelf: 'center', paddingVertical: 6 }}>
            <T v="subhead" color={c.ink2} style={{ fontWeight: '600' }}>Not now</T>
          </Press>
        </View>
      )}
    </View>
  )
}

function Col({ pro: isPro, children }: { pro?: boolean; children?: React.ReactNode }) {
  const { c } = useTheme()
  return <View style={{ width: 78, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: isPro ? c.green : c.fill }}>{children}</View>
}

/** Rounded hexagon emblem with "PRO". */
function Emblem() {
  return (
    <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] }}>
      <Svg width={120} height={120} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
        <Path d="M60 10 L103 35 L103 85 L60 110 L17 85 L17 35 Z" fill="#073D25" stroke="#073D25" strokeWidth={14} strokeLinejoin="round" transform="translate(0 5)" />
        <Path d="M60 10 L103 35 L103 85 L60 110 L17 85 L17 35 Z" fill="#fff" stroke="#fff" strokeWidth={14} strokeLinejoin="round" />
        <Path d="M60 22 L93 41 L93 79 L60 98 L27 79 L27 41 Z" fill="none" stroke={PRO_GREEN} strokeWidth={3} strokeLinejoin="round" />
      </Svg>
      <T v="title2" color={PRO_GREEN} style={{ fontWeight: '900', letterSpacing: 1 }}>PRO</T>
    </View>
  )
}

import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { Check, ChevronRight, Minus, Sparkles, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { Button, Press, T } from '@/ui'
import { PRO_GREEN, ProBadge } from '@/ui/pro-badge'

/**
 * Dormosaur Pro paywall: placeholder.
 * Plans, prices and features are not wired to billing yet.
 */
type PlanId = 'semester' | 'lifetime' | 'monthly'
const PLANS: { id: PlanId; name: string; price: string; note: string; tag?: string; terms: string }[] = [
  { id: 'semester', name: 'Semester', price: '₱99.00', note: '₱16.50/mo', tag: '1 month free', terms: '1 month free, then ₱99.00 every 6 months.' },
  { id: 'lifetime', name: 'Lifetime', price: '₱249.00', note: 'Pay once, keep it', terms: 'One payment of ₱249.00. Yours to keep.' },
  { id: 'monthly', name: 'Monthly', price: '₱29.00', note: 'per month', terms: '₱29.00 every month.' },
]

const FEATURES = ['Unlimited schedule scans', 'Copilot study planner', 'Exam & deadline catch-up', 'Custom wallpapers & widgets', 'Smart class alarms', 'Meal plans for the week', 'Priority support']
const SHOWN = 3

const SITE = 'https://dormosaur.vercel.app'

export default function Pro() {
  const { c, dark } = useTheme()
  const insets = useSafeAreaInsets()
  const [plan, setPlan] = useState<PlanId>('semester')
  const [all, setAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const chosen = PLANS.find(p => p.id === plan)!
  const store = Platform.OS === 'ios' ? 'your Apple Account' : 'Google Play'
  const renews = plan === 'lifetime' ? '' : ` Renews automatically until you cancel. Cancel anytime in ${Platform.OS === 'ios' ? 'Settings > Apple Account > Subscriptions' : 'Google Play > Subscriptions'}.`

  const start = () => {
    if (busy) return
    setBusy(true)
    Alert.alert('Coming soon', 'Dormosaur Pro is not available yet. We will let you know when it launches.', [
      { text: 'OK', onPress: () => setBusy(false) },
    ])
  }

  const top = dark ? ['#0F5A39', '#0A3D27'] as const : ['#1BA266', '#0B6A40'] as const

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        <LinearGradient colors={top} style={{ paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 12, height: 230 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 }}>
            <Press onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} color="#fff" strokeWidth={2.4} />
            </Press>
            <ProBadge />
          </View>
          <Animated.View entering={rise(0)} style={{ alignItems: 'center', marginTop: 8 }}>
            <Emblem />
          </Animated.View>
          {[[48, 70, 14], [300, 54, 18], [96, 150, 10], [272, 140, 12], [330, 100, 9]].map(([x, y, s], i) => (
            <Sparkles key={i} size={s} color="rgba(255,255,255,0.7)" style={{ position: 'absolute', left: x, top: y }} />
          ))}
        </LinearGradient>
        <Svg width="100%" height={36} viewBox="0 0 400 36" preserveAspectRatio="none" style={{ marginTop: -35 }}>
          <Path d="M0 0 Q50 36 100 18 T200 18 T300 18 T400 6 V36 H0 Z" fill={c.bg} />
        </Svg>

        <View style={{ paddingHorizontal: 20, gap: 22 }}>
          <Animated.View entering={rise(1)} style={{ alignItems: 'center', gap: 8 }}>
            <T v="title1" center>Do more with <T v="title1" color={c.green}>Pro</T></T>
            <T v="callout" color={c.ink2} center style={{ maxWidth: 320 }}>
              Dormosaur Pro plans your week, catches you up on missed work, and gets you ready for exams.
            </T>
          </Animated.View>

          <Animated.View entering={rise(2)} style={{ flexDirection: 'row', gap: 10, paddingTop: 10 }}>
            {PLANS.map(p => {
              const on = p.id === plan
              return (
                <Press key={p.id} onPress={() => setPlan(p.id)} scale={0.97} accessibilityLabel={`${p.name} plan, ${p.price}`} accessibilityState={{ selected: on }}
                  style={{ flex: 1, borderRadius: radius.lg, borderWidth: 2, borderColor: on ? c.green : c.fillStrong, backgroundColor: on ? c.greenSoft : c.card, paddingVertical: 18, paddingHorizontal: 6, alignItems: 'center', gap: 4 }}>
                  {p.tag && (
                    <View style={{ position: 'absolute', top: -12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: c.green }}>
                      <T v="caption" color={c.onGreen} style={{ fontWeight: '700' }}>{p.tag}</T>
                    </View>
                  )}
                  <T v="subhead" color={on ? c.green : c.ink2} style={{ fontWeight: '700' }}>{p.name}</T>
                  <T v="title3" adjustsFontSizeToFit numberOfLines={1}>{p.price}</T>
                  <T v="caption" color={c.ink3} center numberOfLines={1} adjustsFontSizeToFit>{p.note}</T>
                </Press>
              )
            })}
          </Animated.View>

          <Animated.View entering={rise(3)} style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.card, borderWidth: 1, borderColor: c.line }, elevation(c, 1)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T v="overline" color={c.ink3} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12 }}>FEATURES</T>
              <Col><T v="footnote" color={c.ink2} style={{ fontWeight: '600' }}>Free</T></Col>
              <Col pro><T v="footnote" color={c.onGreen} style={{ fontWeight: '800' }}>PRO</T></Col>
            </View>
            {(all ? FEATURES : FEATURES.slice(0, SHOWN)).map(f => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderColor: c.line }}>
                <T v="callout" style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontWeight: '500' }}>{f}</T>
                <Col><Minus size={16} color={c.ink3} /></Col>
                <Col pro><Check size={18} color={c.onGreen} strokeWidth={3} /></Col>
              </View>
            ))}
            {!all && (
              <Press onPress={() => setAll(true)} scale={0.98} accessibilityLabel={`Compare all ${FEATURES.length} features`}
                style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderColor: c.line }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 13 }}>
                  <T v="subhead" color={c.green} style={{ fontWeight: '600' }}>Compare all {FEATURES.length} features</T>
                  <ChevronRight size={16} color={c.green} />
                </View>
                <Col /><Col pro />
              </Press>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 10, gap: 12, borderTopWidth: 0.5, borderColor: c.line, backgroundColor: c.bg }}>
        <T v="footnote" color={c.ink2} center>{chosen.terms}{renews} Paid through {store}.</T>
        <Button title={plan === 'semester' ? 'Start free trial' : 'Continue'} onPress={start} loading={busy} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Press onPress={() => router.back()} accessibilityLabel="Not now" haptics={false} style={{ paddingVertical: 6 }}>
            <T v="subhead" color={c.ink2} style={{ fontWeight: '600' }}>Not now</T>
          </Press>
          <View style={{ flex: 1 }} />
          {[['Restore', () => Alert.alert('Nothing to restore', 'Dormosaur Pro is not available yet.')], ['Terms', () => Linking.openURL(`${SITE}/terms`)], ['Privacy', () => Linking.openURL(`${SITE}/privacy`)]].map(([label, fn], i) => (
            <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center' }}>
              {i > 0 && <T v="footnote" color={c.ink3}>  ·  </T>}
              <Press onPress={fn as () => void} accessibilityLabel={label as string} haptics={false} style={{ paddingVertical: 6 }}>
                <T v="footnote" color={c.ink2} style={{ fontWeight: '600' }}>{label as string}</T>
              </Press>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function Col({ pro, children }: { pro?: boolean; children?: React.ReactNode }) {
  const { c } = useTheme()
  return <View style={{ width: 72, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: pro ? c.green : c.fill }}>{children}</View>
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

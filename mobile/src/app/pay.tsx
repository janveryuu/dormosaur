import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Clipboard from 'expo-clipboard'
import { Asset as BundledAsset } from 'expo-asset'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { Asset as LibraryAsset, requestPermissionsAsync } from 'expo-media-library'
import { router, useLocalSearchParams } from 'expo-router'
import { Check, Copy, Download, ImagePlus, Info, ShieldCheck } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { proApi, type PaidPlan, type Wallet } from '@/lib/api'
import { PLANS, WALLETS, pro } from '@/lib/pro'
import { Button, Field, NavHeader, Press, T, haptic } from '@/ui'
import { useMyPro } from '@/ui/pro-gate'

type Draft = { plan: PaidPlan; wallet: Wallet; step: 1 | 2; txn: string; key: string }
const MAX_RECEIPT_BYTES = 850 * 1024
const newKey = () => `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Two steps: pay with a QR code, then upload the receipt for review. Progress survives app restarts. */
export default function Pay() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ plan?: string }>()
  const { status, userId, demo } = useMyPro()
  const draftKey = userId ? `dormosaur.pay.draft.v1.${userId}` : 'dormosaur.pay.draft.v1'
  const initialPlan = (PLANS.some(p => p.id === params.plan) ? params.plan : 'semester') as PaidPlan
  const [d, setD] = useState<Draft>({ plan: initialPlan, wallet: 'gcash', step: 1, txn: '', key: newKey() })
  const [receipt, setReceipt] = useState<{ uri: string; dataUrl: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)
  const plan = PLANS.find(p => p.id === d.plan)!
  const wallet = WALLETS.find(w => w.id === d.wallet)!
  const refReady = Boolean(status?.referenceCode)
  const ref = status?.referenceCode ?? 'Loading…'

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current) }, [])

  // Restore an unfinished payment (same plan & user) so a dropped connection never means paying twice.
  useEffect(() => {
    loaded.current = false
    AsyncStorage.getItem(draftKey).then(raw => {
      const saved = raw ? (JSON.parse(raw) as Draft) : null
      if (saved && saved.plan === initialPlan) setD(saved)
    }).catch(() => {}).finally(() => { loaded.current = true })
  }, [draftKey, initialPlan])
  useEffect(() => { if (loaded.current) AsyncStorage.setItem(draftKey, JSON.stringify(d)).catch(() => {}) }, [d, draftKey])
  const set = (p: Partial<Draft>) => setD(prev => ({ ...prev, ...p }))

  const copy = async () => {
    if (!refReady) return
    await Clipboard.setStringAsync(ref)
    haptic.success(); setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1800)
  }

  const saveQr = async () => {
    try {
      const perm = await requestPermissionsAsync(true)
      if (!perm.granted) { Alert.alert('Photo access needed', 'Allow Dormosaur to save photos, then try again.'); return }
      const [asset] = await BundledAsset.loadAsync(wallet.qr)
      if (!asset.localUri) throw new Error()
      await LibraryAsset.create(asset.localUri)
      haptic.success()
      Alert.alert('QR saved to Photos', `Open ${wallet.name}, choose Scan QR, then upload it from your gallery.`)
    } catch {
      Alert.alert('Not saved', 'We could not save the QR code. Take a screenshot instead.')
    }
  }

  const pickReceipt = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) { Alert.alert('Photo access needed', 'Allow photo access to attach your receipt.'); return }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })
      const a = res.canceled ? null : res.assets[0]
      if (!a) return
      // Receipts stay readable at <= 1400px while remaining strictly under server 900 KB limit.
      const edges = [1400, 1080]
      const qualities = [0.8, 0.65, 0.5]
      let out: { uri: string; base64?: string } | null = null
      for (const edge of edges) {
        const long = Math.max(a.width, a.height)
        let ctx = ImageManipulator.manipulate(a.uri)
        if (long > edge) ctx = ctx.resize(a.width >= a.height ? { width: edge } : { height: edge })
        const rendered = await ctx.renderAsync()
        for (const q of qualities) {
          const candidate = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: q, base64: true })
          out = candidate
          if (candidate.base64 && candidate.base64.length * 0.75 <= MAX_RECEIPT_BYTES) break
        }
        if (out?.base64 && out.base64.length * 0.75 <= MAX_RECEIPT_BYTES) break
      }
      if (!out?.base64) throw new Error('Could not read that screenshot.')
      if (out.base64.length * 0.75 > MAX_RECEIPT_BYTES) {
        Alert.alert('Image too large', 'Please pick or crop a smaller receipt screenshot (under 900 KB).')
        return
      }
      setReceipt({ uri: out.uri, dataUrl: `data:image/jpeg;base64,${out.base64}` })
      haptic.select()
    } catch {
      Alert.alert('Could not use that image', 'Please pick another screenshot of your receipt.')
    }
  }

  const txn = d.txn.replace(/\s+/g, '').toUpperCase()
  const txnOk = /^[A-Z0-9-]{6,40}$/.test(txn)

  const submit = async () => {
    if (busy || !receipt || !txnOk || !userId) return
    setBusy(true)
    try {
      if (demo) throw new Error('Sign in to submit a payment.')
      const next = await proApi.submitPayment({ plan: d.plan, wallet: d.wallet, transactionRef: txn, receipt: receipt.dataUrl, idempotencyKey: d.key })
      pro.apply(userId, next)
      await AsyncStorage.removeItem(draftKey).catch(() => {})
      haptic.success()
      Alert.alert('Receipt sent! 🦕', 'We’ll check your payment and turn on Pro, usually within 24 hours. You’ll get a notification.', [
        { text: 'OK', onPress: () => router.dismissTo('/pro') },
      ])
    } catch (e) {
      haptic.warn()
      Alert.alert('Not sent yet', e instanceof Error ? e.message : 'Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <NavHeader title={d.step === 1 ? `Pay ₱${plan.amount}` : 'Upload receipt'} onBack={d.step === 2 ? () => set({ step: 1 }) : undefined} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Steps step={d.step} />

        {d.step === 1 ? (
          <>
            {/* Wallet tabs */}
            <Animated.View entering={rise(0)} style={{ flexDirection: 'row', gap: 8 }}>
              {WALLETS.map(w => {
                const on = w.id === d.wallet
                return (
                  <Press key={w.id} onPress={() => { haptic.select(); set({ wallet: w.id }) }} scale={0.95} accessibilityState={{ selected: on }} accessibilityLabel={w.name}
                    style={{ flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? w.color : c.card, borderWidth: on ? 0 : 1, borderColor: c.line }}>
                    <T v="footnote" color={on ? '#fff' : c.ink} style={{ fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{w.name}</T>
                  </Press>
                )
              })}
            </Animated.View>

            <Animated.View key={d.wallet} entering={fade(0, 200)} style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#fff', alignItems: 'center' }}>
              <Image source={wallet.qr} style={{ width: '100%', aspectRatio: d.wallet === 'gcash' ? 0.65 : d.wallet === 'maribank' ? 1.05 : d.wallet === 'maya' ? 0.9 : 0.82 }} contentFit="contain" accessibilityLabel={`${wallet.name} payment QR code`} />
            </Animated.View>

            <Button title="Save QR to Photos" icon={Download} kind="secondary" size="md" onPress={saveQr} />

            {/* Amount + reference */}
            <View style={{ borderRadius: radius.lg, backgroundColor: c.card, padding: 16, gap: 14 }}>
              <Row label="Amount to send" value={`₱${plan.amount}.00`} big />
              <Row label="Plan" value={`${plan.name} · ${plan.length}`} />
              <View style={{ gap: 6 }}>
                <T v="footnote" color={c.ink2} style={{ fontWeight: '600' }}>Put this code in the message / note</T>
                <Press onPress={copy} disabled={!refReady} scale={0.97} accessibilityLabel={refReady ? `Copy code ${ref}` : 'Loading reference code'}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: c.greenSoft, borderWidth: 1.5, borderColor: c.green, borderStyle: 'dashed', opacity: refReady ? 1 : 0.6 }}>
                  <T v="headline" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 }}>{ref}</T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {copied ? <Check size={18} color={c.green} strokeWidth={3} /> : <Copy size={18} color={c.green} />}
                    <T v="subhead" color={c.green} style={{ fontWeight: '700' }}>{copied ? 'Copied' : 'Copy'}</T>
                  </View>
                </Press>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.fill }}>
              <Info size={18} color={c.ink2} style={{ marginTop: 1 }} />
              <T v="footnote" color={c.ink2} style={{ flex: 1 }}>
                All four are InstaPay QR codes, so any bank or e-wallet can pay them. Send the exact amount, then screenshot your receipt.
              </T>
            </View>

            <Button title="I’ve paid · Upload receipt" onPress={() => { haptic.select(); set({ step: 2 }) }} />
          </>
        ) : (
          <>
            <Animated.View entering={fade(0, 200)} style={{ gap: 16 }}>
              <Press onPress={pickReceipt} scale={0.98} accessibilityLabel={receipt ? 'Change receipt screenshot' : 'Choose receipt screenshot'}
                style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.card, borderWidth: 1.5, borderColor: receipt ? c.green : c.line, borderStyle: receipt ? 'solid' : 'dashed' }}>
                {receipt ? (
                  <View>
                    <Image source={{ uri: receipt.uri }} style={{ width: '100%', height: 320 }} contentFit="contain" />
                    <View style={{ position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' }}>
                      <T v="footnote" color="#fff" style={{ fontWeight: '700' }}>Change</T>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 8, paddingVertical: 40 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <ImagePlus size={26} color={c.green} />
                    </View>
                    <T v="headline">Add receipt screenshot</T>
                    <T v="footnote" color={c.ink3}>From your {wallet.name} or bank app</T>
                  </View>
                )}
              </Press>

              <View style={{ gap: 6 }}>
                <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Paid with</T>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {WALLETS.map(w => {
                    const on = w.id === d.wallet
                    return (
                      <Press key={w.id} onPress={() => set({ wallet: w.id })} scale={0.95} accessibilityState={{ selected: on }} accessibilityLabel={w.name}
                        style={{ flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.green : c.fill }}>
                        <T v="footnote" color={on ? c.onGreen : c.ink} style={{ fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{w.name}</T>
                      </Press>
                    )
                  })}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Field label="Reference number on your receipt" value={d.txn} onChangeText={t => set({ txn: t.slice(0, 40) })} placeholder="e.g. 1234 567 891011"
                  autoCapitalize="characters" autoCorrect={false} keyboardType={Platform.OS === 'ios' ? 'default' : 'visible-password'} returnKeyType="done" />
                {!!d.txn && !txnOk && <T v="footnote" color={c.danger} style={{ marginLeft: 4 }}>Use the letters and numbers shown as “Ref No.” on your receipt.</T>}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.fill }}>
                <ShieldCheck size={18} color={c.green} style={{ marginTop: 1 }} />
                <T v="footnote" color={c.ink2} style={{ flex: 1 }}>Your receipt is stored privately and only used to confirm this payment.</T>
              </View>

              <Button title={busy ? 'Sending…' : `Submit for review · ₱${plan.amount}`} onPress={submit} loading={busy} disabled={busy || !receipt || !txnOk} />
            </Animated.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Steps({ step }: { step: 1 | 2 }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {['Pay with QR', 'Upload receipt'].map((label, i) => {
        const n = i + 1, on = step >= n
        return (
          <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.green : c.fill }}>
              {step > n ? <Check size={14} color={c.onGreen} strokeWidth={3} /> : <T v="caption" color={on ? c.onGreen : c.ink3} style={{ fontWeight: '800' }}>{n}</T>}
            </View>
            <T v="footnote" color={on ? c.ink : c.ink3} style={{ fontWeight: '700' }}>{label}</T>
          </View>
        )
      })}
    </View>
  )
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <T v="subhead" color={c.ink2}>{label}</T>
      <T v={big ? 'title2' : 'subhead'} style={{ fontWeight: big ? '800' : '600' }}>{value}</T>
    </View>
  )
}

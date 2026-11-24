import { Image } from 'expo-image'
import { ArrowUp } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, type, useTheme } from '@/design/theme'
import { askCopilot, type ChatMessage } from '@/lib/api'
import { useApp } from '@/state/app'
import { Chip, NavHeader, Press, T } from '@/ui'

const STARTERS = ["What's my next class? 📚", 'When am I free this week?', "What's due soon?", 'Quick dinner idea 🍳', 'Help me plan a study session']
const DORMO = require('@/assets/mascots/dormosaur-thinking.png')
const DORMO_FACE = require('@/assets/mascots/dormosaur-greeting.png')

/** Same cleanup the server does, so stray Markdown never shows even on an older server. */
function plainText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/```[a-z]*\n?([\s\S]*?)```/gi, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,!?:;]|$)/gm, '$1$2')
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Copilot() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { demo, profile } = useApp()
  const first = profile?.name?.trim().split(/\s+/)[0]
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useRef<FlatList<ChatMessage>>(null)

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next); setInput(''); setBusy(true)
    try {
      const reply = demo ? "I'm in preview mode right now 🦕 Sign in and I can read your real schedule and tasks." : await askCopilot(next.slice(-12))
      setMessages(m => [...m, { role: 'assistant', content: plainText(reply) || "Hmm, I blanked on that one 🦕 Could you ask again?" }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Oops, I couldn't reach my brain just now 🦕 Check your connection and try again." }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <NavHeader title="Dormo" />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <Animated.View entering={rise(0)}><Image source={DORMO} style={{ width: 140, height: 140 }} contentFit="contain" /></Animated.View>
            <Animated.View entering={rise(1)} style={{ alignItems: 'center', gap: 6, paddingHorizontal: 12 }}>
              <T v="title2" center>{greeting()}{first ? `, ${first}` : ''}!</T>
              <T v="callout" color={c.ink2} center>I’m Dormo, your study buddy 🦕 Ask me about your classes, free time, deadlines or what to cook.</T>
            </Animated.View>
            <Animated.View entering={rise(2)} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {STARTERS.map(s => <Chip key={s} label={s} onPress={() => send(s)} />)}
            </Animated.View>
          </View>
        }
        renderItem={({ item, index }) => {
          const mine = item.role === 'user'
          const showFace = !mine && messages[index + 1]?.role !== 'assistant'
          return (
            <Animated.View entering={fade(0, 220)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: mine ? '85%' : '92%' }}>
              {!mine && (showFace ? <Face /> : <View style={{ width: 30 }} />)}
              <View style={{ flexShrink: 1, backgroundColor: mine ? c.green : c.card,
                borderRadius: radius.lg, borderBottomRightRadius: mine ? 6 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 6, paddingHorizontal: 16, paddingVertical: 11 }}>
                <T v="callout" color={mine ? c.onGreen : c.ink} selectable style={{ lineHeight: 23 }}>{item.content}</T>
              </View>
            </Animated.View>
          )
        }}
        ListFooterComponent={busy ? (
          <Animated.View entering={fade()} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 }} accessibilityLabel="Dormo is typing">
            <Face />
            <View style={{ backgroundColor: c.card, borderRadius: radius.lg, borderBottomLeftRadius: 6, paddingHorizontal: 16, height: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {[0, 1, 2].map(i => <Dot key={i} i={i} />)}
            </View>
          </Animated.View>
        ) : undefined}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask Dormo anything" placeholderTextColor={c.ink3} multiline maxLength={2000} selectionColor={c.green}
          accessibilityLabel="Message Dormo"
          style={[type.callout, { flex: 1, minHeight: 48, maxHeight: 130, backgroundColor: c.card, color: c.ink, borderRadius: 24, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 13 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        <Press onPress={() => send(input)} disabled={!input.trim() || busy} accessibilityLabel="Send" scale={0.88}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || busy ? 0.45 : 1 }}>
          <ArrowUp size={22} color={c.onGreen} strokeWidth={2.6} />
        </Press>
      </View>
    </KeyboardAvoidingView>
  )
}

function Face() {
  const { c } = useTheme()
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.greenSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Image source={DORMO_FACE} style={{ width: 28, height: 28 }} contentFit="contain" />
    </View>
  )
}

function Dot({ i }: { i: number }) {
  const { c } = useTheme()
  const y = useSharedValue(0)
  useEffect(() => {
    y.value = withDelay(i * 140, withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1, false, undefined, ReduceMotion.System))
  }, [i, y])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.ink3 }, style]} />
}

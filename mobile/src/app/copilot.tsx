import { Image } from 'expo-image'
import { ArrowUp } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, type, useTheme } from '@/design/theme'
import { askCopilot, type ChatMessage } from '@/lib/api'
import { useApp } from '@/state/app'
import { Chip, NavHeader, Press, T } from '@/ui'

const STARTERS = ["What's next today?", 'When am I free this week?', "What's due soon?", 'Quick dinner idea']

export default function Copilot() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { demo } = useApp()
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
      const reply = demo ? 'Preview mode: connect Supabase to talk to Copilot.' : await askCopilot(next.slice(-12))
      setMessages(m => [...m, { role: 'assistant', content: reply || 'No answer this time. Try again.' }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: e instanceof Error ? e.message : 'Copilot is unavailable. Try again shortly.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <NavHeader title="Copilot" />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Animated.View entering={rise(0)}><Image source={require('@/assets/mascots/dormosaur-thinking.png')} style={{ width: 140, height: 140 }} contentFit="contain" /></Animated.View>
            <Animated.View entering={rise(1)}><T v="title2" center>Ask Dormo anything</T></Animated.View>
            <Animated.View entering={rise(2)} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {STARTERS.map(s => <Chip key={s} label={s} onPress={() => send(s)} />)}
            </Animated.View>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.role === 'user'
          return (
            <Animated.View entering={fade(0, 220)} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: mine ? c.green : c.card,
              borderRadius: radius.lg, borderBottomRightRadius: mine ? 6 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 6, paddingHorizontal: 16, paddingVertical: 11 }}>
              <T v="callout" color={mine ? c.onGreen : c.ink} selectable>{item.content}</T>
            </Animated.View>
          )
        }}
        ListFooterComponent={busy ? <Animated.View entering={fade()} style={{ alignSelf: 'flex-start', backgroundColor: c.card, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 11, marginTop: 10 }}><T v="callout" color={c.ink3}>Dormo is thinking…</T></Animated.View> : undefined}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask about your week" placeholderTextColor={c.ink3} multiline maxLength={2000} selectionColor={c.green}
          style={[type.callout, { flex: 1, minHeight: 48, maxHeight: 130, backgroundColor: c.card, color: c.ink, borderRadius: 24, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 13 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        <Press onPress={() => send(input)} disabled={!input.trim() || busy} accessibilityLabel="Send" scale={0.88}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUp size={22} color={c.onGreen} strokeWidth={2.6} />
        </Press>
      </View>
    </KeyboardAvoidingView>
  )
}

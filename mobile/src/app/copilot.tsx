import { Image } from 'expo-image'
import { ArrowUp } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeader } from '@/components/headers'
import { Chip, Press, T } from '@/components/ui'
import { color, font, radius } from '@/design/tokens'
import { askCopilot, type ChatMessage } from '@/lib/api'
import { useApp } from '@/state/app'

const STARTERS = ['What is next today?', 'When am I free this week?', 'What is due soon?', 'Quick dinner idea']

export default function Copilot() {
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
    setMessages(next)
    setInput('')
    setBusy(true)
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <PageHeader title="Copilot" />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Image source={require('@/assets/mascots/dormosaur-thinking.png')} style={{ width: 140, height: 140 }} contentFit="contain" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {STARTERS.map(s => <Chip key={s} label={s} onPress={() => send(s)} />)}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.role === 'user'
          return (
            <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: mine ? color.green : color.card, borderRadius: radius.lg, borderBottomRightRadius: mine ? 6 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 6, paddingHorizontal: 16, paddingVertical: 12 }}>
              <T style={{ color: mine ? color.white : color.ink }} selectable>{item.content}</T>
            </View>
          )
        }}
        ListFooterComponent={busy ? <ActivityIndicator color={color.green} style={{ alignSelf: 'flex-start', margin: 12 }} /> : undefined}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your week"
          placeholderTextColor={color.inkMute}
          multiline
          maxLength={2000}
          style={{ flex: 1, minHeight: 50, maxHeight: 130, backgroundColor: color.card, borderRadius: 25, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, fontFamily: font.regular, fontSize: 16, color: color.ink }}
        />
        <Press haptic onPress={() => send(input)} disabled={!input.trim() || busy} accessibilityLabel="Send" accessibilityRole="button"
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: input.trim() ? color.green : color.line, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUp size={22} color={color.white} strokeWidth={2.6} />
        </Press>
      </View>
    </KeyboardAvoidingView>
  )
}

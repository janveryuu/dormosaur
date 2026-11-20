import { router } from 'expo-router'
import { BookOpen, ChevronRight, ClipboardList, FileText, MessageCircle, ScanLine, type LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { ModalHeader } from '@/components/headers'
import { Press, T } from '@/components/ui'
import { color, radius } from '@/design/tokens'

const ACTIONS: { icon: LucideIcon; title: string; tint: string; bg: string; go: () => void }[] = [
  { icon: ScanLine, title: 'Scan schedule', tint: color.green, bg: color.greenSoft, go: () => router.replace('/import') },
  { icon: BookOpen, title: 'Class', tint: '#1F4F7A', bg: '#DCEBFA', go: () => router.replace('/class') },
  { icon: ClipboardList, title: 'Task', tint: '#8A3F1F', bg: '#FBE4D8', go: () => router.replace('/task') },
  { icon: FileText, title: 'Import tasks', tint: '#4D3A80', bg: '#EAE2F8', go: () => router.replace('/import-tasks') },
  { icon: MessageCircle, title: 'Ask Copilot', tint: '#7A5A0C', bg: '#FBF1CF', go: () => router.replace('/copilot') },
]

export default function Add() {
  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <ModalHeader title="Add" />
      <View style={{ padding: 16, gap: 10 }}>
        {ACTIONS.map(({ icon: Icon, title, tint, bg, go }) => (
          <Press key={title} haptic onPress={go} accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, borderRadius: radius.lg, backgroundColor: color.sunken }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={24} color={tint} strokeWidth={2.2} />
            </View>
            <T v="heading" style={{ flex: 1 }}>{title}</T>
            <ChevronRight size={20} color={color.inkMute} />
          </Press>
        ))}
      </View>
    </View>
  )
}

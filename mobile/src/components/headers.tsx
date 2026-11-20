import { router } from 'expo-router'
import { ChevronLeft, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton, T } from './ui'

/** Header for modal sheets: title left, close right. */
export function ModalHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
      <T v="title">{title}</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {right}
        <IconButton icon={X} label="Close" tone="sunken" size={40} onPress={() => router.back()} />
      </View>
    </View>
  )
}

/** Header for pushed screens: back button + large title. */
export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => router.back()} />
        {right}
      </View>
      <T v="display" style={{ paddingHorizontal: 4 }}>{title}</T>
    </View>
  )
}

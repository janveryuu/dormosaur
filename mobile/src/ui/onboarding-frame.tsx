import { ChevronLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise, springSoft } from '@/design/motion'
import { useTheme } from '@/design/theme'
import { IconButton, T } from '@/ui'

type Props = {
  step: number
  total: number
  onBack?: () => void
  /** Extra control at the right of the progress bar (e.g. add). */
  action?: ReactNode
  hero?: ReactNode
  title: string
  sub?: string
  children?: ReactNode
  /** Pinned under the scroll area: primary button and links. */
  footer?: ReactNode
  /** Centre content vertically (welcome-style steps). */
  centered?: boolean
}

/** Shared shell for onboarding steps: progress, heading, body, pinned footer. */
export function OnboardingFrame({ step, total, onBack, action, hero, title, sub, children, footer, centered }: Props) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const progress = useAnimatedStyle(() => ({ width: withSpring(`${(step / total) * 100}%`, springSoft) }))

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, opacity: onBack ? 1 : 0 }} pointerEvents={onBack ? 'auto' : 'none'}>
          <IconButton icon={ChevronLeft} label="Back" tone="clear" onPress={onBack} />
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of ${total}`}
          style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: c.green }, progress]} />
        </View>
        <T v="subhead" color={c.ink3} style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>{step} of {total}</T>
        <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{action}</View>
      </View>

      <ScrollView key={step} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, gap: 22, justifyContent: centered ? 'center' : 'flex-start' }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {hero && <Animated.View entering={rise(0)} style={{ alignItems: 'center' }}>{hero}</Animated.View>}
        <Animated.View entering={rise(1)} style={{ gap: 8 }}>
          <T v="title1" center accessibilityRole="header" style={{ fontSize: 30, lineHeight: 36 }}>{title}</T>
          {sub ? <T v="callout" color={c.ink2} center style={{ lineHeight: 22 }}>{sub}</T> : null}
        </Animated.View>
        {children ? <Animated.View entering={rise(2)}>{children}</Animated.View> : null}
      </ScrollView>

      {footer ? <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 12, gap: 4 }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  )
}

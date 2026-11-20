import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import type { LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'
import {
  ActivityIndicator, Platform, Pressable, Text as RNText, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { color, font, radius, shadow } from '@/design/tokens'

// ─── Text ────────────────────────────────────────────────────────────────────

const variants = {
  /** Serif display — the web app's `.display-title`. */
  display: { fontFamily: font.serif, fontSize: 34, lineHeight: 38, letterSpacing: -1.2, color: color.ink },
  title: { fontFamily: font.serif, fontSize: 26, lineHeight: 30, letterSpacing: -0.8, color: color.ink },
  heading: { fontFamily: font.black, fontSize: 17, lineHeight: 22, letterSpacing: -0.4, color: color.ink },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: color.ink },
  strong: { fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.2, color: color.ink },
  meta: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.inkSoft },
  /** Uppercase route label — the web app's `.route-label`. */
  label: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: color.green },
  number: { fontFamily: font.black, fontSize: 26, lineHeight: 30, letterSpacing: -1, color: color.ink, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>

export function T({ v = 'body', style, ...rest }: TextProps & { v?: keyof typeof variants }) {
  return <RNText {...rest} style={[variants[v], style]} />
}

// ─── Press feedback ──────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Press({ style, onPressIn, onPressOut, haptic, onPress, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean }) {
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))
  return (
    <AnimatedPressable
      {...rest}
      onPress={e => { if (haptic && Platform.OS !== 'web') Haptics.selectionAsync(); onPress?.(e) }}
      onPressIn={e => { scale.set(withSpring(0.97, { damping: 20, stiffness: 400 })); onPressIn?.(e) }}
      onPressOut={e => { scale.set(withSpring(1, { damping: 14, stiffness: 300 })); onPressOut?.(e) }}
      style={[style, anim]}
    />
  )
}

// ─── Headers ─────────────────────────────────────────────────────────────────

/** Eyebrow + serif title + subtitle, with optional trailing actions. */
export function ScreenHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ flex: 1, gap: 8 }}>
        {!!eyebrow && <T v="label">{eyebrow}</T>}
        <T v="display" accessibilityRole="header">{title}</T>
        {!!subtitle && <T v="meta" style={{ fontSize: 14, lineHeight: 20 }}>{subtitle}</T>}
      </View>
      {right && <View style={{ flexDirection: 'row', gap: 8, paddingTop: 2 }}>{right}</View>}
    </View>
  )
}

/** Section title row — hairline above, bold title, green link. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderTopWidth: 1, borderColor: color.line, paddingTop: 16, marginTop: 4 }}>
      <T v="heading" style={{ fontSize: 16 }} accessibilityRole="header">{title}</T>
      {action && (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <T style={{ fontFamily: font.bold, fontSize: 13, color: color.green }}>{action} ›</T>
        </Pressable>
      )}
    </View>
  )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

export function Card({ children, style, pad = 18 }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[{ backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: pad }, shadow, style]}>{children}</View>
}

export function Tile({ label, value, onPress, accent }: { label: string; value: string; onPress?: () => void; accent?: string }) {
  return (
    <Press onPress={onPress} disabled={!onPress} style={{ flex: 1, backgroundColor: color.field, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: 14, gap: 6, minHeight: 72 }}>
      <T v="label" style={{ color: color.inkMute, fontSize: 10 }}>{label}</T>
      <T v="heading" style={accent ? { color: accent } : undefined} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{value}</T>
    </Press>
  )
}

/** Stat card — tinted icon disc, big number, small label (web schedule stats). */
export function Stat({ icon: Icon, value, label, onPress, tint = color.green, bg = color.greenSoft }: { icon: LucideIcon; value: number | string; label: string; onPress?: () => void; tint?: string; bg?: string }) {
  return (
    <Press haptic onPress={onPress} disabled={!onPress} accessibilityLabel={`${value} ${label}`}
      style={[{ flex: 1, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: 12, gap: 10 }, shadow]}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} color={tint} strokeWidth={2.2} />
      </View>
      <View>
        <T v="number">{value}</T>
        <T v="meta" style={{ fontSize: 12 }} numberOfLines={1}>{label}</T>
      </View>
    </Press>
  )
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type ButtonProps = {
  title: string
  onPress?: () => void
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ title, onPress, kind = 'primary', icon: Icon, loading, disabled, style }: ButtonProps) {
  const bg = { primary: color.green, secondary: color.greenSoft, ghost: 'transparent', danger: color.coralSoft }[kind]
  const fg = { primary: color.white, secondary: color.green, ghost: color.green, danger: color.coral }[kind]
  return (
    <Press
      haptic
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[{ height: 54, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, opacity: disabled ? 0.4 : 1 }, kind === 'primary' && !disabled && shadow, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {Icon && <Icon size={19} color={fg} strokeWidth={2.2} />}
          <T style={{ color: fg, fontFamily: font.bold, fontSize: 16, letterSpacing: -0.2 }}>{title}</T>
        </>
      )}
    </Press>
  )
}

/** Round icon button. `card` = white w/ hairline, `soft` = mint disc w/ border (web header bell). */
export function IconButton({ icon: Icon, onPress, label, tone = 'card', size = 44 }: { icon: LucideIcon; onPress?: () => void; label: string; tone?: 'card' | 'sunken' | 'green' | 'soft'; size?: number }) {
  const bg = { card: color.card, sunken: color.sunken, green: color.green, soft: color.greenSoft }[tone]
  const fg = tone === 'green' ? color.white : tone === 'soft' ? color.green : color.ink
  return (
    <Press haptic onPress={onPress} accessibilityLabel={label} accessibilityRole="button"
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        (tone === 'card' || tone === 'soft') && { borderWidth: 1, borderColor: tone === 'soft' ? '#C5DCCB' : color.line }]}>
      <Icon size={20} color={fg} strokeWidth={2} />
    </Press>
  )
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

export function Field({ label, style, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="label" style={{ color: color.inkSoft }}>{label}</T>
      <TextInput
        placeholderTextColor={color.inkMute}
        accessibilityLabel={label}
        {...rest}
        style={[{ height: rest.multiline ? 140 : 52, backgroundColor: color.field, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingHorizontal: 16, paddingTop: rest.multiline ? 14 : 0, fontFamily: font.regular, fontSize: 16, color: color.ink, textAlignVertical: rest.multiline ? 'top' : 'center' }, style]}
      />
    </View>
  )
}

/** Pill segmented control — white track, solid green active pill. */
export function Segmented<V extends string>({ options, value, onChange }: { options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: color.card, borderWidth: 1, borderColor: color.line, borderRadius: radius.pill, padding: 4 }}>
      {options.map(o => {
        const on = o.value === value
        return (
          <Press key={o.value} haptic onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={[{ flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, on && { backgroundColor: color.green }]}>
            <T style={{ fontFamily: font.bold, fontSize: 14, color: on ? color.white : color.inkSoft }}>{o.label}</T>
          </Press>
        )
      })}
    </View>
  )
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Press haptic onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={{ height: 38, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: on ? color.green : color.card, borderWidth: 1, borderColor: on ? color.green : color.line }}>
      <T style={{ fontFamily: font.semibold, fontSize: 14, color: on ? color.white : color.inkSoft }}>{label}</T>
    </Press>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

/** Dashed "wayfinding" panel with a mascot — the web app's clear-board state. */
export function Empty({ image, title, body, action }: { image: number; title: string; body?: string; action?: { title: string; onPress: () => void } }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 20, borderRadius: radius.xl, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.lineStrong, backgroundColor: color.field }}>
      <Image source={image} style={{ width: 112, height: 112 }} contentFit="contain" />
      <T v="heading" style={{ textAlign: 'center', fontSize: 18 }}>{title}</T>
      {!!body && <T v="meta" style={{ textAlign: 'center', maxWidth: 280 }}>{body}</T>}
      {action && <Button title={action.title} onPress={action.onPress} style={{ height: 46, marginTop: 6 }} />}
    </View>
  )
}

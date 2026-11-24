import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ChevronLeft, type LucideIcon } from 'lucide-react-native'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator, Platform, Pressable, Text as RNText, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type ViewStyle,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { springSnappy } from '@/design/motion'
import { elevation, radius, type, useTheme, type TypeName } from '@/design/theme'

export const haptic = {
  tap: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}) },
  select: () => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {}) },
  success: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}) },
  warn: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}) },
}

// ─── Text ────────────────────────────────────────────────────────────────────

type TProps = TextProps & { v?: TypeName; color?: string; center?: boolean }
export function T({ v = 'body', color, center, style, ...rest }: TProps) {
  const { c } = useTheme()
  return <RNText allowFontScaling maxFontSizeMultiplier={1.4} {...rest} style={[type[v], { color: color ?? c.ink }, center && { textAlign: 'center' }, style]} />
}

// ─── Press: spring-scale + haptic on every tap ───────────────────────────────

type PressProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scale?: number; haptics?: boolean; children?: ReactNode }
const APressable = Animated.createAnimatedComponent(Pressable)

export function Press({ style, scale = 0.96, haptics = true, onPressIn, onPressOut, onPress, disabled, children, ...rest }: PressProps) {
  const s = useSharedValue(1)
  const o = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }], opacity: o.get() }))
  return (
    <APressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={e => { s.set(withSpring(scale, springSnappy)); o.set(withTiming(0.88, { duration: 90 })); onPressIn?.(e) }}
      onPressOut={e => { s.set(withSpring(1, springSnappy)); o.set(withTiming(1, { duration: 160 })); onPressOut?.(e) }}
      onPress={e => { if (haptics) haptic.tap(); onPress?.(e) }}
      style={[style, anim, disabled && { opacity: 0.45 }]}
      {...rest}
    >
      {children}
    </APressable>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonProps = Omit<PressProps, 'children'> & {
  title: string
  icon?: LucideIcon
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'lg' | 'md' | 'sm'
  loading?: boolean
}

export function Button({ title, icon: Icon, kind = 'primary', size = 'lg', loading, disabled, style, ...rest }: ButtonProps) {
  const { c } = useTheme()
  const bg = { primary: c.green, secondary: c.fill, ghost: 'transparent', danger: c.dangerSoft }[kind]
  const fg = { primary: c.onGreen, secondary: c.ink, ghost: c.green, danger: c.danger }[kind]
  const h = { lg: 56, md: 48, sm: 38 }[size]
  return (
    <Press
      disabled={disabled || loading}
      accessibilityLabel={title}
      hitSlop={size === 'sm' ? { top: 6, bottom: 6 } : undefined}
      style={[{ height: h, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: size === 'sm' ? 14 : 22 },
        kind === 'primary' && elevation(c, 2), style]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {Icon && <Icon size={size === 'sm' ? 16 : 19} color={fg} strokeWidth={2.4} />}
          <T v={size === 'sm' ? 'subhead' : 'headline'} color={fg} style={{ fontWeight: '700' }}>{title}</T>
        </>
      )}
    </Press>
  )
}

/** Round icon-only button (44pt touch target). */
export function IconButton({ icon: Icon, label, onPress, tone = 'fill', size = 40 }: { icon: LucideIcon; label: string; onPress?: () => void; tone?: 'fill' | 'green' | 'clear'; size?: number }) {
  const { c } = useTheme()
  const bg = tone === 'green' ? c.green : tone === 'fill' ? c.fill : 'transparent'
  return (
    <Press onPress={onPress} accessibilityLabel={label} hitSlop={6} scale={0.9}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.48} color={tone === 'green' ? c.onGreen : c.ink} strokeWidth={2.3} />
    </Press>
  )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

export function Card({ style, children, pad = 18, level = 1 }: { style?: StyleProp<ViewStyle>; children?: ReactNode; pad?: number; level?: 1 | 2 | 3 }) {
  const { c } = useTheme()
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.lg, padding: pad, borderWidth: c.scheme === 'dark' ? 1 : 0, borderColor: c.line }, elevation(c, level), style]}>{children}</View>
}

/** iOS inset-grouped list section. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const { c } = useTheme()
  return (
    <View style={{ gap: 8 }}>
      {title && <T v="footnote" color={c.ink3} style={{ textTransform: 'uppercase', marginLeft: 16, fontWeight: '600' }}>{title}</T>}
      <View style={{ backgroundColor: c.card, borderRadius: radius.md, overflow: 'hidden', borderWidth: c.scheme === 'dark' ? 1 : 0, borderColor: c.line }}>{children}</View>
      {footer && <T v="footnote" color={c.ink3} style={{ marginHorizontal: 16 }}>{footer}</T>}
    </View>
  )
}

export function Row({ icon: Icon, iconBg, title, value, onPress, right, last, destructive }: {
  icon?: LucideIcon; iconBg?: string; title: string; value?: string; onPress?: () => void; right?: ReactNode; last?: boolean; destructive?: boolean
}) {
  const { c } = useTheme()
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingLeft: 16, gap: 12 }}>
      {Icon && (
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: iconBg ?? c.green, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color="#fff" strokeWidth={2.3} />
        </View>
      )}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingRight: 16, borderBottomWidth: last ? 0 : 0.5, borderColor: c.line, gap: 8 }}>
        <T v="body" color={destructive ? c.danger : c.ink} style={{ flex: 1 }}>{title}</T>
        {value ? <T v="body" color={c.ink3}>{value}</T> : null}
        {right}
      </View>
    </View>
  )
  return onPress ? <Press onPress={onPress} scale={0.985} accessibilityLabel={title}>{body}</Press> : body
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

export function Field({ label, style, multiline, ref, ...rest }: TextInputProps & { label?: string; ref?: React.Ref<React.ComponentRef<typeof TextInput>> }) {
  const { c } = useTheme()
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      {label && <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>{label}</T>}
      <TextInput
        ref={ref}
        placeholderTextColor={c.ink3}
        accessibilityLabel={label}
        selectionColor={c.green}
        multiline={multiline}
        onFocus={e => { setFocus(true); rest.onFocus?.(e) }}
        onBlur={e => { setFocus(false); rest.onBlur?.(e) }}
        {...rest}
        style={[type.body, {
          color: c.ink, backgroundColor: focus ? c.card : c.fill, borderRadius: radius.md, borderWidth: 1.5,
          borderColor: focus ? c.green : 'transparent', paddingHorizontal: 16, paddingVertical: multiline ? 14 : 0,
          height: multiline ? undefined : 52, minHeight: multiline ? 140 : undefined, textAlignVertical: multiline ? 'top' : 'center',
        }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object), style]}
      />
    </View>
  )
}

/** Segmented control with a sliding spring thumb. */
export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  const { c } = useTheme()
  const [w, setW] = useState(0)
  const idx = Math.max(0, options.findIndex(o => o.value === value))
  const seg = w / options.length
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(idx * seg, { damping: 20, stiffness: 260 }) }] }))
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width - 4)} style={{ flexDirection: 'row', backgroundColor: c.fill, borderRadius: 12, padding: 2, height: 36 }}>
      {w > 0 && <Animated.View style={[{ position: 'absolute', top: 2, left: 2, bottom: 2, width: seg, borderRadius: 10, backgroundColor: c.scheme === 'dark' ? c.fillStrong : c.card }, elevation(c, 1), thumb]} />}
      {options.map(o => (
        <Pressable key={o.value} onPress={() => { haptic.select(); onChange(o.value) }} accessibilityRole="tab" accessibilityState={{ selected: o.value === value }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <T v="subhead" style={{ fontWeight: o.value === value ? '700' : '500' }}>{o.label}</T>
        </Pressable>
      ))}
    </View>
  )
}

export function Chip({ label, on, onPress, icon: Icon }: { label: string; on?: boolean; onPress?: () => void; icon?: LucideIcon }) {
  const { c } = useTheme()
  return (
    <Press onPress={onPress} hitSlop={{ top: 4, bottom: 4 }} scale={0.94} accessibilityState={{ selected: on }}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? c.green : c.fill }}>
      {Icon && <Icon size={15} color={on ? c.onGreen : c.ink2} strokeWidth={2.4} />}
      <T v="subhead" color={on ? c.onGreen : c.ink} style={{ fontWeight: '600' }}>{label}</T>
    </Press>
  )
}

// ─── Headers ─────────────────────────────────────────────────────────────────

/** Large-title header for tab screens. */
export function LargeTitle({ title, eyebrow, right }: { title: string; eyebrow?: string; right?: ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
      <View style={{ flex: 1 }}>
        {eyebrow && <T v="overline" color={c.green} style={{ textTransform: 'uppercase', marginBottom: 2 }}>{eyebrow}</T>}
        <T v="largeTitle" accessibilityRole="header">{title}</T>
      </View>
      {right}
    </View>
  )
}

/** Compact header for pushed screens. */
export function NavHeader({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton icon={ChevronLeft} label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      <T v="headline" numberOfLines={1} center style={{ flex: 1 }}>{title ?? ''}</T>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  )
}

/** Header for modal sheets: grabber-friendly title + action. */
export function SheetHeader({ title, action, onAction, actionDisabled }: { title: string; action?: string; onAction?: () => void | boolean | Promise<void | boolean>; actionDisabled?: boolean }) {
  const { c } = useTheme()
  // One tap only: a double tap used to save twice and close the sheet twice (GO_BACK error).
  const [busy, setBusy] = useState(false)
  const mountedRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button"><T v="body" color={c.green}>Cancel</T></Pressable>
      <T v="headline" center style={{ flex: 1 }}>{title}</T>
      {action ? (
        <Pressable onPress={async () => {
          if (busy) return
          setBusy(true)
          try {
            const res = await onAction?.()
            if (res !== false) haptic.success()
          } finally {
            if (mountedRef.current) {
              if (timerRef.current) clearTimeout(timerRef.current)
              timerRef.current = setTimeout(() => { if (mountedRef.current) setBusy(false) }, 300)
            }
          }
        }} disabled={actionDisabled || busy} hitSlop={10} accessibilityRole="button">
          <T v="headline" color={actionDisabled || busy ? c.ink3 : c.green}>{action}</T>
        </Pressable>
      ) : <View style={{ width: 50 }} />}
    </View>
  )
}

export function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 4 }}>
        <T v="title3" style={{ flex: 1 }}>{title}</T>
        {action && <Pressable onPress={() => { haptic.select(); onAction?.() }} hitSlop={10} accessibilityRole="button"><T v="subhead" color={c.green} style={{ fontWeight: '600' }}>{action}</T></Pressable>}
      </View>
      {children}
    </View>
  )
}

export function Empty({ image, title, body, action, onAction }: { image?: number; title: string; body?: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme()
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 24 }}>
      {image && <Image source={image} style={{ width: 132, height: 132 }} contentFit="contain" />}
      <T v="title3" center>{title}</T>
      {body && <T v="subhead" color={c.ink2} center>{body}</T>}
      {action && <Button title={action} size="md" onPress={onAction} style={{ marginTop: 8 }} />}
    </View>
  )
}

/** Screen background that follows the theme. */
export function Screen({ children, grouped, style }: { children: ReactNode; grouped?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme()
  return <View style={[{ flex: 1, backgroundColor: grouped ? c.grouped : c.bg }, style]}>{children}</View>
}

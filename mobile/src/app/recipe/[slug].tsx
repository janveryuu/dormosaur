import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Check, ChevronLeft, ShoppingBasket } from 'lucide-react-native'
import { useState } from 'react'
import { View, useWindowDimensions } from 'react-native'
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { recipes } from '@/lib/recipes'
import { uid } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Button, IconButton, Press, T, haptic } from '@/ui'

export default function RecipeDetail() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const recipe = recipes.find(r => r.slug === slug)
  const [have, setHave] = useState<Set<number>>(new Set())
  const { grocery, saveGrocery } = useApp()
  const y = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { y.set(e.contentOffset.y) })
  const H = width * 0.95
  // Stretchy, parallax hero like Apple Music.
  const hero = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(y.get(), [-H, 0, H], [-H / 2, 0, H * 0.45]) }, { scale: interpolate(y.get(), [-H, 0], [2, 1], 'clamp') }],
  }))
  if (!recipe) return null

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[{ height: H }, hero]}>
          <Image source={recipe.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }} />
        </Animated.View>

        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: c.grouped, padding: 20, gap: 18 }}>
          <Animated.View entering={rise(0)} style={{ gap: 6 }}>
            <T v="overline" color={c.green} style={{ textTransform: 'uppercase' }}>{recipe.meal} · {recipe.difficulty}</T>
            <T v="title1">{recipe.title}</T>
            <T v="callout" color={c.ink2}>{recipe.blurb}</T>
          </Animated.View>

          <Animated.View entering={rise(1)} style={{ flexDirection: 'row', gap: 10 }}>
            {[['Time', `${recipe.minutes} min`], ['Cost', recipe.cost], ['Uses', recipe.appliance]].map(([l, v]) => (
              <View key={l} style={{ flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: c.card, gap: 2 }}>
                <T v="caption" color={c.ink3}>{l}</T>
                <T v="headline" numberOfLines={1}>{v}</T>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={rise(2)} style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 18, gap: 2 }}>
            <T v="title3" style={{ marginBottom: 8 }}>Ingredients</T>
            {recipe.ingredients.map((ing, i) => {
              const on = have.has(i)
              return (
                <Press key={i} scale={0.98} onPress={() => setHave(s => { const n = new Set(s); if (on) n.delete(i); else n.add(i); return n })}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? c.green : c.ink3, backgroundColor: on ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Check size={13} color={c.onGreen} strokeWidth={3} />}
                  </View>
                  <T v="callout" color={on ? c.ink3 : c.ink} style={[{ flex: 1 }, on && { textDecorationLine: 'line-through' }]}>{ing}</T>
                </Press>
              )
            })}
          </Animated.View>

          <Button title="Add missing to grocery" icon={ShoppingBasket} kind="secondary" onPress={() => {
            const known = new Set(grocery.map(g => g.name.toLowerCase()))
            const missing = recipe.ingredients.filter((ing, i) => !have.has(i) && !known.has(ing.toLowerCase()))
            saveGrocery([...grocery, ...missing.map(name => ({ id: uid(), name, checked: false }))])
            haptic.success()
            router.navigate('/kitchen')
          }} />

          <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 18, gap: 16 }}>
            <T v="title3">Steps</T>
            {recipe.steps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="footnote" color={c.green} style={{ fontWeight: '800' }}>{i + 1}</T>
                </View>
                <T v="callout" style={{ flex: 1 }}>{s}</T>
              </View>
            ))}
          </View>

          {!!recipe.tip && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.warnSoft, borderRadius: radius.lg, padding: 16 }}>
              <Image source={require('@/assets/images/chef-dormosaur.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
              <T v="subhead" style={{ flex: 1 }}>{recipe.tip}</T>
            </View>
          )}
        </View>
      </Animated.ScrollView>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16 }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => router.back()} />
      </View>
    </View>
  )
}

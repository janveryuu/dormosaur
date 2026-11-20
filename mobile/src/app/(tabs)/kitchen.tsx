import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Check, Plus, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Platform, ScrollView, TextInput, View, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout, rise } from '@/design/motion'
import { elevation, radius, type, useTheme } from '@/design/theme'
import { recipes } from '@/lib/recipes'
import { DAYS, MEALS, uid } from '@/lib/repo'
import { dayOf } from '@/lib/time'
import { useApp } from '@/state/app'
import { Chip, Empty, LargeTitle, Press, Segmented, T, haptic } from '@/ui'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

type Tab = 'recipes' | 'plan' | 'grocery'
const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export default function Kitchen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('recipes')
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <LargeTitle title="Kitchen" eyebrow="Dorm-budget meals" />
      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'recipes', label: 'Recipes' }, { value: 'plan', label: 'Meal plan' }, { value: 'grocery', label: 'Grocery' }]} />
      </View>
      <Animated.View key={tab} entering={fade(0, 220)} style={{ flex: 1 }}>
        {tab === 'recipes' ? <Recipes /> : tab === 'plan' ? <Plan /> : <Grocery />}
      </Animated.View>
    </View>
  )
}

function Recipes() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [f, setF] = useState<(typeof FILTERS)[number]>('All')
  const list = recipes.filter(r => f === 'All' || r.meal === f || r.mealTypes?.includes(f.toLowerCase() as never))
  const w = (Math.min(width, 600) - 40 - 12) / 2
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: TAB_CLEARANCE + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        {FILTERS.map(x => <Chip key={x} label={x} on={x === f} onPress={() => setF(x)} />)}
      </ScrollView>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
        {list.map((r, i) => (
          <Animated.View key={r.slug} entering={rise(Math.min(i, 8))} layout={layout}>
            <Press onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: r.slug } })} scale={0.96} accessibilityLabel={r.title}
              style={[{ width: w, borderRadius: radius.lg, backgroundColor: c.card, overflow: 'hidden' }, elevation(c, 1)]}>
              <Image source={r.image} style={{ width: w, height: w * 0.8 }} contentFit="cover" transition={200} />
              <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.55)' }}>
                <T v="caption" color="#fff" style={{ fontWeight: '700' }}>{r.minutes} min</T>
              </View>
              <View style={{ padding: 12, gap: 3 }}>
                <T v="subhead" numberOfLines={2} style={{ fontWeight: '700' }}>{r.title}</T>
                <T v="caption" color={c.ink2}>{r.appliance} · {r.cost}</T>
              </View>
            </Press>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  )
}

function Plan() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { mealPlan } = useApp()
  const today = dayOf()
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: TAB_CLEARANCE + insets.bottom }} showsVerticalScrollIndicator={false}>
      {DAYS.map((d, i) => (
        <Animated.View key={d} entering={rise(i)} style={[{ backgroundColor: c.card, borderRadius: radius.lg, padding: 14, gap: 10, borderWidth: d === today ? 1.5 : 0, borderColor: c.green }, elevation(c, 1)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T v="headline" style={{ flex: 1 }}>{d}</T>
            {d === today && <T v="caption" color={c.green} style={{ fontWeight: '800' }}>TODAY</T>}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MEALS.slice(0, 3).map(m => {
              const entry = mealPlan.find(p => p.day === d && p.meal === m)
              const r = entry && recipes.find(x => x.slug === entry.recipeSlug)
              return (
                <Press key={m} onPress={() => router.push({ pathname: '/meal-pick', params: { day: d, meal: m } })} scale={0.94} accessibilityLabel={`${d} ${m}`}
                  style={{ flex: 1, height: 92, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
                  {r ? (
                    <>
                      <Image source={r.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
                      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 6, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <T v="caption" color="#fff" numberOfLines={1} style={{ fontWeight: '700', fontSize: 10 }}>{m}</T>
                        <T v="caption" color="#fff" numberOfLines={1} style={{ fontSize: 10 }}>{r.title}</T>
                      </View>
                    </>
                  ) : (
                    <>
                      <Plus size={18} color={c.ink3} />
                      <T v="caption" color={c.ink3} style={{ marginTop: 4 }}>{m}</T>
                    </>
                  )}
                </Press>
              )
            })}
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  )
}

function Grocery() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { grocery, saveGrocery, mealPlan } = useApp()
  const [text, setText] = useState('')
  const add = () => {
    const name = text.trim()
    if (!name) return
    haptic.tap()
    saveGrocery([{ id: uid(), name, checked: false, custom: true }, ...grocery])
    setText('')
  }
  const fromPlan = () => {
    const have = new Set(grocery.map(g => g.name.toLowerCase()))
    const items = mealPlan.flatMap(p => recipes.find(r => r.slug === p.recipeSlug)?.ingredients ?? [])
      .filter(n => !have.has(n.toLowerCase()) && (have.add(n.toLowerCase()), true))
      .map(name => ({ id: uid(), name, checked: false }))
    if (items.length) { haptic.success(); saveGrocery([...grocery, ...items]) }
  }
  const sorted = [...grocery.filter(g => !g.checked), ...grocery.filter(g => g.checked)]
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: TAB_CLEARANCE + insets.bottom }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={text} onChangeText={setText} onSubmitEditing={add} placeholder="Add an item" placeholderTextColor={c.ink3} returnKeyType="done" selectionColor={c.green}
          style={[type.body, { flex: 1, height: 50, borderRadius: radius.md, backgroundColor: c.card, color: c.ink, paddingHorizontal: 16 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        <Press onPress={add} accessibilityLabel="Add item" style={{ width: 50, height: 50, borderRadius: radius.md, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} color={c.onGreen} strokeWidth={2.6} />
        </Press>
      </View>
      {mealPlan.length > 0 && <Chip label="Add ingredients from meal plan" icon={Plus} onPress={fromPlan} />}
      {!grocery.length ? <Empty image={require('@/assets/images/chef-dormosaur.png')} title="List is empty" body="Add items or pull ingredients from your meal plan." /> : (
        <View style={{ backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
          {sorted.map((g, i) => (
            <Animated.View key={g.id} layout={layout} style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 52, borderTopWidth: i ? 0.5 : 0, borderColor: c.line }}>
              <Press onPress={() => saveGrocery(grocery.map(x => (x.id === g.id ? { ...x, checked: !x.checked } : x)))} scale={0.97} accessibilityRole="checkbox" accessibilityState={{ checked: g.checked }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: g.checked ? c.green : c.ink3, backgroundColor: g.checked ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {g.checked && <Check size={14} color={c.onGreen} strokeWidth={3} />}
                </View>
                <T v="body" color={g.checked ? c.ink3 : c.ink} style={[{ flex: 1 }, g.checked && { textDecorationLine: 'line-through' }]}>{g.name}</T>
              </Press>
              <Press onPress={() => saveGrocery(grocery.filter(x => x.id !== g.id))} accessibilityLabel={`Remove ${g.name}`} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={17} color={c.ink3} />
              </Press>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

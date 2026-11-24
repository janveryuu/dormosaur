import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Check, ChevronLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useTheme } from '@/design/theme'
import { findRecipes } from '@/lib/kitchen'
import { formatRecipeTime, recipeMatchesMeal } from '@/lib/recipes'
import type { Meal } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Button, Empty, IconButton, Press, T, haptic } from '@/ui'
import { KitchenSearch } from '@/ui/kitchen-browse'

export default function MealPick() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { day, meal } = useLocalSearchParams<{ day: string; meal: Meal }>()
  const { mealPlan, setMeal } = useApp()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const current = mealPlan.find(m => m.day === day && m.meal === meal)?.recipeSlug
  const list = useMemo(() => findRecipes({ query }).sort((a, b) => Number(recipeMatchesMeal(b, meal)) - Number(recipeMatchesMeal(a, meal))), [query, meal])
  const back = () => router.canGoBack() ? router.back() : router.navigate('/kitchen')
  async function select(slug: string | null) {
    if (!day || !meal) return
    setSaving(true)
    const success = await setMeal(day, meal, slug)
    if (success) { haptic.success(); back() }
    else setSaving(false)
  }

  return (
    <View style={{ flex: 1, width: '100%', alignSelf: 'center', maxWidth: 650, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, gap: 12 }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={back} />
        <T v="title2" style={{ flex: 1 }}>{day} · {meal}</T>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 10 }}><KitchenSearch query={query} onChange={setQuery} /></View>
      {current && <Button title="Clear this meal" kind="secondary" size="md" disabled={saving} onPress={() => select(null)} style={{ marginHorizontal: 20, marginBottom: 8, alignSelf: 'flex-start' }} />}
      <FlatList
        data={list}
        keyExtractor={recipe => recipe.slug}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Empty title="No matching recipes" body="Try another dish or ingredient." />}
        renderItem={({ item }) => {
          const on = item.slug === current
          return (
            <Press onPress={() => select(item.slug)} disabled={saving} scale={0.97} accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, borderRadius: radius.lg, backgroundColor: on ? c.greenSoft : c.card }}>
              <Image source={item.image} placeholder={item.placeholder} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <T v="headline" numberOfLines={2}>{item.title}</T>
                <T v="footnote" color={c.ink2}>{formatRecipeTime(item.minutes)} · {item.appliance} · {item.cost}</T>
              </View>
              {on && <Check size={20} color={c.green} strokeWidth={2.6} style={{ marginRight: 8 }} />}
            </Press>
          )
        }}
      />
    </View>
  )
}

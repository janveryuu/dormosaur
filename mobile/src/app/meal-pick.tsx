import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Check } from 'lucide-react-native'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useTheme } from '@/design/theme'
import { recipes } from '@/lib/recipes'
import type { Meal } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Button, Press, T, haptic } from '@/ui'

export default function MealPick() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { day, meal } = useLocalSearchParams<{ day: string; meal: Meal }>()
  const { mealPlan, setMeal } = useApp()
  const current = mealPlan.find(m => m.day === day && m.meal === meal)?.recipeSlug
  const list = [...recipes].sort((a, b) => Number(b.meal === meal) - Number(a.meal === meal))

  return (
    <FlatList
      data={list}
      keyExtractor={r => r.slug}
      contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 8, paddingBottom: insets.bottom + 24 }}
      ListHeaderComponent={<T v="title2" style={{ marginBottom: 10 }}>{day} · {meal}</T>}
      ListFooterComponent={current ? <Button title="Clear this meal" kind="danger" style={{ marginTop: 10 }} onPress={() => { setMeal(day, meal, null); router.back() }} /> : undefined}
      renderItem={({ item }) => {
        const on = item.slug === current
        return (
          <Press onPress={() => { haptic.success(); setMeal(day, meal, item.slug); router.back() }} scale={0.97} accessibilityState={{ selected: on }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, borderRadius: radius.lg, backgroundColor: on ? c.greenSoft : c.card }}>
            <Image source={item.image} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <T v="headline" numberOfLines={1}>{item.title}</T>
              <T v="footnote" color={c.ink2}>{item.meal} · {item.minutes} min · {item.appliance}</T>
            </View>
            {on && <Check size={20} color={c.green} strokeWidth={2.6} style={{ marginRight: 8 }} />}
          </Press>
        )
      }}
    />
  )
}

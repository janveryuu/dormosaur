import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Check } from 'lucide-react-native'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ModalHeader } from '@/components/headers'
import { Button, Press, T } from '@/components/ui'
import { color, radius } from '@/design/tokens'
import { recipes } from '@/lib/recipes'
import type { Meal } from '@/lib/repo'
import { useApp } from '@/state/app'

export default function MealPick() {
  const insets = useSafeAreaInsets()
  const { day, meal } = useLocalSearchParams<{ day: string; meal: Meal }>()
  const { mealPlan, setMeal } = useApp()
  const current = mealPlan.find(m => m.day === day && m.meal === meal)?.recipeSlug
  const list = [...recipes].sort((a, b) => Number(b.meal === meal) - Number(a.meal === meal))

  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <ModalHeader title={`${day} ${meal}`} />
      <FlatList
        data={list}
        keyExtractor={r => r.slug}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 24 }}
        ListFooterComponent={current ? <Button title="Clear" kind="danger" style={{ marginTop: 8 }} onPress={() => { setMeal(day, meal, null); router.back() }} /> : undefined}
        renderItem={({ item }) => {
          const on = item.slug === current
          return (
            <Press haptic onPress={() => { setMeal(day, meal, item.slug); router.back() }} accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, borderRadius: radius.lg, backgroundColor: on ? color.greenSoft : color.sunken }}>
              <Image source={item.image} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <T v="strong" numberOfLines={1}>{item.title}</T>
                <T v="meta" style={{ fontSize: 12 }}>{item.meal} · {item.minutes} min · {item.appliance}</T>
              </View>
              {on && <Check size={20} color={color.green} strokeWidth={2.6} style={{ marginRight: 8 }} />}
            </Press>
          )
        }}
      />
    </View>
  )
}

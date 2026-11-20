import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Check, Clock, Plus, Trash2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, ScrollView, TextInput, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_CLEARANCE } from '@/components/tab-bar'
import { Card, Chip, Press, ScreenHeader, Segmented, T } from '@/components/ui'
import { color, font, radius, shadow } from '@/design/tokens'
import { recipes, type Recipe } from '@/lib/recipes'
import { DAYS, MEALS, uid } from '@/lib/repo'
import { dayOf } from '@/lib/time'
import { useApp } from '@/state/app'

const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Microwave', 'Rice cooker', 'No cook'] as const
type Filter = (typeof FILTERS)[number]
type Tab = 'recipes' | 'plan' | 'grocery'

export default function Kitchen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { grocery } = useApp()
  const [tab, setTab] = useState<Tab>('recipes')
  const [filter, setFilter] = useState<Filter>('All')
  const cardW = (width - 16 * 2 - 12) / 2
  const list = useMemo(() => recipes.filter(r => filter === 'All' || r.meal === filter || r.appliance === filter), [filter])
  const toBuy = grocery.filter(g => !g.checked).length

  const header = (
    <View style={{ paddingTop: insets.top + 20, gap: 16, marginBottom: 4 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <ScreenHeader eyebrow="Dorm kitchen" title="Eat well on a dorm budget." subtitle="Recipes for the gear you actually have."
          right={<Image source={require('@/assets/images/chef-dormosaur.png')} style={{ width: 76, height: 76, marginTop: -6 }} contentFit="contain" />} />
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented<Tab> value={tab} onChange={setTab} options={[
          { value: 'recipes', label: 'Recipes' },
          { value: 'plan', label: 'Plan' },
          { value: 'grocery', label: toBuy ? `Grocery ${toBuy}` : 'Grocery' },
        ]} />
      </View>
      {tab === 'recipes' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {FILTERS.map(f => <Chip key={f} label={f} on={f === filter} onPress={() => setFilter(f)} />)}
        </ScrollView>
      )}
    </View>
  )

  if (tab !== 'recipes') {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_CLEARANCE, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {header}
        <View style={{ paddingHorizontal: 16 }}>{tab === 'plan' ? <Plan /> : <Grocery />}</View>
      </ScrollView>
    )
  }

  return (
    <FlatList
      data={list}
      keyExtractor={r => r.slug}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: TAB_CLEARANCE, gap: 12 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      renderItem={({ item }) => <RecipeCard recipe={item} width={cardW} />}
    />
  )
}

function RecipeCard({ recipe, width }: { recipe: Recipe; width: number }) {
  return (
    <Press onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: recipe.slug } })} accessibilityLabel={recipe.title}
      style={[{ width, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, overflow: 'hidden' }, shadow]}>
      <Image source={recipe.image} style={{ width: '100%', height: width * 0.82 }} contentFit="cover" transition={150} />
      <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(254,254,251,0.94)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
        <T style={{ fontFamily: font.bold, fontSize: 11, color: color.green }}>{recipe.cost}</T>
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color={color.green} strokeWidth={2.4} />
          <T style={{ fontFamily: font.bold, fontSize: 11, color: color.green }} numberOfLines={1}>{recipe.minutes} min · {recipe.appliance}</T>
        </View>
        <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 19, minHeight: 38 }}>{recipe.title}</T>
      </View>
    </Press>
  )
}

function Plan() {
  const { mealPlan } = useApp()
  const [day, setDay] = useState<string>(dayOf())
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DAYS.map(d => {
          const on = d === day
          const count = mealPlan.filter(m => m.day === d).length
          return (
            <Press key={d} haptic onPress={() => setDay(d)} accessibilityState={{ selected: on }}
              style={{ width: 44, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: on ? color.green : color.card, borderWidth: 1, borderColor: on ? color.green : color.line }}>
              <T v="strong" style={{ fontSize: 13, color: on ? color.white : color.ink }}>{d.slice(0, 2)}</T>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: count ? (on ? color.sun : color.green) : 'transparent' }} />
            </Press>
          )
        })}
      </View>
      {MEALS.map(meal => {
        const entry = mealPlan.find(m => m.day === day && m.meal === meal)
        const recipe = recipes.find(r => r.slug === entry?.recipeSlug)
        return (
          <Press key={meal} onPress={() => router.push({ pathname: '/meal-pick', params: { day, meal } })} accessibilityLabel={`${meal}${recipe ? `, ${recipe.title}` : ''}`}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: 10 }, shadow]}>
            {recipe
              ? <Image source={recipe.image} style={{ width: 64, height: 64, borderRadius: 14 }} contentFit="cover" />
              : <View style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: color.sunken, alignItems: 'center', justifyContent: 'center' }}><Plus size={22} color={color.inkMute} /></View>}
            <View style={{ flex: 1, gap: 2 }}>
              <T v="label">{meal}</T>
              <T v="strong" numberOfLines={1} style={!recipe ? { color: color.inkMute } : undefined}>{recipe?.title ?? 'Pick a recipe'}</T>
              {recipe && <T v="meta" style={{ fontSize: 12 }}>{recipe.minutes} min · {recipe.cost}</T>}
            </View>
          </Press>
        )
      })}
    </View>
  )
}

function Grocery() {
  const { grocery, saveGrocery } = useApp()
  const [name, setName] = useState('')
  const sorted = [...grocery].sort((a, b) => Number(a.checked) - Number(b.checked))
  const add = () => {
    const n = name.trim()
    if (!n) return
    saveGrocery([...grocery, { id: uid(), name: n, checked: false, custom: true }])
    setName('')
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput value={name} onChangeText={setName} onSubmitEditing={add} returnKeyType="done" placeholder="Add item" placeholderTextColor={color.inkMute}
          style={{ flex: 1, height: 52, borderRadius: radius.md, backgroundColor: color.field, borderWidth: 1, borderColor: color.line, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 16, color: color.ink }} />
        <Press haptic onPress={add} accessibilityLabel="Add item" style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} color={color.white} strokeWidth={2.6} />
        </Press>
      </View>
      {sorted.length > 0 && (
        <Card pad={6}>
          {sorted.map((g, i) => (
            <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderTopWidth: i ? 1 : 0, borderColor: color.line }}>
              <Press haptic accessibilityLabel={g.checked ? `Uncheck ${g.name}` : `Check ${g.name}`} hitSlop={8}
                onPress={() => saveGrocery(grocery.map(x => (x.id === g.id ? { ...x, checked: !x.checked } : x)))}
                style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: g.checked ? color.green : color.line, backgroundColor: g.checked ? color.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {g.checked && <Check size={15} color={color.white} strokeWidth={3} />}
              </Press>
              <T style={[{ flex: 1 }, g.checked && { color: color.inkMute, textDecorationLine: 'line-through' }]}>{g.name}</T>
              <Press onPress={() => saveGrocery(grocery.filter(x => x.id !== g.id))} accessibilityLabel={`Remove ${g.name}`} hitSlop={10}>
                <Trash2 size={18} color={color.inkMute} />
              </Press>
            </View>
          ))}
        </Card>
      )}
      {grocery.some(g => g.checked) && (
        <Press onPress={() => saveGrocery(grocery.filter(g => !g.checked))} style={{ alignSelf: 'center', padding: 12 }}>
          <T v="strong" style={{ color: color.green }}>Clear checked</T>
        </Press>
      )}
    </View>
  )
}

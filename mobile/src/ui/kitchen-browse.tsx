import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Clock3, Search, SlidersHorizontal, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Modal, Platform, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { elevation, radius, type, useTheme } from '@/design/theme'
import { findRecipes, kitchenAppliances, type RecipeSort } from '@/lib/kitchen'
import { formatRecipeTime, RECIPE_MEALS, type Recipe } from '@/lib/recipes'
import { Button, Chip, Empty, IconButton, Press, T } from '@/ui'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

const labels = { Breakfast: 'Breakfast', Lunch: 'Lunch', Dinner: 'Dinner', Snack: 'Merienda', Drink: 'Drinks', Dessert: 'Desserts' }
const sorts: RecipeSort[] = ['Recommended', 'Fastest', 'Lowest cost', 'Newest']

export function KitchenSearch({ query, onChange }: { query: string; onChange: (text: string) => void }) {
  const { c } = useTheme()
  return (
    <View style={{ flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 4, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.md }}>
      <Search size={19} color={c.ink2} />
      <TextInput
        value={query} onChangeText={onChange} placeholder="Dish or ingredient"
        accessibilityLabel="Search dishes or ingredients" placeholderTextColor={c.ink2}
        autoCorrect={false} autoCapitalize="none" returnKeyType="search" selectionColor={c.green}
        style={[type.callout, { flex: 1, minWidth: 0, alignSelf: 'stretch', paddingVertical: 10, color: c.ink }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      {!!query && <Press accessibilityLabel="Clear search" onPress={() => onChange('')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><X size={17} color={c.ink2} /></Press>}
    </View>
  )
}

export function KitchenBrowse() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [meal, setMeal] = useState<Recipe['meal']>()
  const [equipment, setEquipment] = useState<Recipe['appliance'][]>([])
  const [costLimit, setCostLimit] = useState<number>()
  const [minuteLimit, setMinuteLimit] = useState<number>()
  const [sort, setSort] = useState<RecipeSort>('Recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterCount = Number(!!equipment.length) + Number(costLimit !== undefined) + Number(minuteLimit !== undefined) + Number(sort !== 'Recommended')
  const list = useMemo(() => findRecipes({ query, meal, appliances: equipment, costLimit, minuteLimit, sort }), [query, meal, equipment, costLimit, minuteLimit, sort])
  function reset() {
    setEquipment([])
    setCostLimit(undefined)
    setMinuteLimit(undefined)
    setSort('Recommended')
  }

  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' }}>
        <KitchenSearch query={query} onChange={setQuery} />
        <Press onPress={() => setFiltersOpen(true)} accessibilityLabel={filterCount ? `Filters, ${filterCount} active` : 'Filters'} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: filterCount ? c.greenSoft : c.card, borderWidth: 1, borderColor: filterCount ? c.green : c.line }}>
          <SlidersHorizontal size={20} color={filterCount ? c.green : c.ink} />
          {filterCount > 0 && <View style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: c.green }} />}
        </Press>
      </View>
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          <Chip label="All" on={!meal} onPress={() => setMeal(undefined)} />
          {RECIPE_MEALS.map(value => <Chip key={value} label={labels[value]} on={meal === value} onPress={() => setMeal(value)} />)}
        </ScrollView>
      </View>

      <FlashList
        data={list} keyExtractor={recipe => recipe.slug} numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_CLEARANCE + insets.bottom }}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        ListHeaderComponent={<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingBottom: 8 }}>
          <T v="footnote" color={c.ink2} accessibilityLiveRegion="polite">{list.length} {list.length === 1 ? 'recipe' : 'recipes'}</T>
          <Press onPress={() => setFiltersOpen(true)} accessibilityLabel="Change recipe filters and sort" style={{ paddingVertical: 9, paddingLeft: 10 }}><T v="footnote" color={c.green}>{filterCount ? 'Edit filters' : sort}</T></Press>
        </View>}
        ListEmptyComponent={<Empty image={require('@/assets/images/chef-dormosaur.png')} title="No matching recipes" body="Try another ingredient or clear your filters." action="Clear search and filters" onAction={() => { setQuery(''); setMeal(undefined); reset() }} />}
        renderItem={({ item, index }) => <RecipeCard recipe={item} second={index % 2 === 1} />}
      />

      <Modal visible={filtersOpen} transparent animationType="fade" onRequestClose={() => setFiltersOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Press accessible={false} tabIndex={-1} aria-hidden haptics={false} onPress={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.42)' }} />
          <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 680, alignSelf: 'center', maxHeight: '88%', backgroundColor: c.grouped, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + 12 }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <T v="title2">What can I cook?</T>
                <IconButton icon={X} label="Close filters" onPress={() => setFiltersOpen(false)} />
              </View>
              <FilterGroup title="Appliances I have">
                {kitchenAppliances.map(value => <Chip key={value} label={value} on={equipment.includes(value)} onPress={() => setEquipment(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} />)}
              </FilterGroup>
              <FilterGroup title="Budget per serving">
                <Chip label="Any" on={costLimit === undefined} onPress={() => setCostLimit(undefined)} />
                {[50, 75, 100].map(value => <Chip key={value} label={`₱${value} or less`} on={costLimit === value} onPress={() => setCostLimit(value)} />)}
              </FilterGroup>
              <FilterGroup title="Total time">
                <Chip label="Any" on={minuteLimit === undefined} onPress={() => setMinuteLimit(undefined)} />
                {[10, 20, 30].map(value => <Chip key={value} label={`${value} min or less`} on={minuteLimit === value} onPress={() => setMinuteLimit(value)} />)}
              </FilterGroup>
              <FilterGroup title="Sort by">
                {sorts.map(value => <Chip key={value} label={value} on={sort === value} onPress={() => setSort(value)} />)}
              </FilterGroup>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {filterCount > 0 && <Button kind="secondary" title="Reset" onPress={reset} />}
                <Button title={`Show ${list.length} ${list.length === 1 ? 'recipe' : 'recipes'}`} style={{ flex: 1 }} onPress={() => setFiltersOpen(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T v="headline">{title}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  )
}

function RecipeCard({ recipe, second }: { recipe: Recipe; second: boolean }) {
  const { c } = useTheme()
  return (
    <View style={{ marginLeft: second ? 6 : 0, marginRight: second ? 0 : 6, marginBottom: 12 }}>
      <Press accessibilityLabel={`${recipe.title}, ${formatRecipeTime(recipe.minutes)}, ${recipe.cost} per serving`}
        onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: recipe.slug } })} scale={0.97}
        style={[{ borderRadius: radius.lg, backgroundColor: c.card, overflow: 'hidden' }, elevation(c, 1)]}>
        <View style={{ aspectRatio: 5 / 4, backgroundColor: c.fill }}>
          <Image source={recipe.image} placeholder={recipe.placeholder} placeholderContentFit="cover" contentFit="cover"
            cachePolicy="memory-disk" recyclingKey={recipe.slug} transition={150} style={{ width: '100%', height: '100%' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, position: 'absolute', top: 9, left: 9, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(19,23,16,0.78)' }}>
            <Clock3 size={12} color="#fff" />
            <T v="caption" color="#fff" style={{ fontWeight: '700' }}>{formatRecipeTime(recipe.minutes)}</T>
          </View>
        </View>
        <View style={{ minHeight: 84, justifyContent: 'space-between', paddingHorizontal: 11, paddingVertical: 10, gap: 4 }}>
          <T v="subhead" numberOfLines={2} style={{ fontWeight: '700' }}>{recipe.title}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'space-between' }}>
            <T v="caption" color={c.ink2} numberOfLines={1} style={{ flexShrink: 1 }}>{recipe.appliance}</T>
            <T v="footnote" color={c.green} style={{ fontWeight: '800' }}>{recipe.cost}</T>
          </View>
        </View>
      </Press>
    </View>
  )
}

import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Check, Lock, Plus, Sparkles, Trash2 } from 'lucide-react-native'
import { openPaywall } from '@/lib/pro'
import { ProLockCard, ProPill, useMyPro } from '@/ui/pro-gate'
import { useState } from 'react'
import { Platform, ScrollView, TextInput, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout } from '@/design/motion'
import { elevation, radius, type, useTheme } from '@/design/theme'
import { addGroceryIngredients, groceryAisle, ingredientAisles, ingredientsFromPlan, plannedCost, suggestMeals } from '@/lib/kitchen'
import { formatPesos, recipeBySlug } from '@/lib/recipes'
import { DAYS, MEALS, uid } from '@/lib/repo'
import { dayOf } from '@/lib/time'
import { useApp } from '@/state/app'
import { Button, Chip, Empty, LargeTitle, Press, Segmented, T, haptic } from '@/ui'
import { KitchenBrowse } from '@/ui/kitchen-browse'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

type Tab = 'recipes' | 'plan' | 'grocery'
const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : undefined
const chef = require('@/assets/images/chef-dormosaur.png')

export default function Kitchen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('recipes')
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <LargeTitle title="Kitchen" eyebrow="Dorm-budget meals" />
      <View style={{ paddingHorizontal: 20, paddingBottom: 14, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'recipes', label: 'Recipes' }, { value: 'plan', label: 'Meal plan' }, { value: 'grocery', label: 'Grocery' }]} />
      </View>
      <View style={{ flex: 1, display: tab === 'recipes' ? 'flex' : 'none' }}><KitchenBrowse /></View>
      {tab !== 'recipes' && <Animated.View key={tab} entering={fade(0, 180)} style={{ flex: 1 }}>
        {tab === 'plan' ? <Plan /> : <Grocery />}
      </Animated.View>}
    </View>
  )
}

function Plan() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { mealPlan, fillMealPlan } = useApp()
  const { isPro } = useMyPro()
  const [budget, setBudget] = useState('1000')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const today = dayOf()

  async function fillWeek() {
    const limit = Number(budget)
    if (!Number.isSafeInteger(limit) || limit < 1) {
      setStatus('Enter a weekly budget in pesos.')
      return
    }
    const { added, message } = suggestMeals(mealPlan, limit)
    if (!added.length) {
      setStatus(message)
      return
    }
    setSaving(true)
    const saved = await fillMealPlan(added)
    if (saved) {
      haptic.success()
      setStatus(message)
    }
    setSaving(false)
  }

  return (
    <ScrollView style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: TAB_CLEARANCE + insets.bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {!isPro && <ProLockCard reason="meal_plan" title="Plan your whole week" body="Free plans today’s meals. Pro fills every day within your budget and builds the grocery list." />}
      {isPro && <View style={{ backgroundColor: c.greenSoft, borderRadius: radius.lg, padding: 16, gap: 11 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <T v="headline" style={{ flexShrink: 1 }}>Fill my week</T>
          <T v="footnote" color={c.ink2}>{formatPesos(plannedCost(mealPlan))} planned</T>
        </View>
        <T v="footnote" color={c.ink2}>Set a budget for one serving per meal. Your planned meals stay in place.</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 92, minHeight: 46, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: c.card, gap: 5 }}>
            <T v="callout" color={c.ink2}>₱</T>
            <TextInput value={budget} onChangeText={value => { setBudget(value.replace(/[^0-9]/g, '')); setStatus('') }}
              accessibilityLabel="Weekly meal budget" inputMode="numeric" placeholder="1000" placeholderTextColor={c.ink2} maxLength={5}
              style={[type.callout, { flex: 1, minWidth: 45, color: c.ink, paddingVertical: 9 }, noOutline]} />
          </View>
          <Button title="Suggest meals" icon={Sparkles} size="md" loading={saving} onPress={fillWeek} />
        </View>
        {!!status && <T v="footnote" color={c.ink2} accessibilityLiveRegion="polite">{status}</T>}
      </View>}
      {DAYS.map(day => {
        const locked = !isPro && day !== today
        return (
        <View key={day} style={[{ backgroundColor: c.card, borderRadius: radius.lg, padding: 14, gap: 10, borderWidth: day === today ? 1.5 : 0, borderColor: c.green, opacity: locked ? 0.55 : 1 }, elevation(c, 1)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T v="headline" style={{ flex: 1 }}>{day}</T>
            {day === today && <T v="caption" color={c.green} style={{ fontWeight: '800' }}>TODAY</T>}
            {locked && <ProPill />}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MEALS.slice(0, 3).map(meal => {
              const entry = mealPlan.find(value => value.day === day && value.meal === meal)
              const recipe = entry ? recipeBySlug.get(entry.recipeSlug) : undefined
              return (
                <Press key={meal} onPress={() => locked ? openPaywall('meal_plan') : router.push({ pathname: '/meal-pick', params: { day, meal } })} scale={0.94}
                  accessibilityLabel={recipe ? `${day} ${meal}, ${recipe.title}` : `Add ${day} ${meal}`}
                  style={{ flex: 1, minHeight: 92, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
                  {recipe ? (
                    <>
                      <Image source={recipe.image} placeholder={recipe.placeholder} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
                      <View style={{ alignSelf: 'stretch', marginTop: 'auto', padding: 6, backgroundColor: 'rgba(19,23,16,0.76)' }}>
                        <T v="caption" color="#fff" numberOfLines={1} style={{ fontWeight: '700' }}>{meal}</T>
                        <T v="caption" color="#fff" numberOfLines={1}>{recipe.title}</T>
                      </View>
                    </>
                  ) : (
                    <>
                      <Plus size={18} color={c.ink2} />
                      <T v="caption" color={c.ink2} style={{ marginTop: 4 }}>{meal}</T>
                    </>
                  )}
                </Press>
              )
            })}
          </View>
        </View>
        )
      })}
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
    void saveGrocery(current => [{ id: uid(), name, checked: false, custom: true }, ...current])
    setText('')
  }
  const { isPro } = useMyPro()
  const fromPlan = () => {
    if (!isPro) { openPaywall('meal_plan'); return }
    const ingredients = ingredientsFromPlan(mealPlan)
    if (!ingredients.length) return
    haptic.success()
    void saveGrocery(current => addGroceryIngredients(current, ingredients, 'plan'))
  }
  const checked = grocery.filter(item => item.checked)
  const groups = ingredientAisles
    .map(aisle => ({ title: aisle, items: grocery.filter(item => !item.checked && groceryAisle(item) === aisle) }))
    .filter(group => group.items.length > 0)
  const sections = checked.length ? [...groups, { title: 'Checked', items: checked }] : groups

  return (
    <ScrollView style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: TAB_CLEARANCE + insets.bottom }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={text} onChangeText={setText} onSubmitEditing={add} placeholder="Add an item" accessibilityLabel="Grocery item" placeholderTextColor={c.ink2} returnKeyType="done" selectionColor={c.green}
          style={[type.body, { flex: 1, minHeight: 50, borderRadius: radius.md, backgroundColor: c.card, color: c.ink, paddingHorizontal: 16 }, noOutline]} />
        <Press onPress={add} accessibilityLabel="Add item" style={{ width: 50, height: 50, borderRadius: radius.md, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} color={c.onGreen} strokeWidth={2.6} />
        </Press>
      </View>
      {mealPlan.length > 0 && <Chip label={isPro ? 'Sync ingredients from meal plan' : 'Sync from meal plan · Pro'} icon={isPro ? Plus : Lock} onPress={fromPlan} />}
      {grocery.length === 0 && <Empty image={chef} title="Your grocery list is empty" body="Add an item or pull ingredients from your meal plan." />}
      {sections.map(({ title, items }) => (
        <View key={title} style={{ gap: 8 }}>
          <T v="headline" color={c.ink2}>{title}</T>
          <View style={{ backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
            {items.map((item, index) => (
              <Animated.View key={item.id} layout={layout} style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, minHeight: 52, borderTopWidth: index ? 0.5 : 0, borderColor: c.line }}>
                <Press onPress={() => saveGrocery(current => current.map(row => row.id === item.id ? { ...row, checked: !row.checked } : row))} scale={0.97} accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} aria-checked={item.checked}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: item.checked ? c.green : c.ink3, backgroundColor: item.checked ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {item.checked && <Check size={14} color={c.onGreen} strokeWidth={3} />}
                  </View>
                  <T v="callout" color={item.checked ? c.ink2 : c.ink} style={[{ flex: 1 }, item.checked && { textDecorationLine: 'line-through' }]}>{item.name}</T>
                </Press>
                <Press onPress={() => saveGrocery(current => current.filter(row => row.id !== item.id))} accessibilityLabel={`Remove ${item.name}`} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={17} color={c.ink2} />
                </Press>
              </Animated.View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

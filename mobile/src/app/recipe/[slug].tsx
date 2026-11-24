import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Check, ChefHat, ChevronLeft, ShoppingBasket } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useTheme } from '@/design/theme'
import { addGroceryIngredients, ingredientLabel } from '@/lib/kitchen'
import { formatRecipeTime, recipeBySlug, type Recipe } from '@/lib/recipes'
import { useApp } from '@/state/app'
import { Button, Empty, IconButton, Press, T, haptic } from '@/ui'
import { CookMode, phaseText, StepTimer, useIngredientChecklist, useKitchenTimers } from '@/ui/kitchen-cook'

export default function RecipeDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { session } = useApp()
  const storageKey = `dormosaur:kitchen:${session?.user.id ?? 'local'}:${slug}`
  const recipe = recipeBySlug.get(slug)
  if (!recipe) return <Empty title="Recipe unavailable" body="This recipe could not be found." action="Browse recipes" onAction={() => router.navigate('/kitchen')} />
  return <RecipeScreen key={storageKey} recipe={recipe} storageKey={storageKey} />
}

function RecipeScreen({ recipe, storageKey }: { recipe: Recipe; storageKey: string }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { saveGrocery } = useApp()
  const checklist = useIngredientChecklist(`${storageKey}:ingredients`)
  const timers = useKitchenTimers(`${storageKey}:timers`, recipe.title)
  const [cookOpen, setCookOpen] = useState(false)
  const [cookStep, setCookStep] = useState(0)
  const [groceryStatus, setGroceryStatus] = useState('')
  const timeParts = [
    recipe.prepMinutes > 0 && `Prep ${formatRecipeTime(recipe.prepMinutes)}`,
    recipe.cookMinutes > 0 && `Cook ${formatRecipeTime(recipe.cookMinutes)}`,
    recipe.restMinutes > 0 && `Rest ${formatRecipeTime(recipe.restMinutes)}`,
  ].filter(Boolean)
  const missing = recipe.ingredients.filter((item, index) => item.name !== 'water' && !checklist.checked.has(index))

  async function addMissing() {
    let count = 0
    const saved = await saveGrocery(current => {
      const updated = addGroceryIngredients(current, missing, 'recipe')
      count = updated.length - current.length
      return updated
    })
    if (!saved) return
    if (count) haptic.success()
    setGroceryStatus(count ? `Added ${count} ${count === 1 ? 'item' : 'items'} to Grocery.` : 'These ingredients are already on your grocery list.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <ScrollView accessibilityElementsHidden={cookOpen} importantForAccessibility={cookOpen ? 'no-hide-descendants' : 'auto'} aria-hidden={cookOpen || undefined}
        style={{ width: '100%', maxWidth: 700, alignSelf: 'center' }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ aspectRatio: 5 / 4, backgroundColor: c.fill }}>
          <Image source={recipe.image} placeholder={recipe.placeholder} style={{ width: '100%', height: '100%' }} contentFit="cover" placeholderContentFit="cover" />
        </View>

        <View style={{ marginTop: -26, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: c.grouped, padding: 20, gap: 16 }}>
          <View style={{ gap: 7 }}>
            <T v="overline" color={c.green} style={{ textTransform: 'uppercase' }}>{recipe.meal === 'Snack' ? 'Merienda' : recipe.meal} · {recipe.appliance}</T>
            <T v="title1">{recipe.title}</T>
            <T v="callout" color={c.ink2}>{recipe.blurb}</T>
          </View>

          <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ gap: 3 }}>
                <T v="caption" color={c.ink2}>Estimated total</T>
                <T v="headline">{formatRecipeTime(recipe.minutes)}</T>
              </View>
              <View style={{ gap: 3 }}>
                <T v="caption" color={c.ink2}>Est. per serving</T>
                <T v="headline" color={c.green}>{recipe.cost}</T>
              </View>
              <View style={{ gap: 3 }}>
                <T v="caption" color={c.ink2}>Makes</T>
                <T v="headline">{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</T>
              </View>
            </View>
            <T v="footnote" color={c.ink2}>{timeParts.join(' · ')}</T>
          </View>

          <Button title="Start cook mode" icon={ChefHat} onPress={() => { setCookStep(0); setCookOpen(true) }} />

          <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 16, gap: 5 }}>
            <View style={{ gap: 4, marginBottom: 4 }}>
              <T v="title3">Ingredients</T>
              <T v="footnote" color={c.ink2}>Check off what you already have.</T>
            </View>
            {recipe.ingredients.map((ingredient, index) => {
              const on = checklist.checked.has(index)
              return (
                <Press key={index} scale={0.98} disabled={!checklist.ready}
                  onPress={() => { checklist.toggle(index); setGroceryStatus('') }}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 44, paddingVertical: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? c.green : c.ink3, backgroundColor: on ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Check size={13} color={c.onGreen} strokeWidth={3} />}
                  </View>
                  <T v="callout" color={on ? c.ink2 : c.ink} style={[{ flex: 1 }, on && { textDecorationLine: 'line-through' }]}>{ingredientLabel(ingredient)}</T>
                </Press>
              )
            })}
            {!!recipe.allergens.length && <T v="footnote" color={c.ink2} style={{ marginTop: 6 }}>Contains {recipe.allergens.join(', ')}. Check packaged ingredient labels.</T>}
            <Button title="Add missing to grocery" icon={ShoppingBasket} kind="secondary" disabled={!checklist.ready || !missing.length} onPress={addMissing} style={{ marginTop: 9 }} />
            {!!groceryStatus && <T v="footnote" color={c.ink2} accessibilityLiveRegion="polite">{groceryStatus}</T>}
          </View>

          <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 16, gap: 16 }}>
            <T v="title3">Steps</T>
            {recipe.steps.map((step, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
                <Press accessibilityLabel={`Open cook mode at step ${index + 1}`} onPress={() => { setCookStep(index); setCookOpen(true) }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="footnote" color={c.green} style={{ fontWeight: '800' }}>{index + 1}</T>
                </Press>
                <View style={{ flex: 1, gap: 7, paddingTop: 2 }}>
                  <T v="footnote" color={c.ink2}>{phaseText[step.phase]} · {formatRecipeTime(step.minutes)}</T>
                  <T v="callout">{step.text}</T>
                  <StepTimer timers={timers} step={step} index={index} />
                </View>
              </View>
            ))}
          </View>

          {!!recipe.tip && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.warnSoft, borderRadius: radius.lg, padding: 16 }}>
              <Image source={require('@/assets/images/chef-dormosaur.png')} style={{ width: 48, height: 48 }} contentFit="contain" />
              <T v="subhead" style={{ flex: 1 }}>{recipe.tip}</T>
            </View>
          )}
        </View>
      </ScrollView>
      <View pointerEvents={cookOpen ? 'none' : 'box-none'} accessibilityElementsHidden={cookOpen} importantForAccessibility={cookOpen ? 'no-hide-descendants' : 'auto'} aria-hidden={cookOpen || undefined}
        style={{ position: 'absolute', width: '100%', maxWidth: 700, alignSelf: 'center', top: insets.top + 8, paddingLeft: 16 }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => router.canGoBack() ? router.back() : router.navigate('/kitchen')} />
      </View>
      {cookOpen && <CookMode recipe={recipe} timers={timers} initialStep={cookStep} onClose={() => setCookOpen(false)} />}
    </View>
  )
}

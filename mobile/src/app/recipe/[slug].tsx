import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, ShoppingBasket } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Card, IconButton, Press, T, Tile } from '@/components/ui'
import { color, font, radius } from '@/design/tokens'
import { recipes } from '@/lib/recipes'
import { uid } from '@/lib/repo'
import { useApp } from '@/state/app'

export default function RecipeDetail() {
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const recipe = recipes.find(r => r.slug === slug)
  const [have, setHave] = useState<Set<number>>(new Set())
  const { grocery, saveGrocery } = useApp()
  if (!recipe) return null

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <View>
        <Image source={recipe.image} style={{ width: '100%', aspectRatio: 1.05 }} contentFit="cover" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16 }}>
          <IconButton icon={ChevronLeft} label="Back" onPress={() => router.back()} />
        </View>
      </View>

      <View style={{ marginTop: -36, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: color.canvas, padding: 20, gap: 18 }}>
        <View style={{ gap: 6 }}>
          <T v="label" style={{ color: color.green }}>{recipe.meal} · {recipe.difficulty}</T>
          <T v="title" style={{ fontSize: 28 }}>{recipe.title}</T>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile label="Time" value={`${recipe.minutes} min`} />
          <Tile label="Cost" value={recipe.cost} />
          <Tile label="Uses" value={recipe.appliance} />
        </View>

        <Card style={{ gap: 4 }}>
          <T v="heading" style={{ marginBottom: 6 }}>Ingredients</T>
          {recipe.ingredients.map((ing, i) => {
            const on = have.has(i)
            return (
              <Press key={i} haptic onPress={() => setHave(s => { const n = new Set(s); if (on) n.delete(i); else n.add(i); return n })}
                accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
                <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: on ? color.green : color.line, backgroundColor: on ? color.green : 'transparent' }} />
                <T style={[{ flex: 1 }, on && { color: color.inkMute, textDecorationLine: 'line-through' }]}>{ing}</T>
              </Press>
            )
          })}
        </Card>

        <Button title="Add missing to grocery" icon={ShoppingBasket} kind="secondary" onPress={() => {
          const known = new Set(grocery.map(g => g.name.toLowerCase()))
          const missing = recipe.ingredients.filter((ing, i) => !have.has(i) && !known.has(ing.toLowerCase()))
          saveGrocery([...grocery, ...missing.map(name => ({ id: uid(), name, checked: false }))])
          router.push('/kitchen')
        }} />

        <Card style={{ gap: 16 }}>
          <T v="heading">Steps</T>
          {recipe.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                <T style={{ fontFamily: font.black, fontSize: 13, color: color.green }}>{i + 1}</T>
              </View>
              <T style={{ flex: 1 }}>{s}</T>
            </View>
          ))}
        </Card>

        {!!recipe.tip && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.sunSoft, borderRadius: radius.lg, padding: 16 }}>
            <Image source={require('@/assets/images/chef-dormosaur.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
            <T style={{ flex: 1, color: '#6B4E00' }}>{recipe.tip}</T>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

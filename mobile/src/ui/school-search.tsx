import { Plus, School as SchoolIcon, Search, X } from 'lucide-react-native'
import { useMemo } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { fade } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { searchSchools, type School } from '@/lib/schools'
import { Press, T } from './index'

/** Searchable school list with a "use what I typed" fallback. Used by onboarding and Profile. */
export function SchoolSearch({ query, setQuery, onPick, autoFocus = true }: { query: string; setQuery: (q: string) => void; onPick: (name: string) => void; autoFocus?: boolean }) {
  const { c } = useTheme()
  const results = useMemo(() => searchSchools(query), [query])
  const typed = query.trim()
  const exact = results.some(s => s.name.toLowerCase() === typed.toLowerCase())
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: c.fill }}>
        <Search size={19} color={c.ink3} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search your school" placeholderTextColor={c.ink3} autoFocus={autoFocus}
          autoCorrect={false} returnKeyType="search" accessibilityLabel="Search your school" selectionColor={c.green} maxLength={120}
          style={{ flex: 1, fontSize: 17, color: c.ink }} />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <X size={18} color={c.ink3} />
          </Pressable>
        ) : null}
      </View>
      {results.map((s, i) => <SchoolRow key={s.name} s={s} i={i} onPress={() => onPick(s.name)} />)}
      {typed.length > 1 && !exact && (
        <Press onPress={() => onPick(typed)} scale={0.98} accessibilityLabel={`Use ${typed} as my school`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color={c.green} />
          </View>
          <T v="callout" color={c.green} style={{ flex: 1, fontWeight: '600' }} numberOfLines={2}>Use “{typed}”</T>
        </Press>
      )}
      {!query && <T v="footnote" color={c.ink3} center>Type a name or city. Not listed? You can use any name.</T>}
    </View>
  )
}

function SchoolRow({ s, i, onPress }: { s: School; i: number; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Animated.View entering={fade(i * 30, 200)}>
      <Press onPress={onPress} scale={0.98} accessibilityLabel={`${s.name}, ${s.city}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
          <SchoolIcon size={20} color={c.ink2} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="callout" style={{ fontWeight: '600' }} numberOfLines={2}>{s.name}</T>
          <T v="footnote" color={c.ink3}>{s.city}</T>
        </View>
      </Press>
    </Animated.View>
  )
}

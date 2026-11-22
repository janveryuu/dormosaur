import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols'
import type { LucideIcon } from 'lucide-react-native'
import { Platform } from 'react-native'

/**
 * One icon system for the app: SF Symbols on iOS (native weight, optical
 * alignment), with a single-stroke Lucide fallback on Android and web.
 */
export function Sym({ name, fallback: Fallback, size = 22, color, weight = 'medium' }: {
  name: SFSymbol
  fallback: LucideIcon
  size?: number
  color: string
  weight?: SymbolWeight
}) {
  const stroke = weight === 'semibold' || weight === 'bold' ? 2.2 : 1.9
  const fb = <Fallback size={size} color={color} strokeWidth={stroke} />
  if (Platform.OS !== 'ios') return fb
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} resizeMode="scaleAspectFit" fallback={fb} style={{ width: size, height: size }} />
}

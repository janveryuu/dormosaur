import { View } from 'react-native'
import { radius } from '@/design/theme'
import { T } from '@/ui'

export const PRO_GREEN = '#0B6A40'

/** Small "PRO" pill. `inverted` = green pill for light surfaces. */
export function ProBadge({ inverted }: { inverted?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: inverted ? PRO_GREEN : '#fff' }}>
      <T v="overline" color={inverted ? '#fff' : PRO_GREEN} style={{ fontWeight: '800', letterSpacing: 1 }}>PRO</T>
    </View>
  )
}

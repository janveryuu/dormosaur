import Svg, { Circle, Line } from 'react-native-svg'
import { View } from 'react-native'
import { color } from '@/design/tokens'

/** Tick-mark arc (270°) — the hero gauge on Today. */
export function TickRing({ size = 240, progress, tint = color.green, children }: { size?: number; progress: number; tint?: string; children?: React.ReactNode }) {
  const ticks = 44
  const r = size / 2 - 10
  const c = size / 2
  const start = 135
  const sweep = 270
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * ticks)
  const knob = (start + (sweep * lit) / ticks) * (Math.PI / 180)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const a = (start + (sweep * i) / ticks) * (Math.PI / 180)
          const inner = r - 14
          return (
            <Line key={i}
              x1={c + inner * Math.cos(a)} y1={c + inner * Math.sin(a)}
              x2={c + r * Math.cos(a)} y2={c + r * Math.sin(a)}
              stroke={i <= lit ? tint : color.line} strokeWidth={3.2} strokeLinecap="round" />
          )
        })}
        {lit > 0 && <Circle cx={c + (r - 7) * Math.cos(knob)} cy={c + (r - 7) * Math.sin(knob)} r={7} fill={tint} stroke={color.white} strokeWidth={3} />}
      </Svg>
      {children}
    </View>
  )
}

import { cn } from '@/lib/utils'

const bars = Array.from({ length: 8 })

export function ActivityIndicator({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('relative inline-block size-5 shrink-0', className)}
    >
      {bars.map((_, i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 h-1/2 w-[2px] origin-bottom -translate-x-1/2"
          style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
        >
          <span
            className="block h-[45%] w-full rounded-full bg-current"
            style={{
              animation: 'ios-spin-fade 0.8s linear infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </span>
      ))}
      <style>{`@keyframes ios-spin-fade{0%{opacity:1}100%{opacity:0.15}}`}</style>
    </span>
  )
}

import Image from 'next/image'

const mascotAssets = {
  comfy: '/mascots/dormosaur-comfy-time.png',
  greeting: '/mascots/dormosaur-greeting.png',
  thinking: '/mascots/dormosaur-thinking.png',
  welcome: '/mascots/dormosaur-welcome.png',
  youGotThis: '/mascots/dormosaur-you-got-this.png',
} as const

export type DormosaurMascotVariant = keyof typeof mascotAssets

type DormosaurMascotProps = {
  variant: DormosaurMascotVariant
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

export function DormosaurMascot({
  variant,
  alt,
  width = 220,
  height = 220,
  className,
  priority = false,
  sizes,
}: DormosaurMascotProps) {
  return (
    <Image
      src={mascotAssets[variant]}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  )
}

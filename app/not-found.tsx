import Link from 'next/link'
import { BookOpen, Home } from 'lucide-react'
import { DormosaurMascot } from '@/components/brand/dormosaur-mascot'
import { PillButton } from '@/components/ios/pill-button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-center sm:px-6">
      <div className="w-full max-w-md rounded-4xl border border-border/80 bg-card p-6 shadow-ios-2xl sm:max-w-lg sm:p-8">
        <div className="relative mx-auto mb-5 flex size-32 items-center justify-center sm:size-36">
          <DormosaurMascot
            variant="comfy"
            alt="Dormosaur mascot"
            width={144}
            height={144}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>

        <p className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">
          404 &middot; Page not found
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
          This classroom doesn&apos;t exist
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          The link may have moved or retired. Head back to Dormosaur&apos;s home page or browse the help guides.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link href="/" className="w-full">
            <PillButton size="lg" full>
              <Home className="mr-2 size-4" />
              Go to Home
            </PillButton>
          </Link>
          <Link href="/docs" className="w-full">
            <PillButton variant="secondary" size="lg" full>
              <BookOpen className="mr-2 size-4" />
              Browse Help Docs
            </PillButton>
          </Link>
        </div>
      </div>
    </div>
  )
}

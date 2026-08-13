import type React from 'react'
import { AppNav } from '@/components/app-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background lg:pl-72">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl px-5 pb-28 lg:px-8 lg:pt-4 lg:pb-16">
        {children}
      </main>
    </div>
  )
}

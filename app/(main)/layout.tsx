import type React from 'react'
import { AppNav } from '@/components/app-nav'
import { DormosaurAiChat } from '@/components/ai/chat-widget'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background lg:pl-72">
      <AppNav />
      <main
        className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 lg:!pt-6 lg:!pb-16"
        style={{
          paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <DormosaurAiChat />
    </div>
  )
}

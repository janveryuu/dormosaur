import type React from 'react'
import { AppNav } from '@/components/app-nav'
import { DormosaurAiChat } from '@/components/ai/chat-widget'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background lg:pl-72">
      <AppNav />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 md:px-8 lg:max-w-4xl xl:max-w-5xl lg:px-10 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] lg:pt-8 lg:pb-16 transition-all">
        {children}
      </main>
      <DormosaurAiChat />
    </div>
  )
}

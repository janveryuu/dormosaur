import type React from 'react'
import { AppNav } from '@/components/app-nav'
import { DormosaurAiChat } from '@/components/ai/chat-widget'
import { ScheduleProvider } from '@/components/schedule-provider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScheduleProvider>
      <div className="min-h-dvh bg-background lg:pl-72">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AppNav />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 md:px-8 lg:px-10 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] lg:pt-10 lg:pb-20">
          {children}
        </main>
        <DormosaurAiChat />
      </div>
    </ScheduleProvider>
  )
}

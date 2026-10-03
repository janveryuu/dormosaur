import type React from 'react'
import { ScheduleProvider } from '@/components/schedule-provider'
import { AuthProvider } from '@/hooks/use-auth'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><ScheduleProvider>{children}</ScheduleProvider></AuthProvider>
}

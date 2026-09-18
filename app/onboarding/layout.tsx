import type React from 'react'
import { ScheduleProvider } from '@/components/schedule-provider'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ScheduleProvider>{children}</ScheduleProvider>
}

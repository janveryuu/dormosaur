'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  BedDouble,
  BellRing,
  ChevronRight,
  GraduationCap,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import { IosSwitch } from '@/components/ios/ios-switch'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { PillButton } from '@/components/ios/pill-button'
import { useTheme } from '@/components/theme-provider'
import { profile } from '@/lib/data'

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const [dorm, setDorm] = React.useState(true)
  const [classAlerts, setClassAlerts] = React.useState(true)
  const [mealNudge, setMealNudge] = React.useState(true)
  const [quietHours, setQuietHours] = React.useState(false)
  const [haptics, setHaptics] = React.useState(true)

  return (
    <>
      <PullAffordance />
      <ScreenHeader title="Profile" eyebrow="Account" />

      <div className="flex flex-col gap-7 pb-4">
        <section className="flex items-center gap-4 rounded-4xl bg-card p-5 shadow-ios-lg">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-[22px] font-bold text-primary-foreground">
            {profile.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] leading-tight font-bold tracking-[-0.03em]">
              {profile.name}
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {profile.year} · {profile.school}
            </p>
            <p className="text-[14px] text-muted-foreground">{profile.dorm}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </section>

        <ListGroup title="Student">
          <ListRow
            icon={<GraduationCap className="size-4.5" strokeWidth={1.9} />}
            label="School"
            trailing={
              <span className="text-[15px] text-muted-foreground">{profile.school}</span>
            }
          />
          <ListRow
            icon={<BedDouble className="size-4.5" strokeWidth={1.9} />}
            label="Dorm student"
            detail={dorm ? 'Kitchen filtered to dorm appliances' : 'Showing every recipe'}
            trailing={<IosSwitch checked={dorm} onChange={setDorm} label="Dorm student" />}
          />
        </ListGroup>

        <ListGroup
          title="Notifications"
          footnote="Class alerts follow the lead times you set on the Alarms tab."
        >
          <ListRow
            icon={<BellRing className="size-4.5" strokeWidth={1.9} />}
            label="Class alerts"
            trailing={
              <IosSwitch checked={classAlerts} onChange={setClassAlerts} label="Class alerts" />
            }
          />
          <ListRow
            label="Meal nudges"
            detail="A recipe suggestion when you have a long gap"
            trailing={<IosSwitch checked={mealNudge} onChange={setMealNudge} label="Meal nudges" />}
          />
          <ListRow
            label="Quiet hours"
            detail="Silence everything from 11pm to 7am"
            trailing={<IosSwitch checked={quietHours} onChange={setQuietHours} label="Quiet hours" />}
          />
        </ListGroup>

        <ListGroup title="Appearance">
          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Palette className="size-4.5" strokeWidth={1.9} />
              </span>
              <span className="text-[16px] font-medium tracking-[-0.01em]">Theme</span>
            </div>
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v as 'light' | 'dark')}
              layoutId="theme-toggle"
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
          <ListRow
            icon={
              theme === 'dark' ? (
                <Moon className="size-4.5" strokeWidth={1.9} />
              ) : (
                <Sun className="size-4.5" strokeWidth={1.9} />
              )
            }
            label="Haptic feedback"
            trailing={<IosSwitch checked={haptics} onChange={setHaptics} label="Haptic feedback" />}
          />
        </ListGroup>

        <ListGroup title="Schedule">
          <Link href="/schedule/import">
            <ListRow
              icon={<Zap className="size-4.5" strokeWidth={1.9} />}
              label="Import a new schedule"
              detail="Paste a fresh timetable for next term"
              trailing={<ChevronRight className="size-4.5 text-muted-foreground" />}
            />
          </Link>
          <Link href="/schedule/review">
            <ListRow
              label="Edit parsed classes"
              detail="6 classes on file"
              trailing={<ChevronRight className="size-4.5 text-muted-foreground" />}
            />
          </Link>
        </ListGroup>

        <ListGroup title="Account" footnote="Dormly v1.0 · Made for small rooms and long semesters.">
          <ListRow
            icon={<ShieldCheck className="size-4.5" strokeWidth={1.9} />}
            label="Privacy"
            detail="Your schedule never leaves this device"
            trailing={<ChevronRight className="size-4.5 text-muted-foreground" />}
          />
          <ListRow
            icon={<LogOut className="size-4.5" strokeWidth={1.9} />}
            label={<span className="text-destructive">Sign out</span>}
          />
        </ListGroup>

        <PillButton variant="secondary" size="lg" full className="text-destructive">
          Delete account
        </PillButton>
      </div>
    </>
  )
}

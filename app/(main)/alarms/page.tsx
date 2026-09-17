'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BellRing, Clock, Navigation, Sparkles } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { IosSwitch } from '@/components/ios/ios-switch'
import { LeadPicker, type Lead } from '@/components/ios/lead-picker'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { PillButton, PillLink } from '@/components/ios/pill-button'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, subjectColorClass } from '@/lib/data'
import { triggerPushNotification } from '@/lib/push-notifications'
import { IosToast, type ToastMessage } from '@/components/ios/toast'

export default function AlarmsPage() {
  const { alarms, toggleAlarm, updateAlarmLead } = useSchedule()
  const [preview, setPreview] = React.useState(false)
  const [aiNudges, setAiNudges] = React.useState<Record<string, string>>({})
  const [toast, setToast] = React.useState<ToastMessage | null>(null)

  const groups = Array.from(new Set(alarms.map((a) => a.day || 'Today')))
  if (groups.length === 0) groups.push('Today')

  const activeAlarms = alarms.filter((a) => a.enabled)
  const activeCount = activeAlarms.length

  // Find next upcoming active alarm
  const nextAlarm = activeAlarms[0] || alarms[0]

  // Calculate ring time for nextAlarm
  const nextAlarmRingTime = React.useMemo(() => {
    if (!nextAlarm) return null
    const [h, m] = nextAlarm.time.split(':').map(Number)
    const total = h * 60 + m - nextAlarm.lead
    const ringH = String(Math.floor(total / 60)).padStart(2, '0')
    const ringM = String(total % 60).padStart(2, '0')
    return `${ringH}:${ringM}`
  }, [nextAlarm])

  // Fetch AI Smart Nudges for active alarms
  React.useEffect(() => {
    async function loadNudges() {
      const nudges: Record<string, string> = {}
      for (const a of alarms) {
        if (!a.enabled) continue
        try {
          const res = await fetch('/api/alarms/smart-nudge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: a.subject,
              room: 'Sci Hall 204',
              minutes_until: a.lead,
              is_first_class_today: a.id === 'a1',
              gap_before_minutes: a.id === 'a2' ? 0 : 45,
              reminder_item: a.subject.includes('Calculus') ? 'calculator' : null,
            }),
          })
          const data = await res.json()
          if (data.nudge) nudges[a.id] = data.nudge
        } catch (e) {
          console.warn('Smart nudge notice:', e)
        }
      }
      setAiNudges(nudges)
    }
    loadNudges()
  }, [alarms])

  return (
    <>
      <ScreenHeader
        title="Alarms"
        eyebrow="Smart Timetable Sync"
        subtitle={`${activeCount} of ${alarms.length} alarms active. Auto-calculated with campus walking lead times.`}
        headerGraphic={
          <img
            src="/ai-dormosaur.png"
            alt="AI Dormosaur"
            className="size-16 sm:size-20 md:size-24 object-contain drop-shadow-md hover:scale-105 transition-transform select-none"
          />
        }
      />

      <div className="flex flex-col gap-6">
        {/* ── Native Alarm Spotlight Hero Card ── */}
        {nextAlarm && (
          <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-ios">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  {nextAlarm.enabled ? 'Upcoming Alarm' : 'Next Alarm (Disabled)'}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-foreground tabular-nums">
                    {nextAlarmRingTime ? formatTime(nextAlarmRingTime) : formatTime(nextAlarm.time)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    ({nextAlarm.lead}m lead)
                  </span>
                </div>
                <p className="mt-1 text-[13.5px] font-medium text-foreground">
                  For {nextAlarm.subject} at {formatTime(nextAlarm.time)}
                </p>
              </div>

              <IosSwitch
                checked={nextAlarm.enabled}
                onChange={(enabled) => toggleAlarm(nextAlarm.id, enabled)}
                label="Toggle next alarm"
              />
            </div>

            {/* Smart Nudge Mini Banner */}
            {nextAlarm.enabled && (
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-xs font-semibold text-primary">
                <Sparkles className="size-4 shrink-0" />
                <span className="truncate">
                  {aiNudges[nextAlarm.id] ||
                    `AI Nudge: ${nextAlarm.subject} in ${nextAlarm.lead} min — Sci Hall 204`}
                </span>
              </div>
            )}
          </section>
        )}

        {/* ── AI Smart Nudge & Push Test Card ── */}
        <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <img
              src="/ai-dormosaur.png"
              alt="AI Dormosaur"
              className="size-11 object-contain drop-shadow-xs shrink-0 select-none"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[14.5px] font-bold text-foreground">
                Groq Llama 3 AI Smart Nudges
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Calculates walking buffer and suggests items to bring (e.g. lab coat, calculator).
              </p>
            </div>
          </div>

          <div className="mt-3">
            <NotificationBanner
              inline
              open={preview}
              onClose={() => setPreview(false)}
              title="Calculus I starts in 15 min"
              body="Sci Hall 204 · Leave the dorm now to be on time."
              aiNudge={
                aiNudges[alarms[0]?.id] ||
                "Calc I in 15 — it's in Sci Hall 204, grab your calculator."
              }
            />
          </div>

          <PillButton
            variant="secondary"
            size="sm"
            full
            className="mt-3 cursor-pointer"
            onClick={async () => {
              const nextState = !preview
              setPreview(nextState)
              if (nextState) {
                const nudgeBody =
                  aiNudges[alarms[0]?.id] ||
                  'Calc I in 15 — Sci Hall 204, grab your calculator.'
                await triggerPushNotification({
                  title: 'Calculus I starts in 15 min',
                  body: nudgeBody,
                  tag: `dormosaur-ai-nudge-${Date.now()}`,
                  url: '/alarms',
                })
                setToast({
                  type: 'success',
                  title: 'Calculus I starts in 15 min',
                  message: nudgeBody,
                })
              }
            }}
          >
            {preview ? 'Hide AI Preview' : 'Preview AI Notification & Test Web Push'}
          </PillButton>
        </section>

        <IosToast toast={toast} onClose={() => setToast(null)} />

        {/* ── Alarms Grouped By Day ── */}
        {alarms.length === 0 ? (
          <section className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-2xs">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BellRing className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">No alarms set</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Alarms are automatically generated from your timetable. Import your courses to enable smart wakeups.
              </p>
            </div>
            <PillLink href="/schedule/import" size="sm">
              Import Schedule
            </PillLink>
          </section>
        ) : (
          groups.map((group) => {
            const groupAlarms = alarms.filter((a) => a.day === group)
            if (groupAlarms.length === 0) return null

            return (
              <section key={group} className="flex flex-col gap-2">
                <div className="sticky z-10 -mx-4 sm:-mx-6 md:-mx-8 lg:mx-0 px-4 sm:px-6 md:px-8 lg:px-0 py-1.5 backdrop-blur-md bg-background/85 flex items-center justify-between border-b border-border/30 top-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:top-0 transition-all">
                  <h3 className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
                    {group}
                  </h3>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {groupAlarms.filter((a) => a.enabled).length} of {groupAlarms.length} on
                  </span>
                </div>

                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ios divide-y divide-border/50">
                  {groupAlarms.map((alarm) => {
                    const color = subjectColorClass[alarm.color] || subjectColorClass[1]
                    const [h, m] = alarm.time.split(':').map(Number)
                    const total = h * 60 + m - alarm.lead
                    const ringAt = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
                      total % 60,
                    ).padStart(2, '0')}`

                    const nudge = aiNudges[alarm.id]

                    return (
                      <div
                        key={alarm.id}
                        className="flex flex-col gap-2.5 p-4 sm:p-4.5 transition-colors hover:bg-fill/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-10 w-1.5 shrink-0 rounded-full ${color.bg}`} />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[15.5px] font-bold tracking-tight ${
                                alarm.enabled ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {alarm.subject}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                              Class {formatTime(alarm.time)} · Rings {formatTime(ringAt)}
                            </p>
                          </div>

                          <LeadPicker
                            value={alarm.lead as Lead}
                            onChange={(lead) => updateAlarmLead(alarm.id, lead)}
                            label={alarm.subject}
                          />

                          <IosSwitch
                            checked={alarm.enabled}
                            onChange={(enabled) => toggleAlarm(alarm.id, enabled)}
                            label={`${alarm.subject} alarm`}
                          />
                        </div>

                        {/* Smart Nudge Pill */}
                        {alarm.enabled && (
                          <div className="ml-4.5 flex items-center gap-2 rounded-xl bg-fill px-3 py-1.5 text-[11.5px] font-medium text-foreground border border-border/40">
                            <Sparkles className="size-3 shrink-0 text-primary" />
                            <span className="truncate text-muted-foreground">
                              {nudge ||
                                `Lead time: ${alarm.lead}m walking buffer`}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        <p className="px-4 pb-4 text-center text-xs text-muted-foreground leading-relaxed">
          Alarms update dynamically with your class timetable and campus walking lead times.
        </p>
      </div>
    </>
  )
}

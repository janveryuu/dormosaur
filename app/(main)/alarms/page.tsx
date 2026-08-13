'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BellRing, Sparkles } from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { IosSwitch } from '@/components/ios/ios-switch'
import { LeadPicker, type Lead } from '@/components/ios/lead-picker'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, subjectColorClass } from '@/lib/data'
import { requestAndSubscribePush, triggerPushNotification } from '@/lib/push-notifications'
import { IosToast, type ToastMessage } from '@/components/ios/toast'

export default function AlarmsPage() {
  const { alarms, toggleAlarm, updateAlarmLead } = useSchedule()
  const [preview, setPreview] = React.useState(false)
  const [aiNudges, setAiNudges] = React.useState<Record<string, string>>({})
  const [toast, setToast] = React.useState<ToastMessage | null>(null)

  const groups = Array.from(new Set(alarms.map((a) => a.day || 'Today')))
  if (groups.length === 0) groups.push('Today')

  const activeCount = alarms.filter((a) => a.enabled).length

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
      <PullAffordance />
      <ScreenHeader
        title="Alarms"
        eyebrow="Auto-synced"
        subtitle={`${activeCount} of ${alarms.length} alarms are on. Every alarm features Groq Llama 3 AI Smart Nudges.`}
        headerGraphic={
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative flex items-center justify-center shrink-0"
          >
            <img
              src="/sleeping-dino.png"
              alt="Sleeping Dormosaur"
              className="h-28 sm:h-36 md:h-40 w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform"
            />
          </motion.div>
        }
      />

      <div className="flex flex-col gap-7">
        <section className="rounded-4xl bg-card p-5 shadow-ios-lg">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16.5px] font-semibold tracking-[-0.015em]">
                Dormosaur's Smart Nudge
              </h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                Llama 3 personalizes every notification with exact room, lead time, and item cues.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <NotificationBanner
              inline
              open={preview}
              onClose={() => setPreview(false)}
              title="Calculus I starts in 15 min"
              body="Sci Hall 204 · Leave the dorm now to be on time."
              aiNudge={aiNudges[alarms[0]?.id] || "Calc I in 15 — it's in Sci Hall 204, grab your calculator."}
            />
          </div>

          <PillButton
            variant="secondary"
            size="md"
            full
            className="mt-4"
            onClick={async () => {
              const nextState = !preview
              setPreview(nextState)
              if (nextState) {
                const nudgeBody =
                  aiNudges[alarms[0]?.id] || "Calc I in 15 — Sci Hall 204, grab your calculator."
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
            {preview ? 'Hide AI banner' : 'Test AI Nudge Banner & Real Push'}
          </PillButton>
        </section>

        <IosToast toast={toast} onClose={() => setToast(null)} />

        {alarms.length === 0 ? (
          <section className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <BellRing className="size-7" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-foreground">No alarms set</h3>
              <p className="text-[13.5px] text-muted-foreground mt-1 max-w-sm">
                Alarms are automatically generated from your class schedule. Import your timetable to get started.
              </p>
            </div>
            <a
              href="/schedule/import"
              className="mt-1 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm transition-all hover:scale-105"
            >
              Import Schedule
            </a>
          </section>
        ) : (
          groups.map((group) => {
          const groupAlarms = alarms.filter((a) => a.day === group)
          if (groupAlarms.length === 0) return null

          return (
            <section key={group}>
              <div className="ios-glass sticky top-14 z-10 -mx-5 flex items-baseline gap-2 px-5 py-2 lg:-mx-8 lg:px-8">
                <h2 className="text-[17px] font-bold tracking-[-0.02em]">{group}</h2>
                <span className="text-[13.5px] text-muted-foreground">
                  {groupAlarms.filter((a) => a.enabled).length} on
                </span>
              </div>

              <div className="mt-2 overflow-hidden rounded-3xl bg-card shadow-ios">
                <ul className="flex flex-col divide-y divide-separator">
                  {groupAlarms.map((alarm, index) => {
                    const color = subjectColorClass[alarm.color]
                    const [h, m] = alarm.time.split(':').map(Number)
                    const total = h * 60 + m - alarm.lead
                    const ringAt = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
                      total % 60,
                    ).padStart(2, '0')}`

                    const nudge = aiNudges[alarm.id]

                    return (
                      <motion.li
                        key={alarm.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 340,
                          damping: 30,
                          delay: index * 0.04,
                        }}
                        className="flex flex-col gap-2.5 px-4 py-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-10 w-1 shrink-0 rounded-full ${color.bg}`} />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[16px] font-semibold tracking-[-0.015em] ${
                                alarm.enabled ? '' : 'text-muted-foreground'
                              }`}
                            >
                              {alarm.subject}
                            </p>
                            <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                              Class {formatTime(alarm.time)} · rings {formatTime(ringAt)}
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

                        {/* Live AI Smart Nudge Preview Pill */}
                        {alarm.enabled && (
                          <div className="ml-4 flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-[12px] font-medium text-primary">
                            <Sparkles className="size-3.5 shrink-0 text-primary" />
                            <span className="truncate">{nudge || `AI Nudge: ${alarm.subject} in ${alarm.lead} min — Sci Hall 204`}</span>
                          </div>
                        )}
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )
        }))}

        <p className="px-4 pb-2 text-center text-[13px] leading-relaxed text-muted-foreground">
          Alarms follow your timetable. Editing a class in Schedule updates its alarm and AI smart nudge automatically.
        </p>
      </div>
    </>
  )
}

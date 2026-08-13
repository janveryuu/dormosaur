'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { IosSwitch } from '@/components/ios/ios-switch'
import { LeadPicker, type Lead } from '@/components/ios/lead-picker'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { PillButton } from '@/components/ios/pill-button'
import { alarms as seedAlarms, formatTime, subjectColorClass } from '@/lib/data'

export default function AlarmsPage() {
  const [alarms, setAlarms] = React.useState(seedAlarms)
  const [preview, setPreview] = React.useState(false)

  const setLead = (id: string, lead: Lead) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, lead } : a)))

  const setEnabled = (id: string, enabled: boolean) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)))

  const groups = ['Today', 'Tomorrow']
  const activeCount = alarms.filter((a) => a.enabled).length

  return (
    <>
      <PullAffordance />
      <ScreenHeader
        title="Alarms"
        eyebrow="Auto-synced"
        subtitle={`${activeCount} of ${alarms.length} alarms are on. Change a class time and its alarm moves with it.`}
      />

      <div className="flex flex-col gap-7">
        <section className="rounded-4xl bg-card p-5 shadow-ios-lg">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <BellRing className="size-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16.5px] font-semibold tracking-[-0.015em]">
                Notification preview
              </h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                This is what an alarm looks like in-app.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <NotificationBanner
              inline
              open={preview}
              onClose={() => setPreview(false)}
              title="Math 101 starts in 15 min"
              body="Sci Hall 204 · Leave the dorm now to be on time."
            />
          </div>

          <PillButton
            variant="secondary"
            size="md"
            full
            className="mt-4"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? 'Hide banner' : 'Show banner'}
          </PillButton>
        </section>

        {groups.map((group) => {
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
                        className="flex items-center gap-3 px-4 py-3.5"
                      >
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
                          onChange={(lead) => setLead(alarm.id, lead)}
                          label={alarm.subject}
                        />
                        <IosSwitch
                          checked={alarm.enabled}
                          onChange={(enabled) => setEnabled(alarm.id, enabled)}
                          label={`${alarm.subject} alarm`}
                        />
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )
        })}

        <p className="px-4 pb-2 text-center text-[13px] leading-relaxed text-muted-foreground">
          Alarms follow your timetable. Editing a class in Schedule updates its alarm automatically.
        </p>
      </div>
    </>
  )
}

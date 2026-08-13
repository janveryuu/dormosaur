'use client'

import { useMemo, useState } from 'react'
import { AlarmClock, CheckCircle2, Search, XCircle, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/admin/stat-card'

interface SchedulesAlarmsTabsProps {
  data: {
    parsedSchedules: {
      id: string
      studentName: string
      schoolName: string
      subject: string
      code?: string
      days: string
      time: string
      room: string
    }[]
    activeAlarms: {
      id: string
      studentName: string
      label: string
      time: string
      days: string
      sound: string
      enabled: boolean
    }[]
    stats: {
      sent24h: number
      failed24h: number
      successRate: string
    }
  }
}

export function SchedulesAlarmsTabs({ data }: SchedulesAlarmsTabsProps) {
  const [scheduleQuery, setScheduleQuery] = useState('')
  const [alarmQuery, setAlarmQuery] = useState('')

  const filteredSchedules = useMemo(() => {
    const q = scheduleQuery.trim().toLowerCase()
    if (!q) return data.parsedSchedules
    return data.parsedSchedules.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q))
    )
  }, [scheduleQuery, data.parsedSchedules])

  const filteredAlarms = useMemo(() => {
    const q = alarmQuery.trim().toLowerCase()
    if (!q) return data.activeAlarms
    return data.activeAlarms.filter(
      (a) => a.studentName.toLowerCase().includes(q) || a.label.toLowerCase().includes(q)
    )
  }, [alarmQuery, data.activeAlarms])

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Push Alarms Sent (24h)"
          value={data.stats.sent24h.toLocaleString()}
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed Deliveries (24h)"
          value={data.stats.failed24h.toLocaleString()}
          icon={XCircle}
        />
        <StatCard
          label="Delivery Success Rate"
          value={data.stats.successRate}
          icon={AlarmClock}
        />
      </div>

      <Tabs defaultValue="schedules">
        <TabsList className="mb-4">
          <TabsTrigger value="schedules">Parsed Schedules ({data.parsedSchedules.length})</TabsTrigger>
          <TabsTrigger value="alarms">Active Alarms ({data.activeAlarms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
            <div className="relative mb-4 w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={scheduleQuery}
                onChange={(e) => setScheduleQuery(e.target.value)}
                placeholder="Search by student or class..."
                className="h-10 rounded-full pl-9 bg-background/50"
              />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold">Student Name</TableHead>
                    <TableHead className="font-bold">Subject / Code</TableHead>
                    <TableHead className="font-bold">Schedule Days</TableHead>
                    <TableHead className="font-bold">Class Time</TableHead>
                    <TableHead className="font-bold">Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((s, i) => (
                    <TableRow key={s.id || i} className="border-border/40 hover:bg-accent/40">
                      <TableCell className="font-semibold text-foreground">{s.studentName}</TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {s.code ? `${s.code} - ` : ''}{s.subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.days}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{s.time}</TableCell>
                      <TableCell className="text-muted-foreground">{s.room}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No parsed class schedule entries match your query.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alarms">
          <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
            <div className="relative mb-4 w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={alarmQuery}
                onChange={(e) => setAlarmQuery(e.target.value)}
                placeholder="Search by student or alarm label..."
                className="h-10 rounded-full pl-9 bg-background/50"
              />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold">Student Name</TableHead>
                    <TableHead className="font-bold">Alarm Label</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Days</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlarms.map((a, i) => (
                    <TableRow key={a.id || i} className="border-border/40 hover:bg-accent/40">
                      <TableCell className="font-semibold text-foreground">{a.studentName}</TableCell>
                      <TableCell className="text-muted-foreground font-medium">{a.label}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{a.time}</TableCell>
                      <TableCell className="text-muted-foreground">{a.days}</TableCell>
                      <TableCell>
                        <Badge
                          variant={a.enabled ? 'default' : 'outline'}
                          className={a.enabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                        >
                          {a.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAlarms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No active class alarms match your query.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

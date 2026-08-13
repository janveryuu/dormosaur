'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  AlarmClock,
  ChefHat,
  LogIn,
  ShieldAlert,
  UserPlus,
  UserX,
  Activity as ActivityIcon,
  Settings,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import { formatDateTime } from '@/lib/format-admin'

interface ActivityLogItem {
  id: string
  event_type: string
  description: string
  related_user_id?: string
  performed_by?: string
  created_at: string
}

const EVENT_ICONS: Record<string, typeof LogIn> = {
  signup: UserPlus,
  login: LogIn,
  schedule_parsed: AlarmClock,
  alarm_failed: ShieldAlert,
  recipe_edited: ChefHat,
  user_suspended: UserX,
  settings_updated: Settings,
}

export function ActivityLogList({ logs }: { logs: ActivityLogItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentFilter = searchParams.get('type') || 'all'
  const [filter, setFilter] = useState(currentFilter)

  const handleFilterChange = (val: string) => {
    setFilter(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val && val !== 'all') params.set('type', val)
    else params.delete('type')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Audit Event History ({logs.length} events)
        </span>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-56 bg-card border border-border/40">
            <SelectValue placeholder="All event types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            <SelectItem value="signup">Signups</SelectItem>
            <SelectItem value="login">Logins</SelectItem>
            <SelectItem value="schedule_parsed">Schedule Parsed</SelectItem>
            <SelectItem value="alarm_failed">Alarm Failures</SelectItem>
            <SelectItem value="recipe_edited">Recipe Edits</SelectItem>
            <SelectItem value="settings_updated">Settings Updates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ListGroup>
        {logs.map((log) => {
          const Icon = EVENT_ICONS[log.event_type] || ActivityIcon
          return (
            <ListRow
              key={log.id}
              icon={<Icon className="size-4 text-primary" />}
              label={log.description}
              detail={formatDateTime(log.created_at)}
              trailing={
                <span className="rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border border-border/40">
                  {log.event_type.replace('_', ' ')}
                </span>
              }
            />
          )
        })}
        {logs.length === 0 && (
          <div className="px-4 py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <ActivityIcon className="size-8 text-muted-foreground/40" />
            <p className="font-semibold text-sm">No activity logs recorded for this event filter.</p>
          </div>
        )}
      </ListGroup>
    </div>
  )
}

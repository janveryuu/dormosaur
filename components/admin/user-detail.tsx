'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlarmClock,
  Ban,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  Laptop,
  LogIn,
  Mail,
  School,
  ShieldCheck,
  Utensils,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import type { AdminUserDetail } from '@/lib/admin-db'
import { formatDate, formatDateTime } from '@/lib/format-admin'

export function UserDetail({ userDetail }: { userDetail: AdminUserDetail }) {
  const router = useRouter()
  const { profile, classes, alarms, deadlines } = userDetail
  const [suspended, setSuspended] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.2} />
        Back to Users list
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-[22px] font-black text-primary-foreground shadow-ios-sm">
            {profile.initials}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">{profile.name}</h1>
              {suspended && <Badge variant="destructive">Suspended</Badge>}
              {profile.is_dorm_student && <Badge variant="secondary">Dorm Student</Badge>}
              <Badge variant="outline" className="font-mono text-xs">{profile.country}</Badge>
            </div>
            <p className="mt-1 text-[14px] text-muted-foreground font-medium">
              {profile.school} &middot; {profile.dorm} &middot; {profile.year}
            </p>
          </div>
        </div>

        <Button
          variant={suspended ? 'outline' : 'destructive'}
          onClick={() => setConfirmOpen(true)}
          className="rounded-full font-bold"
        >
          <Ban className="size-4 mr-1.5" />
          {suspended ? 'Reinstate Account' : 'Suspend Account'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ListGroup title="Profile Information">
            <ListRow icon={<Mail className="size-4" />} label="Email" detail={profile.email} />
            <ListRow icon={<School className="size-4" />} label="School" detail={profile.school} />
            <ListRow icon={<MapPin className="size-4" />} label="Country & Timezone" detail={`${profile.country} (${profile.timezone})`} />
            <ListRow
              icon={<Utensils className="size-4" />}
              label="Dietary preference"
              trailing={<Badge variant="secondary">{profile.dietary_preference}</Badge>}
            />
            <ListRow
              icon={<CalendarDays className="size-4" />}
              label="Signed up"
              detail={formatDate(profile.created_at)}
            />
            <ListRow
              icon={<ShieldCheck className="size-4" />}
              label="Account status"
              trailing={
                <Badge variant={suspended ? 'destructive' : 'outline'}>
                  {suspended ? 'Suspended' : 'Active'}
                </Badge>
              }
            />
          </ListGroup>

          <ListGroup title="Dorm Appliances">
            {profile.appliances.length > 0 ? (
              profile.appliances.map((a) => (
                <ListRow key={a} label={a.replace('_', ' ').toUpperCase()} />
              ))
            ) : (
              <ListRow label="No appliances registered" detail="Standard dorm setup" />
            )}
          </ListGroup>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <ListGroup title={`Parsed Classes (${classes.length})`} footnote="Parsed schedule entries stored in Supabase classes table.">
            {classes.length > 0 ? (
              classes.map((c, i) => (
                <ListRow
                  key={c.id || i}
                  icon={<BookOpen className="size-4" />}
                  label={`${c.code ? `${c.code}: ` : ''}${c.subject}`}
                  detail={`${Array.isArray(c.days) ? c.days.join(', ') : c.days} \u00B7 ${c.start} - ${c.end} \u00B7 ${c.room || 'No room'}`}
                />
              ))
            ) : (
              <ListRow label="No classes uploaded yet" detail="Student has not parsed a schedule." />
            )}
          </ListGroup>

          <ListGroup title={`Active Alarms (${alarms.length})`}>
            {alarms.length > 0 ? (
              alarms.map((a, i) => (
                <ListRow
                  key={a.id || i}
                  icon={<AlarmClock className="size-4" />}
                  label={a.label || a.subject || 'Class Alarm'}
                  detail={`Time: ${a.time} \u00B7 ${Array.isArray(a.days) ? a.days.join(', ') : a.days}`}
                  trailing={
                    <Badge variant={a.enabled !== false ? 'default' : 'outline'}>
                      {a.enabled !== false ? 'Active' : 'Disabled'}
                    </Badge>
                  }
                />
              ))
            ) : (
              <ListRow label="No active alarms" detail="Student has not configured alarm schedules." />
            )}
          </ListGroup>

          <ListGroup title={`Tracked Deadlines (${deadlines.length})`}>
            {deadlines.length > 0 ? (
              deadlines.map((d, i) => (
                <ListRow
                  key={d.id || i}
                  icon={<LogIn className="size-4" />}
                  label={d.title || d.subject}
                  detail={`Due: ${d.date || d.due_date} \u00B7 Priority: ${d.priority || 'Normal'}`}
                />
              ))
            ) : (
              <ListRow label="No deadlines logged" detail="Student task board is clear." />
            )}
          </ListGroup>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspended ? 'Reinstate this account?' : 'Suspend this account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspended
                ? `${profile.name} will regain access to schedules, alarms, and the recipe library immediately.`
                : `${profile.name} will lose access to the app until reinstated. This does not delete their data.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSuspended((s) => !s)
                router.refresh()
              }}
            >
              {suspended ? 'Reinstate' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

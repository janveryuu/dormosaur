import { getSchedulesAndAlarmsData } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { SchedulesAlarmsTabs } from '@/components/admin/schedules-alarms-tabs'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function AdminSchedulesPage({ searchParams }: PageProps) {
  const adminUser = await requireAdminSession()
  const params = await searchParams
  const search = params.search || ''

  const data = await getSchedulesAndAlarmsData(search)

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Schedules & Push Alarms"
        description="Monitor parsed student class timetables, active alarms, and push delivery health."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <SchedulesAlarmsTabs data={data} />
    </div>
  )
}

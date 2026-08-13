import { getActivityLogs } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { ActivityLogList } from '@/components/admin/activity-log-list'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    type?: string
  }>
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const adminUser = await requireAdminSession()
  const params = await searchParams
  const eventType = params.type || 'all'

  const logs = await getActivityLogs(eventType)

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="System Activity Audit Log"
        description="Real-time audit log of student signups, schedule parsing, logins, and admin actions."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <ActivityLogList logs={logs} />
    </div>
  )
}

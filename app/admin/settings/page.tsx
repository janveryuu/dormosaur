import { getAdminSettings } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { AdminSettingsForm } from '@/components/admin/admin-settings-form'

export const revalidate = 0

export default async function AdminSettingsPage() {
  const adminUser = await requireAdminSession()
  const settings = await getAdminSettings()

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Admin & System Configurations"
        description="Configure automated system alerts, security requirements, and regional sync policies."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <AdminSettingsForm initialSettings={settings} />
    </div>
  )
}

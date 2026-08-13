import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { KitchenGrid } from '@/components/admin/kitchen-grid'

export const revalidate = 0

export default async function AdminKitchenPage() {
  const adminUser = await requireAdminSession()

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Kitchen Content & Recipe Library"
        description="Manage student meal recipes, pricing, cook times, and dietary tags."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <KitchenGrid />
    </div>
  )
}

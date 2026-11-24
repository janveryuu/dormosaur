import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { KitchenGrid } from '@/components/admin/kitchen-grid'
import { loadMobileRecipes } from '@/lib/admin-recipes'

export const revalidate = 0

export default async function AdminKitchenPage() {
  const adminUser = await requireAdminSession()
  const recipes = loadMobileRecipes()

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
        description={`Read-only view of all ${recipes.length} student recipes bundled in the mobile app (₱ PHP pricing).`}
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <KitchenGrid recipes={recipes} />
    </div>
  )
}

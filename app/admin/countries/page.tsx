import { getCountriesDistribution } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { CountriesTable } from '@/components/admin/countries-table'

export const revalidate = 0

export default async function AdminCountriesPage() {
  const adminUser = await requireAdminSession()
  const data = await getCountriesDistribution()

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Countries & Regional Localization"
        description="View real student user distribution across global countries and active timezones."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <CountriesTable countries={data.countries} />
    </div>
  )
}

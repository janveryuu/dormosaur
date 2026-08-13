import { getUsersList } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { UsersTable } from '@/components/admin/users-table'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    search?: string
    filter?: string
    page?: string
  }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const adminUser = await requireAdminSession()
  const params = await searchParams

  const search = params.search || ''
  const filter = params.filter || 'all'
  const page = parseInt(params.page || '1', 10)

  const data = await getUsersList({ search, filter, page, pageSize: 10 })

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Student User Management"
        description="Search, filter, and inspect registered student profiles and auth metadata."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <UsersTable
        users={data.users}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        currentPage={data.currentPage}
        initialSearch={search}
        initialFilter={filter}
      />
    </div>
  )
}

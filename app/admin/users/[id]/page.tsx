import { notFound } from 'next/navigation'
import { getUserDetail } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { UserDetail } from '@/components/admin/user-detail'
import { ProControl } from '@/components/admin/pro-control'
import { getProStatus } from '@/lib/pro'

export const revalidate = 0

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const adminUser = await requireAdminSession()
  const { id } = await params

  const [userDetail, pro] = await Promise.all([getUserDetail(id), getProStatus(id)])

  if (!userDetail) {
    notFound()
  }

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title={`Student Profile: ${userDetail.profile.name}`}
        description="Inspect student schedule entries, alarm settings, and account details."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      <ProControl userId={id} isPro={pro.isPro} plan={pro.plan} endsAt={pro.endsAt} lifetime={pro.lifetime} />
      <UserDetail userDetail={userDetail} />
    </div>
  )
}

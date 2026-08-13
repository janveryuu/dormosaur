import * as React from 'react'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Security Check: Redirect non-admin users immediately
  const adminUser = await requireAdminSession()

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AdminSidebar adminName={adminUser.name} adminInitials={adminInitials} />
      <main className="flex-1 pb-24 pt-6 px-4 lg:pl-76 lg:pr-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <AdminMobileNav />
    </div>
  )
}

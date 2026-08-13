import { getOverviewStats } from '@/lib/admin-db'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { StatCard } from '@/components/admin/stat-card'
import { RecentLoginsCard } from '@/components/admin/recent-logins-card'
import { UsersByCountryChart } from '@/components/admin/users-by-country-chart'
import { UsersByDietChart } from '@/components/admin/users-by-diet-chart'
import { Users, BookOpen, AlarmClock, Calendar, Bell } from 'lucide-react'

export const revalidate = 0 // Live real-time queries

export default async function AdminOverviewPage() {
  const adminUser = await requireAdminSession()
  const stats = await getOverviewStats()

  const adminInitials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Dormosaur Admin Overview"
        description="Live aggregate system analytics and student management."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />

      {/* Aggregate Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Students"
          value={stats.totalStudents}
          icon={Users}
          trend="+100% real profiles"
        />
        <StatCard
          label="Classes Parsed"
          value={stats.totalClasses}
          icon={BookOpen}
          trend="OCR & Vision"
        />
        <StatCard
          label="Active Alarms"
          value={stats.totalAlarms}
          icon={AlarmClock}
          trend="Smart Nudges"
        />
        <StatCard
          label="Tracked Deadlines"
          value={stats.totalDeadlines}
          icon={Calendar}
          trend="Task Board"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Student Logins */}
        <div className="lg:col-span-2">
          <RecentLoginsCard logins={stats.recentLogins} />
        </div>

        {/* Demographics & Dietary Panels */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
            <UsersByCountryChart counts={stats.countryCounts} />
          </div>
          <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
            <UsersByDietChart counts={stats.dietaryCounts} />
          </div>
        </div>
      </div>
    </div>
  )
}

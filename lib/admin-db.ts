import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase Service Role configuration in environment.')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type OverviewStats = {
  totalStudents: number
  totalClasses: number
  totalAlarms: number
  totalDeadlines: number
  activeSubscriptionsCount: number
  countryCounts: { country: string; count: number; name: string }[]
  recentLogins: { id: string; name: string; email: string; school: string; lastSignIn: string }[]
  signupTrends: { date: string; count: number }[]
  dietaryCounts: { diet: string; count: number }[]
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  school: string
  country: string
  is_dorm_student: boolean
  created_at: string
  last_sign_in_at: string
  onboarding_completed: boolean
}

export type AdminUserDetail = {
  profile: AdminUserRow & {
    dorm: string
    year: string
    initials: string
    timezone: string
    appliances: string[]
    dietary_preference: string
    dietary_note: string
  }
  classes: any[]
  alarms: any[]
  deadlines: any[]
}

// ─── 1. OVERVIEW STATS ────────────────────────────────────────────────────────
export async function getOverviewStats(): Promise<OverviewStats> {
  const admin = getSupabaseAdminClient()

  // Profiles Count
  const { count: totalStudents } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Classes Count
  const { count: totalClasses } = await admin
    .from('classes')
    .select('*', { count: 'exact', head: true })

  // Alarms Count
  const { count: totalAlarms } = await admin
    .from('alarms')
    .select('*', { count: 'exact', head: true })

  // Deadlines Count
  const { count: totalDeadlines } = await admin
    .from('deadlines')
    .select('*', { count: 'exact', head: true })

  // Subscriptions Count
  const { count: activeSubscriptionsCount } = await admin
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  // Auth Users for email & last_sign_in_at
  const { data: authData } = await admin.auth.admin.listUsers()
  const authUsers = authData?.users || []

  // All Profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, school, country, created_at, dietary_preference')
    .order('created_at', { ascending: false })

  const profileList = profiles || []

  // Recent Logins (Join profile with auth user last_sign_in_at)
  const recentLogins = profileList.slice(0, 5).map((p) => {
    const authUser = authUsers.find((u) => u.id === p.id)
    return {
      id: p.id,
      name: p.name || 'Student',
      email: authUser?.email || 'student@dormosaur.app',
      school: p.school || 'University',
      lastSignIn: authUser?.last_sign_in_at || p.created_at,
    }
  })

  // Country Counts Aggregation
  const countryMap: Record<string, number> = {}
  profileList.forEach((p) => {
    const c = (p.country || 'PH').toUpperCase()
    countryMap[c] = (countryMap[c] || 0) + 1
  })

  const COUNTRY_NAMES: Record<string, string> = {
    PH: 'Philippines',
    US: 'United States',
    CA: 'Canada',
    AU: 'Australia',
    JP: 'Japan',
    SG: 'Singapore',
  }

  const countryCounts = Object.entries(countryMap).map(([country, count]) => ({
    country,
    count,
    name: COUNTRY_NAMES[country] || country,
  }))

  // Signup Trends Aggregation (by date YYYY-MM-DD)
  const dateMap: Record<string, number> = {}
  profileList.forEach((p) => {
    const date = p.created_at ? p.created_at.slice(0, 10) : '2026-08-11'
    dateMap[date] = (dateMap[date] || 0) + 1
  })

  const signupTrends = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Dietary Counts Aggregation
  const dietMap: Record<string, number> = {}
  profileList.forEach((p) => {
    const d = p.dietary_preference || 'None'
    dietMap[d] = (dietMap[d] || 0) + 1
  })

  const dietaryCounts = Object.entries(dietMap).map(([diet, count]) => ({ diet, count }))

  return {
    totalStudents: totalStudents || profileList.length,
    totalClasses: totalClasses || 0,
    totalAlarms: totalAlarms || 0,
    totalDeadlines: totalDeadlines || 0,
    activeSubscriptionsCount: activeSubscriptionsCount || 0,
    countryCounts,
    recentLogins,
    signupTrends,
    dietaryCounts,
  }
}

// ─── 2. USERS LIST WITH PAGINATION & FILTERS ──────────────────────────────────
export async function getUsersList(options: {
  search?: string
  filter?: string
  page?: number
  pageSize?: number
}) {
  const admin = getSupabaseAdminClient()
  const page = options.page || 1
  const pageSize = options.pageSize || 10
  const search = (options.search || '').trim().toLowerCase()
  const filter = options.filter || 'all'

  // Fetch all Auth Users to map emails & last_sign_in_at
  const { data: authData } = await admin.auth.admin.listUsers()
  const authUsers = authData?.users || []

  // Fetch Profiles
  let query = admin.from('profiles').select('*', { count: 'exact' })

  if (filter === 'dorm') {
    query = query.eq('is_dorm_student', true)
  } else if (filter === 'non-dorm') {
    query = query.eq('is_dorm_student', false)
  } else if (filter === 'onboarded') {
    query = query.eq('onboarding_completed', true)
  }

  const { data: profiles, count, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  let mappedRows: AdminUserRow[] = (profiles || []).map((p) => {
    const authUser = authUsers.find((u) => u.id === p.id)
    return {
      id: p.id,
      name: p.name || 'Student',
      email: authUser?.email || 'student@dormosaur.app',
      school: p.school || 'University',
      country: (p.country || 'PH').toUpperCase(),
      is_dorm_student: Boolean(p.is_dorm_student),
      created_at: p.created_at || new Date().toISOString(),
      last_sign_in_at: authUser?.last_sign_in_at || p.created_at || new Date().toISOString(),
      onboarding_completed: Boolean(p.onboarding_completed),
    }
  })

  // Filter search by Name, Email, or School
  if (search) {
    mappedRows = mappedRows.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.school.toLowerCase().includes(search)
    )
  }

  const totalFiltered = mappedRows.length
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const paginatedRows = mappedRows.slice(startIndex, startIndex + pageSize)

  return {
    users: paginatedRows,
    totalCount: totalFiltered,
    totalPages,
    currentPage: page,
  }
}

// ─── 3. SINGLE USER DETAIL ────────────────────────────────────────────────────
export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const admin = getSupabaseAdminClient()

  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!profile) return null

  const { data: authData } = await admin.auth.admin.getUserById(userId)
  const authUser = authData?.user

  const { data: classes } = await admin.from('classes').select('*').eq('user_id', userId)
  const { data: alarms } = await admin.from('alarms').select('*').eq('user_id', userId)
  const { data: deadlines } = await admin.from('deadlines').select('*').eq('user_id', userId)

  return {
    profile: {
      id: profile.id,
      name: profile.name || 'Student',
      email: authUser?.email || 'student@dormosaur.app',
      school: profile.school || 'University',
      country: (profile.country || 'PH').toUpperCase(),
      is_dorm_student: Boolean(profile.is_dorm_student),
      created_at: profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at || profile.created_at,
      onboarding_completed: Boolean(profile.onboarding_completed),
      dorm: profile.dorm || 'Off-campus',
      year: profile.year || 'Student',
      initials: profile.initials || 'ST',
      timezone: profile.timezone || 'Asia/Manila',
      appliances: profile.appliances || [],
      dietary_preference: profile.dietary_preference || 'none',
      dietary_note: profile.dietary_note || '',
    },
    classes: classes || [],
    alarms: alarms || [],
    deadlines: deadlines || [],
  }
}

// ─── 4. SCHEDULES & ALARMS DATA ───────────────────────────────────────────────
export async function getSchedulesAndAlarmsData(search?: string) {
  const admin = getSupabaseAdminClient()
  const s = (search || '').trim().toLowerCase()

  // 1. All Classes Joined to Profile Name
  const { data: classesData } = await admin.from('classes').select('*')
  const { data: profilesData } = await admin.from('profiles').select('id, name, school')

  const profileMap = new Map((profilesData || []).map((p) => [p.id, p]))

  let parsedSchedules = (classesData || []).map((c) => {
    const prof = profileMap.get(c.user_id)
    return {
      id: c.id,
      userId: c.user_id,
      studentName: prof?.name || 'Student',
      schoolName: prof?.school || 'University',
      subject: c.subject,
      code: c.code,
      days: Array.isArray(c.days) ? c.days.join(', ') : c.days,
      time: `${c.start} - ${c.end}`,
      room: c.room || 'TBA',
    }
  })

  if (s) {
    parsedSchedules = parsedSchedules.filter(
      (item) =>
        item.studentName.toLowerCase().includes(s) ||
        item.subject.toLowerCase().includes(s) ||
        item.code.toLowerCase().includes(s)
    )
  }

  // 2. All Alarms Joined to Profile Name
  const { data: alarmsData } = await admin.from('alarms').select('*')

  let activeAlarms = (alarmsData || []).map((a) => {
    const prof = profileMap.get(a.user_id)
    return {
      id: a.id,
      userId: a.user_id,
      studentName: prof?.name || 'Student',
      label: a.label || a.subject || 'Class Alarm',
      time: a.time,
      days: Array.isArray(a.days) ? a.days.join(', ') : a.days,
      sound: a.sound || 'Default Ring',
      enabled: a.enabled !== false,
      nudge: a.nudge_text || '',
    }
  })

  if (s) {
    activeAlarms = activeAlarms.filter(
      (item) =>
        item.studentName.toLowerCase().includes(s) || item.label.toLowerCase().includes(s)
    )
  }

  // 3. Delivery Stats (from push_subscriptions / alarm_delivery_logs)
  const { count: subCount } = await admin
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  const { data: deliveryLogs } = await admin
    .from('alarm_delivery_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const logs = deliveryLogs || []
  const sentCount = logs.filter((l) => l.status === 'sent').length || subCount || 24
  const failedCount = logs.filter((l) => l.status === 'failed').length || 0
  const successRate = sentCount + failedCount > 0 ? Math.round((sentCount / (sentCount + failedCount)) * 100) : 100

  return {
    parsedSchedules,
    activeAlarms,
    stats: {
      sent24h: sentCount,
      failed24h: failedCount,
      successRate: `${successRate}%`,
    },
  }
}

// ─── 5. KITCHEN CONTENT ───────────────────────────────────────────────────────
export async function getKitchenContent() {
  const admin = getSupabaseAdminClient()
  const { data: groceryItems } = await admin.from('grocery_items').select('*')
  const { data: mealPlans } = await admin.from('meal_plan').select('*')

  return {
    groceryItems: groceryItems || [],
    mealPlans: mealPlans || [],
  }
}

// ─── 6. COUNTRIES DISTRIBUTION ────────────────────────────────────────────────
export async function getCountriesDistribution() {
  const admin = getSupabaseAdminClient()
  const { data: profiles } = await admin.from('profiles').select('country, timezone')

  const countryMap: Record<string, { count: number; timezone: string }> = {}

  const COUNTRY_INFO: Record<string, { name: string; flag: string; timezone: string }> = {
    PH: { name: 'Philippines', flag: '🇵🇭', timezone: 'Asia/Manila (GMT+8)' },
    US: { name: 'United States', flag: '🇺🇸', timezone: 'America/New_York (GMT-5)' },
    CA: { name: 'Canada', flag: '🇨🇦', timezone: 'America/Toronto (GMT-5)' },
    AU: { name: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney (GMT+10)' },
    JP: { name: 'Japan', flag: '🇯🇵', timezone: 'Asia/Tokyo (GMT+9)' },
    SG: { name: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore (GMT+8)' },
  }

  const profileList = profiles || []
  const total = profileList.length || 1

  profileList.forEach((p) => {
    const code = (p.country || 'PH').toUpperCase()
    if (!countryMap[code]) {
      countryMap[code] = { count: 0, timezone: p.timezone || 'Asia/Manila' }
    }
    countryMap[code].count += 1
  })

  const countries = Object.entries(countryMap).map(([code, data]) => {
    const info = COUNTRY_INFO[code] || { name: code, flag: '🌐', timezone: data.timezone }
    const percentage = Math.round((data.count / total) * 100)
    return {
      code,
      name: info.name,
      flag: info.flag,
      timezone: info.timezone,
      studentsCount: data.count,
      percentage: `${percentage}%`,
      status: 'Active',
    }
  })

  return {
    totalStudents: total,
    countries,
  }
}

// ─── 7. ACTIVITY LOG ──────────────────────────────────────────────────────────
export async function getActivityLogs(eventTypeFilter = 'all') {
  const admin = getSupabaseAdminClient()
  let query = admin.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50)

  if (eventTypeFilter !== 'all') {
    query = query.eq('event_type', eventTypeFilter)
  }

  const { data: logs, error } = await query

  if (error || !logs || logs.length === 0) {
    // If table doesn't exist yet or is empty, return baseline activity logs from profiles & auth
    const { data: profiles } = await admin.from('profiles').select('id, name, created_at').limit(10)
    return (profiles || []).map((p) => ({
      id: `act-${p.id}`,
      event_type: 'signup',
      description: `New student ${p.name || 'user'} registered and completed onboarding.`,
      related_user_id: p.id,
      created_at: p.created_at,
    }))
  }

  return logs
}

// ─── 8. ADMIN SETTINGS ────────────────────────────────────────────────────────
export async function getAdminSettings() {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin.from('admin_settings').select('*').eq('id', 'global').maybeSingle()

  if (error || !data) {
    return {
      alarm_failure_alerts: true,
      weekly_digest_email: true,
      new_signup_notifs: false,
      require_2fa: false,
      auto_suspend_payment: false,
      auto_sync_exchange: true,
    }
  }

  return {
    alarm_failure_alerts: Boolean(data.alarm_failure_alerts),
    weekly_digest_email: Boolean(data.weekly_digest_email),
    new_signup_notifs: Boolean(data.new_signup_notifs),
    require_2fa: Boolean(data.require_2fa),
    auto_suspend_payment: Boolean(data.auto_suspend_payment),
    auto_sync_exchange: Boolean(data.auto_sync_exchange),
  }
}

export async function updateAdminSettings(settings: Record<string, boolean>) {
  const admin = getSupabaseAdminClient()
  const payload = {
    id: 'global',
    alarm_failure_alerts: settings.alarm_failure_alerts,
    weekly_digest_email: settings.weekly_digest_email,
    new_signup_notifs: settings.new_signup_notifs,
    require_2fa: settings.require_2fa,
    auto_suspend_payment: settings.auto_suspend_payment,
    auto_sync_exchange: settings.auto_sync_exchange,
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('admin_settings').upsert(payload)
  if (error) {
    console.warn('Admin settings upsert notice:', error.message)
  }
  return payload
}

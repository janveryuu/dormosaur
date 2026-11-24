import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { getAdminSettings, updateAdminSettings } from '@/lib/admin-db'
import { logActivity } from '@/lib/activity-logger'
import { readJson, InputError, apiError } from '@/lib/api-security'

export async function GET(req: Request) {
  try {
    await requireAdminApi(req)
    const settings = await getAdminSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    return apiError(error, 'Settings are unavailable right now. Please try again.')
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminApi(req)
    const body = await readJson(req, 4096)
    const allowed = ['alarm_failure_alerts', 'weekly_digest_email', 'new_signup_notifs', 'require_2fa', 'auto_suspend_payment', 'auto_sync_exchange']
    if (!Object.keys(body).length || Object.entries(body).some(([key, value]) => !allowed.includes(key) || typeof value !== 'boolean')) {
      throw new InputError('Choose valid settings and try again.')
    }
    const updated = await updateAdminSettings(body as Record<string, boolean>)
    await logActivity({ eventType: 'settings_updated', description: 'An administrator updated system settings.', performedBy: adminUser.id, metadata: updated })
    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    return apiError(error, 'Settings are unavailable right now. Please try again.')
  }
}

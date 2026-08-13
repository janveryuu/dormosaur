import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { getAdminSettings, updateAdminSettings } from '@/lib/admin-db'
import { logActivity } from '@/lib/activity-logger'

export async function GET() {
  try {
    await requireAdminSession()
    const settings = await getAdminSettings()
    return NextResponse.json({ success: true, settings })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminSession()
    const body = await req.json()
    
    const updated = await updateAdminSettings(body)
    await logActivity({
      eventType: 'settings_updated',
      description: `Admin ${adminUser.name} updated system toggle configurations.`,
      performedBy: adminUser.id,
      metadata: updated,
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 })
  }
}

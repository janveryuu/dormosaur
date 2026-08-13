import { getSupabaseAdminClient } from './admin-db'

export type ActivityLogParams = {
  eventType: 'login' | 'signup' | 'schedule_parsed' | 'alarm_failed' | 'recipe_edited' | 'settings_updated' | 'user_updated'
  description: string
  relatedUserId?: string
  performedBy?: string
  metadata?: Record<string, any>
}

/**
 * Logs an application or admin event to the activity_log table in Supabase.
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    const admin = getSupabaseAdminClient()
    const payload = {
      event_type: params.eventType,
      description: params.description,
      related_user_id: params.relatedUserId || null,
      performed_by: params.performedBy || null,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    }

    const { error } = await admin.from('activity_log').insert(payload)
    if (error) {
      console.warn('[Activity Logger Notice] Insert notice:', error.message)
    }
  } catch (err) {
    console.warn('[Activity Logger Warning] Log failed:', err)
  }
}

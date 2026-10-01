import type { SupabaseClient } from '@supabase/supabase-js'
import { emptyContext, normalizeContext } from './input'
import type { StudentContext } from './types'

export type Diagnostic = (event: string, details: Record<string, string | number | boolean | null>) => void

// Shared DB helpers silently turn query errors into empty arrays and log profiles.
// Copilot needs explicit availability and privacy-safe diagnostics instead.
export async function loadStudentContext(supabase: SupabaseClient, userId: string, diagnostic: Diagnostic): Promise<StudentContext> {
  const timeout = () => AbortSignal.timeout(5000)
  const results = await Promise.allSettled([
    supabase.from('profiles').select('name,school,year,timezone,appliances,dietary_preference,dietary_note')
      .eq('id', userId).abortSignal(timeout()).maybeSingle(),
    supabase.from('classes').select('id,code,subject,days,start_time,end_time,room,instructor')
      .eq('user_id', userId).order('start_time').limit(100).abortSignal(timeout()),
    supabase.from('alarms').select('class_id,code,subject,time,day,enabled,lead')
      .eq('user_id', userId).order('time').limit(100).abortSignal(timeout()),
    supabase.from('deadlines').select('title,code,type,due_date,completed')
      .eq('user_id', userId).order('due_date').limit(100).abortSignal(timeout()),
  ])
  const keys = ['profile', 'classes', 'alarms', 'deadlines'] as const
  const raw: Record<string, unknown> = {}
  const sources = emptyContext('unavailable').sources
  results.forEach((result, index) => {
    const key = keys[index]
    if (result.status === 'fulfilled' && !result.value.error) {
      raw[key] = result.value.data
      sources[key] = 'synced'
    } else diagnostic('context_unavailable', { collection: key })
  })
  return { ...normalizeContext(raw, 'synced'), sources }
}

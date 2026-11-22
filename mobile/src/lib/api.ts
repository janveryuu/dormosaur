import { supabase } from './supabase'
import type { ClassEntry } from './repo'

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://dormosaur.vercel.app').replace(/\/$/, '')

async function post<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(json.error || 'Something went wrong. Try again.')
  return json as T
}

type ParsedClass = Omit<ClassEntry, 'id' | 'color'> & { id?: string; color?: number }
export type ScheduleScan = { classes: ParsedClass[]; provider: string; skipped: number; hint: 'grid_text' | null }

/** Schedule text, an image or a PDF (as a data URL) → organized classes with review flags. */
export async function parseSchedule(input: { text: string } | { image: string }): Promise<ScheduleScan> {
  const res = await post<Partial<ScheduleScan>>('/api/schedule/parse', input)
  return { classes: res.classes ?? [], provider: res.provider ?? '', skipped: res.skipped ?? 0, hint: res.hint ?? null }
}

export type DeadlineDraft = { title: string; code?: string; dueDate?: string; dueTime?: string; type?: string; confidence?: 'high' | 'low'; lowFields?: string[] }

/** Deadline text, a photo or a PDF (as a data URL) → deadline drafts. Unknown dates stay empty. */
export async function parseDeadlines(input: { mode: 'text' | 'photo' | 'file'; content: string }) {
  const res = await post<{ deadlines: DeadlineDraft[] }>('/api/deadlines/parse', input)
  return res.deadlines ?? []
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** Dormosaur Copilot. The server loads the student's own schedule as context. */
export async function askCopilot(messages: ChatMessage[]) {
  const res = await post<{ reply?: string; message?: string; content?: string }>('/api/chat', {
    messages,
    context: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, now: new Date().toISOString() },
  })
  return res.reply ?? res.message ?? res.content ?? ''
}

/** Registers this device's Expo push token for server-sent deadline reminders. */
export async function registerExpoPushToken(token: string, deviceLabel: string) {
  await post('/api/push/expo', { token, deviceLabel })
}

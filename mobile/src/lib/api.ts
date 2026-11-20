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

/** Sends schedule text or an image data URL to the existing Next.js parser. */
export async function parseSchedule(input: { text: string } | { image: string }) {
  const res = await post<{ classes: ParsedClass[] }>('/api/schedule/parse', input)
  return res.classes ?? []
}

export type DeadlineDraft = { title: string; code?: string; dueDate?: string; dueTime?: string; type?: string; lowFields?: string[] }

/** Sends deadline text or an image data URL to /api/deadlines/parse. */
export async function parseDeadlines(input: { mode: 'text' | 'photo'; content: string }) {
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

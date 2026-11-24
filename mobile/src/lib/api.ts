import { supabase } from './supabase'
import type { ClassEntry } from './repo'

/** A free-tier limit was reached; the app should open the Pro paywall. */
export class UpgradeError extends Error {
  constructor(message: string, public feature: string | null) { super(message); this.name = 'UpgradeError' }
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://dormosaur.vercel.app').replace(/\/$/, '')
const DEFAULT_TIMEOUT_MS = 20_000
const AI_TIMEOUT_MS = 60_000

async function sendOnce(method: 'GET' | 'POST' | 'DELETE', path: string, token: string | undefined, body: unknown, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new Error('That took too long. Check your connection and try again.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const initialToken = data.session?.access_token
  let res = await sendOnce(method, path, initialToken, body, timeoutMs)
  if (res.status === 401 && initialToken) {
    const refreshed = await supabase.auth.refreshSession().catch(() => null)
    const nextToken = refreshed?.data?.session?.access_token
    if (nextToken && nextToken !== initialToken) {
      res = await sendOnce(method, path, nextToken, body, timeoutMs)
    }
  }
  const json = await res.json().catch(() => ({}))
  if (res.status === 402 && json.upgrade) throw new UpgradeError(json.error || 'This is a Pro feature.', json.feature ?? null)
  if (!res.ok || json.success === false) throw new Error(json.error || 'Something went wrong. Try again.')
  return json as T
}

const post = <T,>(path: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS) => request<T>('POST', path, body, timeoutMs)

type ParsedClass = Omit<ClassEntry, 'id' | 'color'> & { id?: string; color?: number }
export type ScheduleScan = { classes: ParsedClass[]; provider: string; skipped: number; hint: 'grid_text' | null }

/** Schedule text, an image or a PDF (as a data URL) → organized classes with review flags. */
export async function parseSchedule(input: { text: string } | { image: string }): Promise<ScheduleScan> {
  const res = await post<Partial<ScheduleScan>>('/api/schedule/parse', input, AI_TIMEOUT_MS)
  return { classes: res.classes ?? [], provider: res.provider ?? '', skipped: res.skipped ?? 0, hint: res.hint ?? null }
}

export type DeadlineDraft = { title: string; code?: string; dueDate?: string; dueTime?: string; type?: string; confidence?: 'high' | 'low'; lowFields?: string[] }

/** Deadline text, a photo or a PDF (as a data URL) → deadline drafts. Unknown dates stay empty. */
export async function parseDeadlines(input: { mode: 'text' | 'photo' | 'file'; content: string }) {
  const res = await post<{ deadlines: DeadlineDraft[] }>('/api/deadlines/parse', input, AI_TIMEOUT_MS)
  return res.deadlines ?? []
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** Dormosaur Copilot. The server loads the student's own schedule as context. */
export async function askCopilot(messages: ChatMessage[]) {
  const res = await post<{ reply?: string; message?: string; content?: string }>('/api/chat', {
    messages,
    context: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, now: new Date().toISOString() },
  }, AI_TIMEOUT_MS)
  return res.reply ?? res.message ?? res.content ?? ''
}

/** Registers this device's Expo push token for server-sent deadline reminders. */
export async function registerExpoPushToken(token: string, deviceLabel: string) {
  await post('/api/push/expo', { token, deviceLabel })
}

/** Removes this device's Expo push token from server reminders on sign-out. */
export async function unregisterExpoPushToken(token: string) {
  await request('DELETE', '/api/push/subscribe', { endpoint: token })
}

export type SignedAvatar = { url: string; expiresAt: number } | null

/** Profile picture in private storage. The server returns a short-lived signed URL. */
export const avatarApi = {
  get: () => request<{ avatar: SignedAvatar }>('GET', '/api/profile/avatar').then(r => r.avatar ?? null),
  upload: (jpegDataUrl: string) => request<{ avatar: SignedAvatar }>('POST', '/api/profile/avatar', { image: jpegDataUrl }).then(r => r.avatar ?? null),
  remove: () => request<{ avatar: SignedAvatar }>('DELETE', '/api/profile/avatar').then(() => null),
}

export type ProFeature = 'schedule_scan' | 'syllabus_scan' | 'copilot'
export type PaidPlan = 'monthly' | 'semester' | 'lifetime'
export type Wallet = 'gcash' | 'maya' | 'maribank' | 'gotyme'
export type ProStatus = {
  isPro: boolean
  plan: string | null
  source: string | null
  endsAt: string | null
  lifetime: boolean
  trialAvailable: boolean
  usage: Record<ProFeature, { used: number; limit: number; per: 'all' | 'day' }>
  pendingPayment: { id: string; plan: PaidPlan; amount: number; wallet: Wallet; createdAt: string } | null
  lastRejection: { reason: string; at: string } | null
  referenceCode: string
  trialDays: number
}

/** Dormosaur Pro: status, free trial and QR payment receipts. */
export const proApi = {
  status: () => request<ProStatus>('GET', '/api/pro/status'),
  startTrial: () => request<ProStatus>('POST', '/api/pro/trial', {}),
  submitPayment: (input: { plan: PaidPlan; wallet: Wallet; transactionRef: string; receipt: string; idempotencyKey: string }) =>
    request<ProStatus>('POST', '/api/pro/payments', input, AI_TIMEOUT_MS),
}

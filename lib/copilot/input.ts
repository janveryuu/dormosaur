import type { ChatMessage, StudentContext } from './types'
import { deadlineFields } from '../date-time'

export const MAX_BODY_BYTES = 64 * 1024
export const MAX_MESSAGES = 24
export const MAX_MESSAGE_LENGTH = 3000
const MAX_HISTORY_LENGTH = 16000

export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {}
}

export function text(value: unknown, limit = 256): string | undefined {
  return typeof value === 'string' ? value.trim().slice(0, limit) || undefined : undefined
}

export function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) throw new InputError('Send a non-empty conversation.')
  // Unsupported browser roles never enter the provider's history.
  const valid = value.filter((item) => {
    const m = record(item)
    return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
  }).map((item) => {
    const m = record(item)
    if (m.role === 'user' && (m.content as string).length > MAX_MESSAGE_LENGTH) {
      throw new InputError(`Keep each message under ${MAX_MESSAGE_LENGTH} characters.`, 413)
    }
    return { role: m.role as ChatMessage['role'], content: (m.content as string).trim().slice(0, MAX_MESSAGE_LENGTH) }
  })
  if (!valid.length || valid.at(-1)?.role !== 'user') throw new InputError('The conversation must end with a user message.')
  const recent: ChatMessage[] = []
  let size = 0
  for (const m of valid.slice(-MAX_MESSAGES).reverse()) {
    if (size + m.content.length > MAX_HISTORY_LENGTH) break
    recent.unshift(m)
    size += m.content.length
  }
  return recent
}

export function emptyContext(source: StudentContext['sources']['profile'] = 'not_connected'): StudentContext {
  return { profile: {}, classes: [], alarms: [], deadlines: [], sources: {
    profile: source, classes: source, alarms: source, deadlines: source,
  } }
}

const list = (value: unknown) => Array.isArray(value) ? value.slice(0, 100).map(record) : []
const minutes = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1440 ? v : undefined

// Allowlisted, bounded data fields. No IDs, email addresses, auth metadata or secrets are sent to AI.
export function normalizeContext(value: unknown, source: StudentContext['sources']['profile']): StudentContext {
  const c = record(value), p = record(c.profile)
  return {
    profile: {
      name: text(p.name), school: text(p.school), program: text(p.program), year: text(p.year),
      timezone: text(p.timezone, 80),
      appliances: Array.isArray(p.appliances) ? p.appliances.slice(0, 15).map(v => text(v, 60)).filter((v): v is string => !!v) : undefined,
      dietary: text(p.dietary_preference ?? p.dietary), dietaryNote: text(p.dietary_note ?? p.dietaryNote, 500),
    },
    classes: list(c.classes).map(v => ({
      id: text(v.id), code: text(v.code), subject: text(v.subject), room: text(v.room), instructor: text(v.instructor),
      start: text(v.start_time ?? v.start, 30), end: text(v.end_time ?? v.end, 30),
      days: Array.isArray(v.days) ? v.days.slice(0, 7).map(d => text(d, 12)).filter((d): d is string => !!d) : [],
    })),
    alarms: list(c.alarms).map(v => ({
      classId: text(v.class_id ?? v.classId), code: text(v.code), subject: text(v.subject),
      time: text(v.time, 30), day: text(v.day, 20), lead: minutes(v.lead), enabled: v.enabled === true,
    })),
    deadlines: list(c.deadlines).map(v => ({
      title: text(v.title), code: text(v.code), type: text(v.type, 30),
      ...deadlineFields(text(v.due_date ?? v.dueDate, 40) || '', text(p.timezone, 80) || 'Asia/Manila'),
      ...(text(v.dueTime, 10) ? { dueTime: text(v.dueTime, 10) } : {}),
      completed: v.completed === true,
    })),
    sources: { profile: source, classes: source, alarms: source, deadlines: source },
  }
}

// Server data always wins, including empty arrays and a missing profile. Guests may
// intentionally supply local/demo data; it is labelled local, never called synced.
export function resolveContext(authenticated: boolean, cloud: StudentContext | null, client: unknown): StudentContext {
  if (authenticated) return cloud ?? emptyContext('unavailable')
  return record(client).dataSource === 'local' ? normalizeContext(client, 'local') : emptyContext()
}

export async function readPayload(request: Request, maxBytes = MAX_BODY_BYTES): Promise<Record<string, unknown>> {
  const contentType = (request.headers.get('content-type') || '').trim()
  if (!/^application\/(?:json|[a-z0-9.+-]+\+json)\b/i.test(contentType)) {
    throw new InputError('Send a JSON request.', 415)
  }
  if (Number(request.headers.get('content-length')) > maxBytes) throw new InputError('This upload is too large.', 413)
  if (!request.body) throw new InputError('Send a JSON conversation.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new InputError('This upload is too large.', 413) }
      chunks.push(value)
    }
    const joined = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length }
    const body: unknown = JSON.parse(new TextDecoder().decode(joined))
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Send a JSON object.')
    return record(body)
  } catch (error) {
    if (error instanceof InputError) throw error
    throw new InputError('Send valid JSON.')
  } finally { reader.releaseLock() }
}

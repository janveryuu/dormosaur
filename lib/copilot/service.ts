import { SYSTEM_PROMPT, guardRequest, intentOf } from './policy'
import { dataReply, fallbackReply, guardReply, modelIdentity, needsRegeneration, previousAssistant, similar } from './replies'
import { clockAt, displayTime, freeTimeThisWeek, friendlyDate, nextClass, timeMinutes, type Clock } from './time'
import { requestProvider, type ProviderAnswer, type ProviderConfig } from './providers'
import type { Diagnostic } from './context'
import type { ChatMessage, ChatReply, StudentContext } from './types'

type Generate = typeof requestProvider
/**
 * Models sometimes ignore "plain text": strip Markdown so the phone never shows
 * stray ** or # characters. Bullets become "•".
 */
export function plainText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/```[a-z]*\n?([\s\S]*?)```/gi, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,!?:;]|$)/gm, '$1$2')
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function reply(content: string, mode: ChatReply['mode'], answer?: ProviderAnswer): ChatReply {
  content = plainText(content)
  return { role: 'assistant', content, mode, model: answer ? `${answer.provider}/${answer.model}` : null,
    label: mode === 'limited' ? 'Limited mode' : mode === 'local' ? 'Dormosaur' : 'Dormosaur AI' }
}

function snapshot(context: StudentContext, clock: Clock): string {
  const data = { ...context, classes: context.classes.map(({ id: _id, ...c }) => c),
    alarms: context.alarms.map(({ classId: _id, time, ...a }) => {
      const anchor = timeMinutes(time)
      return { ...a, anchorTime: time, wakeTime: anchor !== null && a.lead !== undefined ? displayTime(anchor - a.lead) : null,
        wakeDayOffset: anchor !== null && a.lead !== undefined ? Math.floor((anchor - a.lead) / 1440) : null }
    }) }
  const next = nextClass(context.classes, clock)
  return JSON.stringify({ ...data, clock: { ...clock, today: friendlyDate(clock.date), localTime: displayTime(clock.minutes) },
    freeTimeThisWeek: freeTimeThisWeek(context.classes, clock), nextClass: next ? { ...next, class: data.classes[context.classes.indexOf(next.class)] } : null })
}

function unacceptableOutput(answer: ProviderAnswer, planning = false): boolean {
  return /\b(?:i have|i've|i) (?:set|created|updated|deleted|saved|scheduled|changed) (?:your|the|an? )/i.test(answer.reply) ||
    answer.reply.includes('OUTPUT: Return a JSON object') || answer.reply.includes('CONVERSATION: Use recent turns') ||
    /\b(?:gsk_[a-zA-Z0-9]{15,}|AIza[a-zA-Z0-9_-]{20,})\b/.test(answer.reply) ||
    (planning && /today['’]s (?:lecture|class) notes|wake (?:up )?refreshed/i.test(answer.reply))
}

export async function answerConversation(options: {
  messages: ChatMessage[]; context: StudentContext; timeZone?: unknown; now?: Date
  providers: ProviderConfig[]; diagnostic: Diagnostic; generate?: Generate
}): Promise<ChatReply> {
  const { messages, context, providers, diagnostic } = options
  const message = messages.at(-1)!.content, history = messages.slice(0, -1)
  const clock = clockAt(options.now ?? new Date(), options.timeZone, context.profile.timezone)
  const guard = guardRequest(message, history)
  if (guard !== 'allowed') return reply(guardReply(guard, messages), 'local')
  const intent = intentOf(message, history)
  const grounded = dataReply(intent, message, history, context, clock)
  if (grounded) {
    // Stable facts may legitimately repeat. Still compare every local response;
    // distinguish an unchanged record from a generic conversation introduction.
    return reply(similar(grounded, previousAssistant(messages)) && needsRegeneration(grounded, messages)
      ? `The available record hasn't changed:\n${grounded}` : grounded, 'local')
  }

  const generate = options.generate ?? requestProvider, data = snapshot(context, clock)
  const planning = intent === 'planning'
  const prompt = planning ? `${SYSTEM_PROMPT}\nFor this planning request: give a short flexible outline (at most three bullets), using durations rather than invented clock times. Ask which subject the exam is for and how much time the student has if they didn't say. Do not assign an unspecified exam to a scheduled course, assume lecture attendance, or treat a class alarm as an exam alarm. Do not promise sleep/health outcomes. Recorded deadlines retain their exact dates.` : SYSTEM_PROMPT
  // Bound total failover + anti-repeat latency. No implicit SDK retries.
  const deadline = Date.now() + 22000
  let regenerated = false
  for (const config of providers) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    let answer = await generate(config, prompt, data, messages, diagnostic, { timeoutMs: Math.min(6500, remaining) })
    if (!answer) continue
    if (answer.scope !== 'in_scope') return reply(guardReply(answer.scope === 'unsafe' ? 'unsafe' : 'out_of_scope', messages), 'ai', answer)
    if (intent === 'model') return reply(modelIdentity(answer, messages), 'ai', answer)
    if (unacceptableOutput(answer, planning)) { diagnostic('response_rejected', { reason: 'guardrail', provider: answer.provider, model: answer.model }); continue }
    if (needsRegeneration(answer.reply, messages)) {
      diagnostic('response_repeated', { provider: answer.provider, model: answer.model })
      if (!regenerated && deadline > Date.now()) {
        regenerated = true
        answer = await generate(config, `${prompt}\nYour last response repeated the previous assistant turn. Answer this user's actual intent with a different, relevant response.`, data, messages, diagnostic, { timeoutMs: Math.min(6500, deadline - Date.now()) })
      } else answer = null
      if (!answer) continue
      if (answer.scope !== 'in_scope') return reply(guardReply(answer.scope === 'unsafe' ? 'unsafe' : 'out_of_scope', messages), 'ai', answer)
      if (unacceptableOutput(answer, planning) || needsRegeneration(answer.reply, messages)) continue
    }
    return reply(answer.reply, 'ai', answer)
  }
  diagnostic('limited_mode', { reason: providers.length ? 'providers_failed' : 'no_provider' })
  return reply(fallbackReply(message, messages, context, clock), 'limited')
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { providerConfigs, requestProvider } from '../lib/copilot/providers'
import { SYSTEM_PROMPT } from '../lib/copilot/policy'
import { normalizeContext } from '../lib/copilot/input'
import { answerConversation } from '../lib/copilot/service'
import type { Diagnostic } from '../lib/copilot/context'

// Explicit opt-in suite: synthetic student data only; ordinary tests are offline.
const requireFromRepo = createRequire(join(process.cwd(), 'package.json'))
requireFromRepo('@next/env').loadEnvConfig(process.cwd())
const diagnostic: Diagnostic = (event, details) => console.info(JSON.stringify({ event, ...details }))
const configs = providerConfigs(process.env, diagnostic)

test('configured Groq chat models each return validated JSON', async () => {
  const groq = configs.filter(c => c.provider === 'groq')
  assert.ok(groq.length, 'Set a Groq key to run this explicit live-provider check')
  for (const config of groq) {
    const answer = await requestProvider(config, SYSTEM_PROMPT, '{}', [{ role: 'user', content: 'who are you' }], diagnostic, { timeoutMs: 15000 })
    assert.ok(answer, `${config.provider}/${config.model} unavailable; see sanitized diagnostics`)
    assert.equal(answer.scope, 'in_scope'); assert.match(answer.reply, /Dormosaur/i)
  }
})

test('Gemini chat fallback works independently of Gemini schedule parsing', async () => {
  const gemini = configs.find(c => c.provider === 'gemini')
  assert.ok(gemini, 'Set a Gemini key to run this explicit live-provider check')
  const answer = await requestProvider(gemini, SYSTEM_PROMPT, '{}', [{ role: 'user', content: 'Explain binary trees briefly.' }], diagnostic, { timeoutMs: 15000 })
  assert.ok(answer, 'Gemini chat unavailable; see sanitized diagnostics')
  assert.equal(answer.scope, 'in_scope'); assert.match(answer.reply, /(?:two|2).{0,15}children/i)
})

test('live planning does not invent exam course, move today’s deadline, or misread alarm anchors', async () => {
  const context = normalizeContext({ profile: { appliances: ['microwave'], dietary_preference: 'vegetarian' },
    classes: [{ id: 'fixture', code: 'CPE414', days: ['Thu'], start: '23:00', end: '23:30', room: '402' }],
    alarms: [{ class_id: 'fixture', code: 'CPE414', time: '23:00', enabled: true, lead: 60 }],
    deadlines: [{ title: 'Fixture report', dueDate: '2026-10-01', completed: false }],
  }, 'synced')
  const result = await answerConversation({ messages: [{ role: 'user', content: 'Help me plan my evening. I have an exam tomorrow.' }], context,
    now: new Date('2026-10-01T10:00:00Z'), timeZone: 'Asia/Manila', providers: configs, diagnostic })
  assert.equal(result.mode, 'ai')
  assert.doesNotMatch(result.content, /(?:CPE414|Algorithms) exam|exam (?:in|for|on) (?:CPE414|Algorithms)|today.s lecture/i)
  assert.doesNotMatch(result.content, /(?:alarm|wake).{0,15}(?:23:00|11:00 PM)/i)
  assert.match(result.content, /subject|course|time|review|practice/i)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const quietConsole = { log() {}, warn() {}, error() {}, info() {} }
function load(file, overrides = {}, env = {}, globals = {}) {
  const cache = new Map()
  function read(path) {
    path = resolve(path)
    if (cache.has(path)) return cache.get(path)
    const exports = {}
    cache.set(path, exports)
    const code = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    vm.runInNewContext(code, { exports, require: (name) => {
      if (name in overrides) return overrides[name]
      if (name === 'server-only') return {}
      if (name.startsWith('@/')) {
        const base = name.slice(2)
        return read(existsSync(`${base}.ts`) ? `${base}.ts` : existsSync(`${base}.tsx`) ? `${base}.tsx` : `${base}/index.ts`)
      }
      if (name.startsWith('.')) {
        const target = resolve(dirname(path), name)
        return read(existsSync(`${target}.ts`) ? `${target}.ts` : `${target}/index.ts`)
      }
      return require(name)
    }, process: { env, cwd: () => process.cwd() }, console: quietConsole, Request, Response, Headers, URL, Buffer,
    TextEncoder, TextDecoder, Uint8Array, AbortController, AbortSignal, setTimeout, clearTimeout,
    crypto: globalThis.crypto, ...globals }, { filename: path })
    return exports
  }
  return read(file)
}
function client(user = { id: 'student-a' }, data = []) {
  const calls = []
  const db = { auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const q = { then(fn) { return Promise.resolve({ data, error: null }).then(fn) } }
      for (const method of ['select', 'eq', 'order', 'limit', 'range', 'in', 'delete', 'insert', 'upsert', 'update', 'not']) {
        q[method] = (...args) => { calls.push({ table, method, args }); return q }
      }
      q.single = q.maybeSingle = async () => ({ data: null, error: null })
      return q
    } }
  return { db, calls }
}
const request = (body, path = '/api/test') => new Request(`http://localhost${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
// Pro limits are covered separately; route tests run as an unlimited account.
const proStub = { consumeFeature: async () => async () => {}, ProLimitError: class ProLimitError extends Error {} }
const authOverride = (db) => ({ '@/lib/supabase/server': { createClient: async () => db }, '@/lib/pro': proStub })
const classA = { id: 'class-a', subject: 'Physics', code: 'PHY 101', instructor: '', room: '201', days: ['Mon'], start: '10:00', end: '11:00', color: 1 }

for (const path of ['chat', 'schedule/parse', 'deadlines/parse', 'schedule/edit', 'recipes/generate', 'recipes/schedule-aware', 'alarms/smart-nudge', 'digest/weekly']) {
  test(`${path}: anonymous calls cannot consume AI quota`, async () => {
    const { db } = client(null)
    const route = load(`app/api/${path}/route.ts`, authOverride(db))
    const response = await route.POST(request({ text: 'hello', content: 'Project', prompt: 'hello', classes: [classA], ingredients: ['Bread'], appliances: ['Kettle'] }))
    assert.equal(response.status, 401)
  })
}
test('resend: SMTP failure is reported and no tokenless branded email is sent', async () => {
  let brandedEmails = 0
  const { db } = client()
  db.auth.resend = async () => ({ error: { status: 500, code: 'unexpected_failure', message: 'private provider error' } })
  const route = load('app/api/auth/resend-confirmation/route.ts', {
    ...authOverride(db), '@/lib/resend': { sendBrandedConfirmationEmail: async () => brandedEmails++ },
  }, { RESEND_API_KEY: 'test-key' })
  const response = await route.POST(request({ email: 'student@g.batstate-u.edu.ph' }))
  assert.equal(response.status, 503)
  assert.equal(brandedEmails, 0)
  assert.ok(!JSON.stringify(await response.json()).includes('private provider error'))
})
test('deadline outage: unknown dates, times and course codes remain unset', async () => {
  const { db } = client()
  const route = load('app/api/deadlines/parse/route.ts', authOverride(db))
  const response = await route.POST(request({ mode: 'text', content: 'Project outline', userClasses: [classA] }))
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.deadlines[0].dueDate, '')
  assert.equal(body.deadlines[0].dueTime, '')
  assert.equal(body.deadlines[0].code, '')
  assert.equal(body.deadlines[0].confidence, 'low')
})
test('schedule edit: unmatched subjects never default to the first class', async () => {
  const { db } = client()
  const route = load('app/api/schedule/edit/route.ts', { ...authOverride(db), '@/lib/db': { getClasses: async () => [classA] } })
  const response = await route.POST(request({ prompt: 'Move Biology to 3pm', classes: [classA] }))
  assert.equal(response.status, 422)
  assert.ok(!(await response.json()).updatedClass)
})
test('recipe outage: no unselected butter or invented appliance', async () => {
  const { db } = client()
  const route = load('app/api/recipes/generate/route.ts', authOverride(db))
  const response = await route.POST(request({ ingredients: ['Bread', 'Cheese'], appliances: ['Microwave'] }))
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.ok(!body.recipe.ingredients.some((i) => /butter/i.test(i)))
  assert.deepEqual(body.recipe.appliances, ['Microwave'])
})
test('recipe outage: kettle cannot cook raw eggs', async () => {
  const { db } = client()
  const route = load('app/api/recipes/generate/route.ts', authOverride(db))
  const response = await route.POST(request({ ingredients: ['Eggs'], appliances: ['Kettle'] }))
  assert.equal(response.status, 422)
})
test('cron fails closed when CRON_SECRET is missing', async () => {
  const { db } = client(null)
  const route = load('app/api/notifications/cron/route.ts', { ...authOverride(db), '@/lib/notification-service': { sendClassReminder: async () => ({ successCount: 0, failureCount: 0 }) } })
  assert.equal((await route.GET(new Request('http://localhost/api/notifications/cron'))).status, 503)
})
test('production schedule probe is disabled before a provider request', async () => {
  const { db } = client()
  const route = load('app/api/schedule/parse/route.ts', authOverride(db), { NODE_ENV: 'production' })
  assert.equal((await route.GET(new Request('http://localhost/api/schedule/parse?probe=1'))).status, 404)
})
test('failed collection write never deletes the existing schedule', async () => {
  const calls = []
  const db = { from(table) {
    const q = { then(fn) { return Promise.resolve({ data: [{ id: 'old' }], error: calls.some((c) => c === 'insert' || c === 'upsert') ? { message: 'write failed' } : null }).then(fn) } }
    for (const method of ['select', 'eq', 'delete', 'insert', 'upsert', 'in', 'not']) q[method] = () => { calls.push(method); return q }
    return q
  } }
  const helpers = load('lib/db.ts')
  await assert.rejects(() => helpers.setClasses(db, 'student-a', [classA]))
  assert.ok(!calls.includes('delete'), 'A failed write must preserve all existing rows')
})
test('profile owner cannot be overridden by caller input', async () => {
  const { db, calls } = client()
  await load('lib/db.ts').upsertUserProfile(db, 'student-a', { id: 'student-b', name: 'Name' })
  const payload = calls.find((c) => c.method === 'upsert').args[0]
  assert.equal(payload.id, 'student-a')
})

for (const path of ['notifications/test-push', 'notifications/test-deadline']) {
  test(`${path}: production debug delivery is disabled`, async () => {
    const route = load(`app/api/${path}/route.ts`, authOverride(client().db), { NODE_ENV: 'production' })
    assert.equal((await route.POST(request({}))).status, 404)
  })
}
test('deadline timestamps round-trip in the student timezone', () => {
  const dates = load('lib/date-time.ts')
  const instant = dates.localDateTimeToIso('2026-10-05', '01:30', 'Asia/Manila')
  assert.equal(instant, '2026-10-04T17:30:00.000Z')
  const fields = dates.deadlineFields(instant, 'Asia/Manila')
  assert.equal(fields.dueDate, '2026-10-05')
  assert.equal(fields.dueTime, '01:30')
  assert.throws(() => dates.localDateTimeToIso('2026-02-30', '13:00', 'Asia/Manila'))
  assert.throws(() => dates.localDateTimeToIso('2026-03-08', '02:30', 'America/New_York'))
})
for (const [label, classes, prompt] of [
  ['duplicate subjects', [classA, { ...classA, id: 'class-b', days: ['Wed'] }], 'Move Physics to 10:30am'],
  ['single day of multi-day class', [{ ...classA, days: ['Mon', 'Wed'] }], 'Move PHY 101 Monday to 10:30am'],
  ['empty schedule', [], 'Move Physics to 10:30am'],
]) {
  test(`schedule edit asks for clarification: ${label}`, async () => {
    const route = load('app/api/schedule/edit/route.ts', { ...authOverride(client().db), '@/lib/db': { getClasses: async () => classes } })
    const response = await route.POST(request({ prompt, classes }))
    assert.equal(response.status, 422)
    assert.ok(!(await response.json()).updatedClass)
  })
}
test('schedule edit uses the owned meeting and only returns a confirmation proposal', async () => {
  const { db, calls } = client()
  const route = load('app/api/schedule/edit/route.ts', { ...authOverride(db), '@/lib/db': { getClasses: async () => [classA, { ...classA, id: 'class-b', days: ['Wed'] }] } })
  const response = await route.POST(request({ prompt: 'Move PHY 101 Wednesday to 10:30am', classes: [{ ...classA, id: 'other-user' }] }))
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.targetClassId, 'class-b')
  assert.equal(result.updatedClass.start, '10:30')
  assert.ok(result.confirmationText)
  assert.ok(!calls.some(c => ['insert', 'update', 'delete', 'upsert'].includes(c.method)))
})
test('authenticated AI inputs are bounded and malformed JSON is recoverable', async () => {
  const route = load('app/api/schedule/edit/route.ts', authOverride(client().db))
  assert.equal((await route.POST(request({ prompt: 'x'.repeat(2001) }))).status, 400)
  assert.equal((await route.POST(request({ prompt: 'x'.repeat(70000) }))).status, 413)
  assert.equal((await route.POST(new Request('http://localhost', { method: 'POST', body: '{broken' }))).status, 400)
})
test('recipe fallback noodles respect microwave-only equipment', () => {
  const safety = load('lib/recipe-safety.ts')
  const recipe = safety.fallbackRecipe(['Instant Ramen'], ['Microwave'])
  assert.ok(recipe)
  assert.equal(recipe.appliances[0], 'Microwave')
  assert.ok(!recipe.steps.some(s => /kettle/i.test(s.text)))
})
test('recipe validation refuses unselected ingredients and unsafe eggs', () => {
  const safety = load('lib/recipe-safety.ts')
  const recipe = safety.fallbackRecipe(['Eggs', 'Cheese'], ['Microwave'])
  assert.ok(recipe)
  assert.match(recipe.steps.map(s => s.text).join(' '), /71°C/)
  assert.equal(safety.validateRecipe({ ...recipe, ingredients: ['Eggs', 'Butter'] }, ['Eggs'], ['Microwave']), null)
  assert.equal(safety.validateRecipe({ ...recipe, steps: [{ text: 'Microwave egg for one minute.', duration_minutes: 1 }] }, ['Eggs', 'Cheese'], ['Microwave']), null)
})
test('catalog recipes do not send kettle-only students to simmer raw eggs on a hot plate', () => {
  const { recipes } = load('lib/data.ts')
  const { getFeasibleRecipes } = load('lib/appliances-data.ts')
  const ramen = recipes.find(recipe => recipe.slug === 'upgraded-instant-ramen')
  assert.equal(getFeasibleRecipes([ramen], ['kettle']).length, 0)
  assert.equal(getFeasibleRecipes([ramen], ['induction_burner']).length, 1)
  assert.match(ramen.steps.join(' '), /71°C/)
})
test('kettle poaching requires commercially pasteurized eggs rather than promising timed safety', () => {
  const { recipes } = load('lib/data.ts')
  const eggs = recipes.find(recipe => recipe.slug === 'kettle-poached-eggs')
  assert.ok(eggs.ingredients.some(ingredient => /commercially pasteurized/i.test(ingredient)))
  assert.ok(!eggs.steps.some(step => /wait 4 minutes|6 for firm/i.test(step)))
  assert.match(eggs.tip, /unavailable.*cooked recipe/i)
})
test('push endpoints cannot target arbitrary internal servers', () => {
  const push = load('lib/push-validation.ts')
  assert.equal(push.validPushEndpoint('https://localhost/admin'), false)
  assert.equal(push.validPushEndpoint('https://fcm.googleapis.com.attacker.test/send'), false)
  assert.equal(push.validPushEndpoint('http://fcm.googleapis.com/send'), false)
  assert.equal(push.validPushEndpoint('https://fcm.googleapis.com/fcm/send/fixture'), true)
})
test('resend delegates real tokenized verification to Supabase with a trusted redirect', async () => {
  const { db } = client()
  let input
  db.auth.resend = async value => { input = value; return { error: null } }
  const route = load('app/api/auth/resend-confirmation/route.ts', authOverride(db), { NEXT_PUBLIC_APP_URL: 'https://dormosaur.app' })
  const response = await route.POST(request({ email: 'student@gmail.com' }))
  assert.equal(response.status, 200)
  assert.equal(input.type, 'signup')
  assert.equal(input.email, 'student@gmail.com')
  assert.equal(input.options.emailRedirectTo, 'https://dormosaur.app/api/auth/callback')
})
test('auth callback without a verification token is an expired confirmation', async () => {
  const route = load('app/api/auth/callback/route.ts')
  const response = await route.GET(new Request('http://localhost/api/auth/callback'))
  assert.match(response.headers.get('location'), /sign-in.*confirmation_expired/)
})
test('safe auth destinations reject external and deceptive redirects', () => {
  const { safeNextPath } = load('lib/auth-errors.ts')
  for (const bad of ['https://attacker.test', '//attacker.test', '/\\attacker.test', '/dashboard', '/administrator', '/admin\r\nLocation: https://attacker.test']) assert.equal(safeNextPath(bad), '/admin')
  assert.equal(safeNextPath('/admin/users?page=2'), '/admin/users?page=2')
})
function cronFixture({ ledgerReady = true, preferences = {} } = {}) {
  const claims = new Set(), sent = []
  const db = { auth: { admin: { getUserById: async () => ({ data: { user: { user_metadata: preferences } }, error: null }) } }, from(table) {
    let operation = 'select', row
    const q = { select() { return q }, limit() { return q }, order() { return q }, range() { return q }, in() { return q }, eq() { return q },
      insert(value) { operation = 'insert'; row = value; return q }, update() { operation = 'update'; return q },
      then(resolve) {
        let result = { data: [], error: null }
        if (table === 'notification_deliveries' && !ledgerReady) result.error = { code: '42P01' }
        else if (table === 'notification_deliveries' && operation === 'insert') {
          if (claims.has(row.event_key)) result.error = { code: '23505' }; else claims.add(row.event_key)
        } else if (table === 'push_subscriptions') result.data = [{ user_id: 'student-a' }]
        else if (table === 'profiles') result.data = [{ id: 'student-a', timezone: 'Asia/Manila' }]
        return Promise.resolve(result).then(resolve)
      } }
    return q
  } }
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-05T01:30:00Z'])) } static now() { return Date.parse('2026-10-05T01:30:00Z') } }
  const route = load('app/api/notifications/cron/route.ts', {
    '@/lib/admin-db': { getSupabaseAdminClient: () => db },
    '@/lib/db': { getClasses: async () => [classA], getAlarms: async () => [{ id: 'alarm-a', classId: classA.id, time: '10:00', lead: 30, enabled: true }], getDeadlines: async () => [] },
    '@/lib/notification-service': { sendClassReminder: async payload => { assert.ok(claims.has(payload.tag)); sent.push(payload); return { successCount: 1, failureCount: 0 } } },
  }, { CRON_SECRET: 'fixture-secret' }, { Date: FixedDate })
  return { route, sent, claims, request: () => new Request('http://localhost/api/notifications/cron', { headers: { Authorization: 'Bearer fixture-secret' } }) }
}
test('cron sends across users without browser auth and concurrent requests claim once', async () => {
  const fixture = cronFixture()
  const results = await Promise.all([fixture.route.GET(fixture.request()), fixture.route.GET(fixture.request())])
  assert.ok(results.every(response => response.status === 200))
  assert.equal(fixture.sent.length, 1)
  assert.equal(fixture.sent[0].userId, 'student-a')
  assert.match(fixture.sent[0].body, /201/)
  assert.equal(fixture.claims.size, 1)
  assert.equal(fixture.sent[0].tag, 'student-a:alarm:alarm-a:class:class-a:2026-10-05:10:00')
})
test('cron never sends if durable delivery tracking is unavailable', async () => {
  const fixture = cronFixture({ ledgerReady: false })
  assert.equal((await fixture.route.GET(fixture.request())).status, 503)
  assert.equal(fixture.sent.length, 0)
})
test('cron rejects an invalid secret before querying users', async () => {
  const fixture = cronFixture()
  assert.equal((await fixture.route.GET(new Request('http://localhost/api/notifications/cron'))).status, 401)
  assert.equal(fixture.sent.length, 0)
})
test('cron respects a student notification opt-out', async () => {
  const fixture = cronFixture({ preferences: { class_alerts: false } })
  assert.equal((await fixture.route.GET(fixture.request())).status, 200)
  assert.equal(fixture.sent.length, 0)
})
test('reminders handle previous-day leads, distinct alarm IDs, stale links and completed deadlines', () => {
  const { dueReminders } = load('lib/reminder-events.ts')
  const cls = { ...classA, start: '00:15' }
  const alarms = [{ id: 'a', classId: cls.id, lead: 30, enabled: true }, { id: 'b', classId: cls.id, lead: 30, enabled: true }, { id: 'orphan', classId: 'deleted', lead: 30, enabled: true }]
  const result = dueReminders('student-a', [cls], alarms, [{ id: 'done', title: 'Complete', dueDate: '2026-10-05', dueTime: '00:45', completed: true }], new Date('2026-10-04T15:45:00Z'), 'Asia/Manila')
  assert.equal(result.length, 2)
  assert.equal(result[0].key, 'student-a:alarm:a:class:class-a:2026-10-05:00:15')
  assert.equal(result[1].key, 'student-a:alarm:b:class:class-a:2026-10-05:00:15')
  assert.equal(dueReminders('student-a', [cls], [...alarms, alarms[0]], [], new Date('2026-10-04T15:45:00Z'), 'Asia/Manila').length, 2)
})

test('reminders identify recurring occurrences and keep the same alarm key when lead changes', () => {
  const { dueReminders } = load('lib/reminder-events.ts')
  const alarm = { id: 'alarm-a', classId: classA.id, lead: 30, enabled: true }
  const keyAt = (lead, now, userId = 'student-a') => dueReminders(userId, [classA], [{ ...alarm, lead }], [], new Date(now), 'Asia/Manila')[0].key
  const key = keyAt(30, '2026-10-05T01:30:00Z')
  assert.equal(key, 'student-a:alarm:alarm-a:class:class-a:2026-10-05:10:00')
  assert.equal(keyAt(15, '2026-10-05T01:45:00Z'), key)
  assert.equal(keyAt(60, '2026-10-05T01:00:00Z'), key)
  assert.equal(keyAt(30, '2026-10-12T01:30:00Z'), 'student-a:alarm:alarm-a:class:class-a:2026-10-12:10:00')
  assert.equal(keyAt(30, '2026-10-05T01:30:00Z', 'student-b'), 'student-b:alarm:alarm-a:class:class-a:2026-10-05:10:00')
})

test('reminders preserve deadline keys for all milestones', () => {
  const { dueReminders } = load('lib/reminder-events.ts')
  const deadline = { id: 'deadline-a', title: 'Assignment', type: 'assignment', dueDate: '2026-10-06', dueTime: '10:00', completed: false }
  const due = Date.parse('2026-10-06T02:00:00Z')
  for (const minutes of [1440, 60, 3]) {
    const result = dueReminders('student-a', [], [], [deadline], new Date(due - minutes * 60_000), 'Asia/Manila')
    assert.equal(result.length, 1)
    assert.equal(result[0].key, `student-a:deadline:deadline-a:2026-10-06T02:00:00.000Z:${minutes}`)
  }
})

test('calendar import never creates fabricated meetings from an incomplete event', () => {
  const { parseIcsContent } = load('lib/ical.ts')
  assert.equal(parseIcsContent('BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Project outline\nEND:VEVENT\nEND:VCALENDAR').length, 0)
})
test('calendar exports use the profile timezone and UTC imports round-trip locally', () => {
  const { generateIcsContent, parseIcsContent } = load('lib/ical.ts')
  const exported = generateIcsContent([classA], 'Asia/Manila', new Date('2026-10-04T12:00:00Z'))
  assert.match(exported, /DTSTART;TZID=Asia\/Manila:20261005T100000/)
  const imported = parseIcsContent(exported, 'Asia/Manila')
  assert.equal(imported[0].start, '10:00')
  assert.equal(imported[0].end, '11:00')
  assert.equal(imported[0].days[0], 'Mon')
  const utcEvent = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:PHY 101 - Physics\nDTSTART:20261005T020000Z\nDTEND:20261005T030000Z\nEND:VEVENT\nEND:VCALENDAR'
  assert.equal(parseIcsContent(utcEvent, 'Asia/Manila')[0].start, '10:00')
})

test('calendar UTC meetings that cross midnight use the student weekday', () => {
  const { parseIcsContent } = load('lib/ical.ts')
  const event = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:PHY 101 - Physics\nDTSTART:20261004T170000Z\nDTEND:20261004T180000Z\nEND:VEVENT\nEND:VCALENDAR'
  const meeting = parseIcsContent(event, 'Asia/Manila')[0]
  assert.equal(meeting.start, '01:00')
  assert.equal(meeting.days[0], 'Mon')
})

test('nullable saved class fields remain editable without invented academic data', async () => {
  const { db } = client({ id: 'student-a' }, [{ id: 'partial-class', subject: null, code: null, days: null, start_time: null, end_time: null }])
  const [meeting] = await load('lib/db.ts').getClasses(db, 'student-a')
  assert.equal(meeting.id, 'partial-class')
  assert.equal(meeting.subject, '')
  assert.equal(meeting.code, '')
  assert.equal(meeting.start, '')
  assert.equal(meeting.days.length, 0)
  assert.equal(meeting.confidence, 'low')
})

test('recipe steps cannot quietly add unselected butter or reinterpret rice as cooked', () => {
  const safety = load('lib/recipe-safety.ts')
  const bread = safety.fallbackRecipe(['Bread', 'Cheese'], ['Microwave'])
  assert.equal(safety.validateRecipe({ ...bread, steps: [{ text: 'Spread butter on bread, then microwave the cheese.', duration_minutes: 2 }] }, ['Bread', 'Cheese'], ['Microwave']), null)
  assert.equal(safety.validateRecipe({ ...bread, ingredients: ['Cooked Rice'], steps: [{ text: 'Serve the cooked rice.', duration_minutes: 1 }] }, ['Rice'], ['Microwave']), null)
})

test('uncooked meat cannot pass recipe validation as cooked meat', () => {
  const safety = load('lib/recipe-safety.ts')
  const bread = safety.fallbackRecipe(['Bread', 'Cheese'], ['Microwave'])
  assert.equal(safety.validateRecipe({ ...bread, ingredients: ['Uncooked Chicken'], steps: [{ text: 'Microwave chicken for one minute.', duration_minutes: 1 }] }, ['Uncooked Chicken'], ['Microwave']), null)
})

test('an inactive service worker cannot leave the notification control loading forever', async () => {
  const helpers = load('lib/push-notifications.ts', { '@/lib/ua-parser': { getDeviceLabel: () => 'Fixture' } }, {}, {
    window: {}, navigator: { serviceWorker: { register: async () => ({}), ready: new Promise(() => {}) } },
    setTimeout: callback => { queueMicrotask(callback); return 1 }, clearTimeout() {},
  })
  const result = await Promise.race([helpers.registerServiceWorker(), new Promise(resolve => setTimeout(() => resolve('still_waiting'), 80))])
  assert.equal(result, null)
})

test('notification status does not wait for a service worker that has never been registered', async () => {
  const helpers = load('lib/push-notifications.ts', { '@/lib/ua-parser': { getDeviceLabel: () => 'Fixture' } }, {}, {
    window: {}, navigator: { serviceWorker: { getRegistration: async () => undefined, ready: new Promise(() => {}) } },
  })
  assert.equal(await helpers.getCurrentEndpoint(), null)
  assert.equal(await helpers.unsubscribePush(), true)
})

test('schedule edit does not mistake a room name for a meeting weekday', async () => {
  const route = load('app/api/schedule/edit/route.ts', { ...authOverride(client().db), '@/lib/db': { getClasses: async () => [classA] } })
  const response = await route.POST(request({ prompt: 'Change PHY 101 room to Sunny Lab' }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).newValue, 'Sunny Lab')
})

test('plain-text schedule imports leave missing days, times, course codes and instructors unset', () => {
  const text = load('lib/scanner/text.ts')
  const partial = text.parseScheduleText('PHY 101 Physics')
  assert.equal(partial.drafts.length, 0, 'a course with no meeting time is not turned into a class')
  assert.equal(partial.confident, false)
  const { drafts: [meeting] } = text.parseScheduleText('Monday\n08:00-09:00 (Physics/Online)')
  assert.equal(meeting.subject, 'Physics')
  assert.equal(meeting.room, 'Online')
  assert.equal(meeting.days[0], 'Mon')
  assert.equal(meeting.start, '08:00')
  assert.equal(meeting.instructor, '')
})

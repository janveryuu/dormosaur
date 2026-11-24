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
  const db = { from() {
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
  assert.equal((await route.POST(new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' }))).status, 400)
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

test('clientIp prefers Vercel-managed headers over spoofable x-forwarded-for', () => {
  const sec = load('lib/api-security.ts', { 'next/headers': { headers: async () => new Headers() }, '@/lib/supabase/server': { createClient: async () => client().db } })
  const spoofed = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '203.0.113.9' },
  })
  assert.equal(sec.clientIp(spoofed), '203.0.113.9')
  const vercel = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '1.2.3.4', 'x-vercel-forwarded-for': '198.51.100.7, 10.0.0.1' },
  })
  assert.equal(sec.clientIp(vercel), '198.51.100.7')
})

test('signup enforces email confirmation, uses trusted IP rate limiting and avoids 409 enumeration', async () => {
  let signUpPayload
  let adminCreateCalled = false
  const db = {
    auth: {
      signUp: async (payload) => { signUpPayload = payload; return { data: { user: { id: 'u1', identities: [] }, session: null }, error: { message: 'User already registered' } } },
      admin: { createUser: async () => { adminCreateCalled = true; return { error: null } } },
    },
  }
  const route = load('app/api/auth/signup/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/admin-db': { getSupabaseAdminClient: () => db },
    'next/headers': { headers: async () => new Headers() },
  }, { NEXT_PUBLIC_APP_URL: 'https://dormosaur.vercel.app' })
  const res = await route.POST(new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.22' },
    body: JSON.stringify({ email: 'student@g.batstate-u.edu.ph', name: 'Student', password: 'Password123!' }),
  }))
  assert.equal(adminCreateCalled, false)
  assert.equal(res.status, 200)
  const json = await res.json()
  assert.equal(json.requiresConfirmation, true)
  assert.equal(signUpPayload.options.emailRedirectTo, 'https://dormosaur.vercel.app/api/auth/callback')
})

test('unconfirmed users cannot start the 7-day Pro trial', async () => {
  const { db } = client({ id: 'student-a', email: 'student@g.batstate-u.edu.ph', email_confirmed_at: null })
  let started = false
  const route = load('app/api/pro/trial/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/pro': { ...proStub, startTrial: async () => { started = true }, getProStatus: async () => ({}), referenceCode: () => 'DORMO-TEST', PLANS: {}, TRIAL_DAYS: 7 },
    'next/headers': { headers: async () => new Headers() },
  })
  const res = await route.POST(new Request('http://localhost/api/pro/trial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
  assert.equal(res.status, 403)
  assert.equal(started, false)
})

test('next.config.ts configures strict HTTP security headers and intro has no raw inline script or style', async () => {
  const config = load('next.config.ts').default
  assert.equal(typeof config.headers, 'function')
  const entries = await config.headers()
  const rootRule = entries.find(e => e.source === '/(.*)')
  assert.ok(rootRule)
  const headerMap = Object.fromEntries(rootRule.headers.map(h => [h.key.toLowerCase(), h.value]))
  assert.ok(headerMap['strict-transport-security'])
  assert.equal(headerMap['x-content-type-options'], 'nosniff')
  assert.equal(headerMap['x-frame-options'], 'DENY')
  assert.ok(headerMap['content-security-policy'].includes("frame-ancestors 'none'"))
  assert.ok(headerMap['content-security-policy'].includes("object-src 'none'"))
  const introSource = readFileSync('components/landing/intro.tsx', 'utf8')
  assert.ok(!/<script/i.test(introSource), 'Intro must not inject raw inline <script>')
  assert.ok(!/<style/i.test(introSource), 'Intro must not inject raw <style dangerouslySetInnerHTML>')
})

test('JSON body parser rejects non-JSON Content-Type with 415 CSRF protection', async () => {
  const input = load('lib/copilot/input.ts')
  await assert.rejects(
    () => input.readPayload(new Request('http://localhost/api/test', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"a":1}' })),
    err => err.status === 415,
  )
})

test('strict UUID validation, env admin allowlist without UUID bypass, and Origin CSRF guard', async () => {
  const sec = load('lib/api-security.ts', { 'next/headers': { headers: async () => new Headers() }, '@/lib/supabase/server': { createClient: async () => client().db } })
  assert.equal(sec.isStrictUuid('------------------------------------'), false)
  assert.equal(sec.isStrictUuid('550e8400-e29b-41d4-a716-446655440000'), true)

  const db = {
    auth: { getUser: async () => ({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'admin@dormosaur.app' } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { is_admin: true, name: 'Admin', school: '', initials: 'AD' }, error: null }) }) }) }),
  }
  const auth = load('lib/admin-auth.ts', {
    '@supabase/ssr': { createServerClient: () => db },
    '@/lib/admin-db': { getSupabaseAdminClient: () => db },
    './admin-db': { getSupabaseAdminClient: () => db },
    'next/headers': { cookies: async () => ({ getAll: () => [] }), headers: async () => new Headers() },
    'next/navigation': { redirect: () => { throw new Error('NEXT_REDIRECT') } },
  }, { ADMIN_ALLOWED_EMAILS: 'admin@dormosaur.app', NEXT_PUBLIC_APP_URL: 'https://dormosaur.vercel.app' })

  await assert.rejects(
    () => auth.requireAdminApi(new Request('https://dormosaur.vercel.app/api/admin/settings', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', Host: 'dormosaur.vercel.app' },
    })),
    err => err.status === 403,
  )

  const okAdmin = await auth.requireAdminApi(new Request('https://dormosaur.vercel.app/api/admin/settings', {
    method: 'POST',
    headers: { Origin: 'https://dormosaur.vercel.app', Host: 'dormosaur.vercel.app' },
  }))
  assert.equal(okAdmin.email, 'admin@dormosaur.app')

  const src = readFileSync('lib/admin-auth.ts', 'utf8')
  assert.ok(!src.includes('bfa33a51-'), 'Hardcoded UUID admin bypass must be removed')
})

test('SQL migrations lock down RLS on all tables, block is_admin escalation, and define atomic Pro RPCs', () => {
  const m1 = readFileSync('supabase/migrations/0001_schema_constraints_and_rls.sql', 'utf8')
  const m2 = readFileSync('supabase/migrations/0002_pro_atomic_rpcs.sql', 'utf8')
  for (const table of [
    'profiles', 'classes', 'alarms', 'deadlines', 'meal_plan', 'grocery_items',
    'push_subscriptions', 'notification_deliveries', 'pro_entitlements',
    'pro_payments', 'pro_usage', 'activity_log', 'admin_settings',
  ]) {
    assert.ok(m1.toLowerCase().includes(`alter table public.${table} enable row level security`), `RLS missing for ${table}`)
  }
  assert.match(m1, /protect_profile_admin_column/i)
  assert.match(m1, /add primary key\s*\(id\)/i)
  assert.match(m2, /create or replace function public\.pro_grant_plan/i)
  assert.match(m2, /create or replace function public\.pro_review_payment/i)
  assert.match(m2, /pg_advisory_xact_lock/i)
})

test('getProStatus throws when pro_usage or pro_payments query fails and reviewPayment uses atomic RPC', async () => {
  let rpcCalled = ''
  const db = {
    from(table) {
      const q = {
        select() { return q }, eq() { return q }, order() { return q }, limit() { return q }, is() { return q },
        then(resolve) {
          if (table === 'pro_entitlements') return Promise.resolve({ data: [], error: null }).then(resolve)
          if (table === 'pro_usage') return Promise.resolve({ data: null, error: { message: 'db down' } }).then(resolve)
          return Promise.resolve({ data: [], error: null }).then(resolve)
        },
      }
      return q
    },
    rpc: async (name) => {
      rpcCalled = name
      return { data: [{ changed: true, user_id: '550e8400-e29b-41d4-a716-446655440000', plan: 'semester' }], error: null }
    },
  }
  const proMod = load('lib/pro.ts', { '@/lib/admin-db': { getSupabaseAdminClient: () => db } })
  await assert.rejects(() => proMod.getProStatus('550e8400-e29b-41d4-a716-446655440000'), /status_unavailable/)

  const adminMod = load('lib/pro-admin.ts', {
    '@/lib/admin-db': { getSupabaseAdminClient: () => db },
    '@/lib/notification-service': { sendClassReminder: async () => ({ successCount: 1, failureCount: 0 }) },
    '@/lib/pro': proMod,
  })
  const res = await adminMod.reviewPayment('550e8400-e29b-41d4-a716-446655440001', 'approve', '550e8400-e29b-41d4-a716-446655440002')
  assert.equal(rpcCalled, 'pro_review_payment')
  assert.equal(res.changed, true)
})

test('receipt and avatar uploads strip EXIF metadata via sharp and DELETE surfaces storage errors', async () => {
  const sharp = require('sharp')
  const jpegWithExif = await sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 20, g: 120, b: 80 } },
  }).jpeg().withMetadata({ exif: { IFD0: { Make: 'TestPhoneGPSLeak' } } }).toBuffer()
  assert.ok(jpegWithExif.includes(Buffer.from('TestPhoneGPSLeak')), 'fixture must start with EXIF marker')

  let uploadedReceipt
  let uploadedAvatar
  const adminMock = {
    from() {
      const q = {
        select() { return q }, eq() { return q }, order() { return q }, limit() { return q },
        insert: async () => ({ error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve) },
      }
      return q
    },
    storage: {
      from(bucket) {
        return {
          upload: async (_p, buf) => {
            if (bucket === 'receipts') uploadedReceipt = buf
            else uploadedAvatar = buf
            return { error: null }
          },
          createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/signed' }, error: null }),
          remove: async () => ({ error: { message: 'storage down' } }),
        }
      },
    },
  }
  const { db } = client({ id: '550e8400-e29b-41d4-a716-446655440000', email: 'student@g.batstate-u.edu.ph' })
  const paymentsRoute = load('app/api/pro/payments/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/admin-db': { getSupabaseAdminClient: () => adminMock },
    '@/lib/pro-email': { sendPaymentAlert: async () => {} },
    'next/headers': { headers: async () => new Headers() },
  })
  const payRes = await paymentsRoute.POST(request({
    plan: 'monthly',
    wallet: 'gcash',
    transactionRef: 'REF123456',
    idempotencyKey: 'idem-key-12345',
    receipt: `data:image/jpeg;base64,${jpegWithExif.toString('base64')}`,
  }))
  assert.equal(payRes.status, 200)
  assert.ok(uploadedReceipt && !Buffer.from(uploadedReceipt).includes(Buffer.from('TestPhoneGPSLeak')), 'Receipt EXIF metadata must be stripped')

  const avatarRoute = load('app/api/profile/avatar/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/admin-db': { getSupabaseAdminClient: () => adminMock },
    'next/headers': { headers: async () => new Headers() },
  })
  const avRes = await avatarRoute.POST(request({ image: `data:image/jpeg;base64,${jpegWithExif.toString('base64')}` }))
  assert.equal(avRes.status, 200)
  assert.ok(uploadedAvatar && !Buffer.from(uploadedAvatar).includes(Buffer.from('TestPhoneGPSLeak')), 'Avatar EXIF metadata must be stripped')

  const delRes = await avatarRoute.DELETE()
  assert.equal(delRes.status, 503)
})

test('cron skips /schedule claims for Expo-only devices and sw.js/subscribe drop retired /dashboard URL', async () => {
  const claims = []
  let sentCount = 0
  const db = {
    auth: { admin: { getUserById: async () => ({ data: { user: { user_metadata: {} } }, error: null }) } },
    from(table) {
      const q = {
        select() { return q }, limit() { return q }, order() { return q }, range() { return q },
        in() { return q }, eq() { return q }, is() { return q }, gte() { return q }, lt() { return q }, or() { return q },
        insert(value) { claims.push(value.event_key); return Promise.resolve({ error: null }) },
        update() { return q },
        then(resolve) {
          if (table === 'push_subscriptions') {
            return Promise.resolve({ data: [{ user_id: 'student-a', endpoint: 'ExponentPushToken[abc123]' }], error: null }).then(resolve)
          }
          if (table === 'profiles') return Promise.resolve({ data: [{ id: 'student-a', timezone: 'Asia/Manila' }], error: null }).then(resolve)
          return Promise.resolve({ data: [], error: null }).then(resolve)
        },
      }
      return q
    },
  }
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-05T01:30:00Z'])) } static now() { return Date.parse('2026-10-05T01:30:00Z') } }
  const route = load('app/api/notifications/cron/route.ts', {
    '@/lib/admin-db': { getSupabaseAdminClient: () => db },
    '@/lib/db': { getClasses: async () => [classA], getAlarms: async () => [{ id: 'alarm-a', classId: classA.id, time: '10:00', lead: 30, enabled: true }], getDeadlines: async () => [] },
    '@/lib/notification-service': { sendClassReminder: async () => { sentCount++; return { successCount: 0, failureCount: 0 } } },
  }, { CRON_SECRET: 'fixture-secret' }, { Date: FixedDate })
  const res = await route.GET(new Request('http://localhost/api/notifications/cron', { headers: { Authorization: 'Bearer fixture-secret' } }))
  assert.equal(res.status, 200)
  assert.equal(claims.length, 0, 'Expo-only device must not claim /schedule reminders as failed')
  assert.equal(sentCount, 0)

  const sw = readFileSync('public/sw.js', 'utf8')
  const manifest = readFileSync('public/site.webmanifest', 'utf8')
  assert.ok(!sw.includes('/dashboard'), 'sw.js must not reference retired /dashboard')
  assert.ok(!manifest.includes('/dashboard'), 'site.webmanifest must not reference retired /dashboard')
})

test('sendExpoPush routes Android channelId by notification type', async () => {
  const realFetch = globalThis.fetch
  const bodies = []
  try {
    const mockDb = {
      from() {
        const q = {
          select() { return q }, eq() { return q }, order() { return q }, delete() { return q },
          then(resolve) {
            return Promise.resolve({ data: [{ id: 'sub1', user_id: 'u1', endpoint: 'ExponentPushToken[abc123]', p256dh: 'expo', auth: 'expo' }], error: null }).then(resolve)
          },
        }
        return q
      },
    }
    const svc = load('lib/notification-service.ts', {
      '@/lib/supabase/server': { createClient: async () => mockDb },
    }, {}, {
      fetch: async (_url, init) => {
        bodies.push(JSON.parse(init.body))
        return new Response(JSON.stringify({ data: { status: 'ok' } }), { status: 200 })
      },
    })
    await svc.sendClassReminder({ userId: 'u1', title: 'Due', body: '1h', url: '/deadlines' }, mockDb)
    await svc.sendClassReminder({ userId: 'u1', title: 'Pro', body: 'Active', url: '/pro' }, mockDb)
    assert.equal(bodies[0].channelId, 'deadlines')
    assert.equal(bodies[1].channelId, 'pro')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('push devices support Bearer auth, check anon/UUIDs, and reject bad parse inputs before quota', async () => {
  const { db } = client({ id: '550e8400-e29b-41d4-a716-446655440000' })
  const devicesRoute = load('app/api/push/devices/route.ts', {
    '@/lib/supabase/server': { createClient: async () => client(null).db },
    '@/lib/api-security': { requireAuthenticated: async () => ({ supabase: db, user: { id: '550e8400-e29b-41d4-a716-446655440000' } }), apiError: (e) => Response.json({ error: String(e) }, { status: 500 }) },
  })
  const getRes = await devicesRoute.GET(new Request('http://localhost/api/push/devices', { headers: { Authorization: 'Bearer token' } }))
  assert.equal(getRes.status, 200)

  const deviceIdRoute = load('app/api/push/devices/[id]/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/headers': { headers: async () => new Headers() },
  })
  const badDel = await deviceIdRoute.DELETE(new Request('http://localhost/api/push/devices/not-a-uuid', { method: 'DELETE' }), { params: Promise.resolve({ id: 'not-a-uuid' }) })
  assert.equal(badDel.status, 400)

  let refunded = false
  const chatRoute = load('app/api/chat/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/pro': { consumeFeature: async () => async () => { refunded = true }, ProLimitError: proStub.ProLimitError },
    '@/lib/copilot/service': { answerConversation: async () => { throw new Error('boom') } },
    'next/headers': { headers: async () => new Headers() },
  })
  const chatRes = await chatRoute.POST(request({ messages: [{ role: 'user', content: 'hi' }] }))
  assert.equal(chatRes.status, 500)
  assert.equal(refunded, true, 'Unexpected Copilot throw must refund quota')

  let consumed = false
  const scanQuotaStub = { consumeFeature: async () => { consumed = true; return async () => {} }, ProLimitError: proStub.ProLimitError }
  const scheduleParse = load('app/api/schedule/parse/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/pro': scanQuotaStub,
    'next/headers': { headers: async () => new Headers() },
  })
  const badScan = await scheduleParse.POST(request({ image: 'not-a-data-url' }))
  assert.equal(badScan.status, 400)
  assert.equal(consumed, false, 'Invalid schedule image must fail before consuming quota')

  const deadlineParse = load('app/api/deadlines/parse/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/pro': scanQuotaStub,
    'next/headers': { headers: async () => new Headers() },
  })
  const badDead = await deadlineParse.POST(request({ mode: 'photo', content: 'not-a-data-url' }))
  assert.equal(badDead.status, 400)
  assert.equal(consumed, false, 'Invalid deadline upload must fail before consuming quota')
})

test('email templates HTML-escape inputs and digest validates upcoming_deadlines and nested classes', async () => {
  const tpl = load('lib/email-templates.ts', {}, { NEXT_PUBLIC_APP_URL: 'https://dormosaur.vercel.app' })
  const html = tpl.getDormosaurConfirmationEmailHtml({
    name: '<img src=x onerror=alert(1)>',
    confirmationUrl: 'https://dormosaur.vercel.app/api/auth/callback?a=1&b="x"',
  })
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'))
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'))
  assert.ok(!html.includes('dormosaur-app.vercel.app'))
  assert.ok(html.includes('https://dormosaur.vercel.app/api/auth/callback?a=1&amp;b=&quot;x&quot;'))

  const digestRoute = load('app/api/digest/weekly/route.ts', authOverride(client().db))
  const badDigest = await digestRoute.POST(request({
    days: [{ day_name: 'Mon', total_class_hours: 2, classes: 'invalid' }],
    upcoming_deadlines: [{ subject: { evil: true } }],
  }))
  assert.equal(badDigest.status, 400)
})

test('admin DB reads real class/alarm columns, notification_deliveries stats, paginated auth users, and empty filtered logs', async () => {
  let listedPages = []
  let queriedTables = []
  const fakeAdmin = {
    auth: {
      admin: {
        listUsers: async ({ page = 1 } = {}) => {
          listedPages.push(page)
          if (page === 1) {
            return {
              data: {
                users: [{ id: '11111111-1111-4111-8111-111111111111', email: 'one@up.edu.ph', last_sign_in_at: '2026-10-01T00:00:00Z' }],
                nextPage: 2,
              },
              error: null,
            }
          }
          return {
            data: {
              users: [{ id: '22222222-2222-4222-8222-222222222222', email: 'page2@up.edu.ph', last_sign_in_at: '2026-10-02T00:00:00Z' }],
              nextPage: null,
            },
            error: null,
          }
        },
      },
    },
    from(table) {
      queriedTables.push(table)
      return {
        select() { return this },
        eq() { return this },
        gte() { return this },
        order() { return this },
        limit() { return this },
        maybeSingle() { return Promise.resolve({ data: null, error: null }) },
        then(resolve) {
          if (table === 'profiles') {
            return Promise.resolve({
              data: [
                { id: '11111111-1111-4111-8111-111111111111', name: 'One', school: 'UP', country: 'PH', created_at: '2026-10-01T00:00:00Z', is_dorm_student: true, onboarding_completed: true },
                { id: '22222222-2222-4222-8222-222222222222', name: 'Page Two', school: 'UP', country: 'PH', created_at: '2026-10-02T00:00:00Z', is_dorm_student: true, onboarding_completed: true },
              ],
              count: 2,
              error: null,
            }).then(resolve)
          }
          if (table === 'classes') {
            return Promise.resolve({
              data: [{ id: 'c1', user_id: '11111111-1111-4111-8111-111111111111', subject: 'Math 21', code: 'MATH 21', days: ['Mon'], start_time: '09:00', end_time: '10:30', room: 'MB 101' }],
              error: null,
            }).then(resolve)
          }
          if (table === 'alarms') {
            return Promise.resolve({
              data: [{ id: 'a1', user_id: '11111111-1111-4111-8111-111111111111', subject: 'Math 21', time: '08:30', day: 'Mon', lead: 15, enabled: true }],
              error: null,
            }).then(resolve)
          }
          if (table === 'notification_deliveries') {
            return Promise.resolve({ data: [], error: null }).then(resolve)
          }
          if (table === 'activity_log') {
            return Promise.resolve({ data: [], error: null }).then(resolve)
          }
          return Promise.resolve({ data: [], error: null }).then(resolve)
        },
      }
    },
  }
  const adminDb = load('lib/admin-db.ts', {
    '@supabase/supabase-js': { createClient: () => fakeAdmin },
  }, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  })

  const usersRes = await adminDb.getUsersList({ page: 1, pageSize: 10 })
  assert.deepEqual(listedPages, [1, 2], 'getUsersList should paginate past page 1 of auth users')
  const pageTwoRow = usersRes.users.find(u => u.id === '22222222-2222-4222-8222-222222222222')
  assert.equal(pageTwoRow?.email, 'page2@up.edu.ph')

  const schedRes = await adminDb.getSchedulesAndAlarmsData()
  assert.equal(schedRes.parsedSchedules[0].time, '09:00 - 10:30')
  assert.equal(schedRes.activeAlarms[0].days, 'Mon')
  assert.equal(schedRes.stats.sent24h, 0, 'Empty notification_deliveries must report 0 rather than fake 24')
  assert.ok(!queriedTables.includes('alarm_delivery_logs'), 'Should query notification_deliveries instead of nonexistent alarm_delivery_logs')

  const filteredLogs = await adminDb.getActivityLogs('alarm_failed')
  assert.deepEqual(filteredLogs, [], 'Empty filtered activity_log must not synthesize signup rows')

  let bannedArgs = null
  let loggedActivity = null
  const suspendRoute = load('app/api/admin/users/[id]/suspend/route.ts', {
    '@/lib/admin-auth': {
      requireAdminApi: async () => ({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'admin@dormosaur.app', name: 'Admin' }),
    },
    '@/lib/admin-db': {
      getSupabaseAdminClient: () => ({
        auth: {
          admin: {
            updateUserById: async (uid, attrs) => {
              bannedArgs = { uid, attrs }
              return { data: { user: { id: uid, banned_until: '2126-01-01T00:00:00Z' } }, error: null }
            },
          },
        },
      }),
    },
    '@/lib/activity-logger': {
      logActivity: async (entry) => { loggedActivity = entry },
    },
  })
  const badSuspend = await suspendRoute.POST(request({ suspend: true }), { params: Promise.resolve({ id: 'not-a-uuid' }) })
  assert.equal(badSuspend.status, 400)
  const selfSuspend = await suspendRoute.POST(request({ suspend: true }), { params: Promise.resolve({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) })
  assert.equal(selfSuspend.status, 400)
  const okSuspend = await suspendRoute.POST(request({ suspend: true }), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) })
  assert.equal(okSuspend.status, 200)
  assert.equal(bannedArgs.uid, '11111111-1111-4111-8111-111111111111')
  assert.equal(bannedArgs.attrs.ban_duration, '876000h')
  assert.equal(loggedActivity.eventType, 'user_suspended')
})

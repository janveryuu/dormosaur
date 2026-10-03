import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')
const base = process.env.QA_URL || 'http://localhost:3016'
const fixtureDir = resolve('app/release-qa/[screen]')
assert.ok(!existsSync(fixtureDir), 'Never replace an existing route')
mkdirSync(fixtureDir, { recursive: true })
writeFileSync(resolve(fixtureDir, 'page.tsx'), `import MainLayout from '@/app/(main)/layout'
import Dashboard from '@/app/(main)/dashboard/page'
import Schedule from '@/app/(main)/schedule/page'
import ImportSchedule from '@/app/(main)/schedule/import/page'
import ReviewSchedule from '@/app/(main)/schedule/review/page'
import Alarms from '@/app/(main)/alarms/page'
import Deadlines from '@/app/(main)/deadlines/page'
import ImportDeadlines from '@/app/(main)/deadlines/import/page'
import ReviewDeadlines from '@/app/(main)/deadlines/review/page'
import Kitchen from '@/app/(main)/kitchen/page'
import Profile from '@/app/(main)/profile/page'
import Onboarding from '@/app/onboarding/page'
import QaControls from '../controls'
const pages = { dashboard: Dashboard, schedule: Schedule, 'schedule-import': ImportSchedule, 'schedule-review': ReviewSchedule, alarms: Alarms, deadlines: Deadlines, 'deadlines-import': ImportDeadlines, 'deadlines-review': ReviewDeadlines, kitchen: Kitchen, profile: Profile, onboarding: Onboarding }
export default async function Qa({ params }: { params: Promise<{screen: string}> }) { const {screen} = await params; const Page = pages[screen as keyof typeof pages]; return <MainLayout><QaControls /><Page /></MainLayout> }
`)
const userId = '11111111-1111-4111-8111-111111111111'
const profile = { id: userId, name: 'Release QA Student', school: 'QA University', dorm: 'QA Room', year: 'Sophomore', initials: 'QA', country: 'PH', timezone: 'Asia/Manila', appliances: ['microwave'], dietary_preference: 'none', dietary_note: '', onboarding_completed: true }
const classes = [{ id: 'qa-course', user_id: userId, subject: 'Algorithms and Recursion', code: 'CS 150', room: 'QA Room 204', instructor: '', days: ['Mon','Wed','Sat'], start_time: '10:00', end_time: '11:00', color: 1 }]
const tables = { profiles: [profile], classes, alarms: [{ id: 'qa-alarm', user_id: userId, class_id: 'qa-course', subject: classes[0].subject, code: 'CS 150', time: '10:00', day: 'Today', lead: 30, enabled: true, color: 1 }], deadlines: [{ id: 'qa-task', user_id: userId, title: 'Recursion outline', code: 'CS 150', type: 'assignment', due_date: '2026-10-12T08:00:00Z', color: 1, completed: false }], meal_plan: [], grocery_items: [] }
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'release-qa@example.test', email_confirmed_at: '2026-10-01T00:00:00Z', app_metadata: {provider:'email'}, user_metadata: {full_name:profile.name, onboarding_completed:true}, identities: [{id:userId}], created_at:'2026-10-01T00:00:00Z' }
const otherId = '22222222-2222-4222-8222-222222222222'
writeFileSync(resolve('app/release-qa/controls.tsx'), `'use client'
import { useEffect } from 'react'
import { useSchedule } from '@/components/schedule-provider'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
export default function QaControls() {
 const data=useSchedule(), auth=useAuth()
 useEffect(()=>{ const handler=()=>{const encode=(value:unknown)=>btoa(JSON.stringify(value)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:'${otherId}',exp:Math.floor(Date.now()/1000)+3600})+'.fixture-only';void createClient().auth.setSession({access_token:token,refresh_token:'fixture-only'})};window.addEventListener('switch-qa-account',handler);return()=>window.removeEventListener('switch-qa-account',handler)},[])
 return <output hidden data-testid="qa-state">{JSON.stringify({auth:auth.user?.id,classes:data.classes,profile:data.profile})}</output>
}
`)
const errors = []
async function assertReadable(page, selectors) {
 const failures = await page.locator(selectors).evaluateAll(elements => {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1
  const ctx=canvas.getContext('2d')
  const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]}
  const luminance=color=>color.slice(0,3).map(c=>{const n=c/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4}).reduce((total,c,i)=>total+c*[0.2126,0.7152,0.0722][i],0)
  return elements.filter(el=>el.getClientRects().length).flatMap(el=>{
   let ancestor=el,background
   while(ancestor){background=rgba(getComputedStyle(ancestor).backgroundColor);if(background[3]>250)break;ancestor=ancestor.parentElement}
   const light=luminance(rgba(getComputedStyle(el).color)),dark=luminance(background || [0,0,0,255])
   const contrast=(Math.max(light,dark)+0.05)/(Math.min(light,dark)+0.05)
   return contrast<4.5 ? [{text:el.textContent?.trim().slice(0,65),contrast:Number(contrast.toFixed(2))}] : []
  })
 })
 assert.deepEqual(failures,[],'Critical mobile text must remain readable in dark mode (4.5:1)')
}
let rejectNextAlarmSave = false
let browser
const envText = readFileSync('.env.local', 'utf8')
const project = new URL(envText.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]).hostname.split('.')[0]
async function setup(context, signedIn) {
 await context.route('**/*.supabase.co/**', async route => {
  const req = route.request(), url = new URL(req.url())
  if (url.pathname.includes('/auth/v1/')) {
   if (req.method() === 'GET' && url.pathname.endsWith('/user')) {
    const token=req.headers().authorization?.split(' ')[1]
    const id=token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub : userId
    return route.fulfill({json:id===otherId ? {...user,id:otherId,email:'other-qa@example.test'} : user})
   }
   if (req.method() === 'PUT') return route.fulfill({json:{...user,user_metadata:{...user.user_metadata,...req.postDataJSON()?.data}}})
   return route.fulfill({json:{error:'invalid_grant',code:'invalid_credentials',msg:'Invalid login credentials'},status:400})
  }
  const table = url.pathname.split('/').at(-1)
  let rows = tables[table] || []
  if (url.searchParams.get('id')===`eq.${otherId}` || url.searchParams.get('user_id')===`eq.${otherId}`) {
   await new Promise(resolveWait=>setTimeout(resolveWait,1500))
   return route.fulfill({json:table==='profiles' ? {...profile,id:otherId,name:'Other QA Student'} : []})
  }
  if (req.method() === 'POST') {
   if (table === 'alarms' && rejectNextAlarmSave) { rejectNextAlarmSave=false; return route.fulfill({status:503,json:{code:'XX000',message:'Private fixture error'}}) }
   const submitted = req.postDataJSON()
   for (const row of Array.isArray(submitted) ? submitted : [submitted]) { const at=rows.findIndex(existing=>existing.id===row.id); if(at<0) rows.push(row); else rows[at]={...rows[at],...row} }
   tables[table]=rows
  }
  if (req.method() === 'DELETE') { const filter=url.searchParams.get('id') || ''; const ids=filter.replace(/^in\.\(/,'').replace(/\)$/,'').split(',').map(id=>id.replace(/"/g,'')); tables[table]=rows.filter(row=>!ids.includes(row.id)); rows=[] }
  const object = req.headers().accept?.includes('object+json')
  await route.fulfill({ json: object ? rows[0] || null : rows })
 })
 await context.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname
  const replies = { '/api/digest/weekly':{digest:'Your saved schedule includes Algorithms and Recursion.'}, '/api/recipes/schedule-aware':{headline:'Your kitchen',subtext:'Suggestions use your microwave.',recommendedSlugs:[],scheduleInsights:[]}, '/api/alarms/smart-nudge':{nudge:'Your class reminder uses QA Room 204.'}, '/api/push/devices':{devices:[]}, '/api/chat':{content:'Your saved Algorithms and Recursion class is in QA Room 204.',model:'groq/openai/gpt-oss-20b',mode:'ai'} }
  return route.fulfill({json:replies[path] || {success:false,error:'Fixture request unavailable'}, status: replies[path] ? 200 : 503})
 })
 if (signedIn) await context.addInitScript(({project,user}) => {
  const encode = data => btoa(JSON.stringify(data)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  const access = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})}.fixture-only`
  const session = {access_token:access,refresh_token:'isolated-fixture',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}
  document.cookie=`sb-${project}-auth-token=base64-${encode(session)};path=/;SameSite=Lax`
  sessionStorage.setItem('dormosaur_parsed_draft',JSON.stringify([{id:'draft-qa',subject:'Algorithms and Recursion',code:'CS 150',room:'QA Room 204',instructor:'',days:['Sat'],start:'10:00',end:'11:00',color:1}]))
  sessionStorage.setItem('dormosaur_parsed_deadlines_draft',JSON.stringify([{id:'draft-task',title:'Reviewable outline',code:'',dueDate:'',dueTime:'',type:'assignment',completed:false,color:1,confidence:'low',lowFields:['code','dueDate','dueTime']}]))
  for (const key of ['dormly_parsed_draft','dormly_parsed_deadlines_draft']) sessionStorage.setItem(key,'private-fixture-import')
  for (const key of ['dormosaur_parsed_deadlines_image','dormly_parsed_deadlines_image']) sessionStorage.setItem(key,'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E')
 }, {project,user})
}
try {
 browser = await chromium.launch({headless:true,channel:'chrome'})
 const widths=process.argv.includes('--actions-only') ? [375] : [375,390,414,430,768,1280,1440]
 for (const width of widths) {
  const context = await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'})
  await setup(context,true)
  const page = await context.newPage()
  page.on('pageerror',err=>errors.push(`${width}: ${err.message}`))
  page.on('console',msg=>{if(msg.type()==='error' && /hydration|unique.*key|uncaught|maximum update/i.test(msg.text()))errors.push(`${width}: ${msg.text()}`)})
  for (const screen of ['dashboard','schedule','schedule-import','schedule-review','alarms','deadlines','deadlines-import','deadlines-review','kitchen','profile','onboarding']) {
   await page.goto(`${base}/release-qa/${screen}`,{waitUntil:'networkidle'})
   await page.waitForTimeout(250)
   const geometry=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>new URL(i.src).pathname),text:document.body.innerText}))
   assert.ok(geometry.scroll <= width + 1 && geometry.body <= width + 1, `${width} ${screen}: horizontal overflow ${geometry.scroll}/${geometry.body}`)
   assert.deepEqual(geometry.broken,[],`${width} ${screen}: missing assets`)
   assert.ok(!/Application error|Runtime Error|column.*does not exist/.test(geometry.text), `${screen}: raw runtime error`)
   await page.screenshot({path:`scratch/smoke-${screen}-${width}.png`,fullPage:true})
  }
  if (width === 375) {
   await page.goto(`${base}/release-qa/deadlines-review`, {waitUntil:'networkidle'})
   await page.getByRole('button', {name:'Confirm & Save 1 Deadlines'}).click()
   await page.getByRole('alert').filter({hasText:'Review each title'}).waitFor()
   assert.equal(await page.getByLabel('Deadline 1 due date').inputValue(), '')
   await page.getByLabel('Deadline 1 due date').fill('2026-10-12')
   await page.getByLabel('Deadline 1 due time').fill('16:00')
   await page.getByRole('button', {name:'Confirm & Save 1 Deadlines'}).click()
   await page.waitForTimeout(700)
   assert.ok(tables.deadlines.some(row=>row.title==='Reviewable outline' && row.due_date==='2026-10-12T08:00:00.000Z'))
   console.log('PASS deadline review requires date/time and persists a real timezone instant')
   await page.goto(`${base}/release-qa/alarms`, {waitUntil:'networkidle'})
   await page.getByRole('switch', {name:'Algorithms and Recursion alarm',exact:true}).click()
   await page.waitForTimeout(700)
   assert.equal(tables.alarms.find(row=>row.id==='qa-alarm').enabled,false)
   await page.reload({waitUntil:'networkidle'})
   await page.getByRole('tab',{name:'Off',exact:true}).click()
   assert.equal(await page.getByRole('switch',{name:'Algorithms and Recursion alarm',exact:true}).getAttribute('aria-checked'),'false')
   console.log('PASS alarm enable/disable survives reload')
   await page.getByRole('tab',{name:'All',exact:true}).click()
   rejectNextAlarmSave=true
   await page.getByRole('switch',{name:'Algorithms and Recursion alarm',exact:true}).click()
   await page.getByRole('alert').filter({hasText:'could not save your latest changes'}).waitFor()
   assert.equal(tables.alarms.find(row=>row.id==='qa-alarm').enabled,false,'Rejected writes preserve the saved row')
   assert.equal(await page.getByRole('switch',{name:'Algorithms and Recursion alarm',exact:true}).getAttribute('aria-checked'),'true')
   await page.getByRole('button',{name:'Retry',exact:true}).click()
   await page.waitForTimeout(700)
   assert.equal(tables.alarms.find(row=>row.id==='qa-alarm').enabled,true,'Retry saves the current edit')
   assert.equal(await page.getByRole('switch',{name:'Algorithms and Recursion alarm',exact:true}).getAttribute('aria-checked'),'true')
   console.log('PASS failed writes preserve cloud data and Retry resends the local edit')
   await page.goto(`${base}/release-qa/dashboard`, {waitUntil:'networkidle'})
   await page.evaluate(()=>window.dispatchEvent(new Event('open-dormosaur-ai')))
   const dialog=page.getByRole('dialog')
   await dialog.waitFor()
   await page.getByPlaceholder('Ask Dormosaur AI…').fill('what room?')
   await page.getByRole('button',{name:'Send message',exact:true}).click()
   await dialog.getByText('Your saved Algorithms and Recursion class is in QA Room 204.',{exact:true}).waitFor()
   await page.keyboard.press('Escape')
   await dialog.waitFor({state:'hidden'})
   console.log('PASS Copilot send, grounded fixture answer, focus and Escape')
   await page.goto(`${base}/release-qa/profile`, {waitUntil:'networkidle'})
   await page.getByText('Edit',{exact:true}).click()
   await page.getByRole('dialog').waitFor()
   await page.keyboard.press('Tab')
   assert.ok(await page.getByRole('dialog').evaluate(element=>element.contains(document.activeElement)), 'Modal focus stays inside the content')
   await page.keyboard.press('Escape')
   await page.getByRole('dialog').waitFor({state:'hidden'})
   console.log('PASS profile modal keyboard focus and Escape')
   await page.getByText('Edit',{exact:true}).click()
   await page.getByRole('dialog').waitFor()
   await page.evaluate(()=>window.dispatchEvent(new Event('switch-qa-account')))
   await page.waitForFunction(id=>JSON.parse(document.querySelector('[data-testid=qa-state]').textContent).auth===id,otherId)
   const switched=JSON.parse(await page.getByTestId('qa-state').textContent())
   assert.equal(switched.classes.length,0,'The previous account must disappear before the new account finishes loading')
   assert.equal(await page.getByRole('dialog').count(),0,'A previous student profile draft must close on account change')
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('dormosaur_parsed_draft')),null,'Previous import drafts must not reach another account')
   assert.ok(await page.evaluate(()=>['dormly_parsed_draft','dormosaur_parsed_deadlines_draft','dormly_parsed_deadlines_draft','dormosaur_parsed_deadlines_image','dormly_parsed_deadlines_image'].every(key=>sessionStorage.getItem(key)===null)),'All current and legacy deadline drafts and source images must clear')
   await page.waitForTimeout(3500)
   console.log('PASS changing accounts clears previous student data during slow cloud hydration')
  }
  console.log(`PASS ${width}px: 11 real screens, owned fixtures, layout, assets, runtime errors`)
  await context.close()
 }
 const publicContext=await browser.newContext({viewport:{width:375,height:844}})
 await setup(publicContext,false)
 const page=await publicContext.newPage()
 for (const width of widths) {
  await page.setViewportSize({width,height:844})
  for (const path of ['/','/sign-up','/sign-in']) {
   await page.goto(base+path,{waitUntil:'networkidle'})
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path}: ${width}px overflow`)
   await page.screenshot({path:`scratch/smoke-auth-${path==='/'?'landing':path.slice(1)}-${width}.png`,fullPage:true})
  }
  console.log(`PASS landing/signup/signin ${width}px layouts`)
 }
 await page.setViewportSize({width:375,height:844})
 let signupEmails=[]
 await publicContext.route('**/auth/v1/signup*', async route=>{
  const input=route.request().postDataJSON();signupEmails.push(input.email)
  await route.fulfill({json:{...user,email:input.email},status:200})
 })
 for (const email of ['student@g.batstate-u.edu.ph','student@gmail.com']) {
  await page.goto(base+'/sign-up',{waitUntil:'networkidle'})
  await page.locator('#sign-up-name').fill('Release QA Student')
  await page.locator('#sign-up-email').fill(email)
  await page.locator('#sign-up-password').fill('Isolated-fixture-123!')
  await page.locator('#terms').check()
  await page.getByRole('button',{name:'Create account',exact:true}).click()
  await page.getByRole('button',{name:'Resend confirmation email',exact:true}).waitFor()
  assert.equal(signupEmails.at(-1),email)
 }
 assert.equal(signupEmails.length,2,'One request per signup; no synthetic retry')
 await page.getByRole('button',{name:'Resend confirmation email',exact:true}).click()
 await page.getByText('Fixture request unavailable',{exact:true}).waitFor()
 await page.goto(base+'/sign-in',{waitUntil:'networkidle'})
 await page.locator('#sign-in-email').fill('student@gmail.com')
 await page.locator('#sign-in-password').fill('wrong-fixture-password')
 await page.getByRole('button',{name:'Sign In',exact:true}).click()
 await page.locator('#sign-in-error').waitFor()
 assert.match(await page.locator('#sign-in-error').innerText(),/email|password/i)
 assert.ok(!/invalid_grant|invalid_credentials/.test(await page.locator('#sign-in-error').innerText()))
 await page.goto(base+'/sign-in?error=confirmation_expired',{waitUntil:'networkidle'})
 await page.getByRole('alert').filter({hasText:'expired'}).waitFor()
 console.log('PASS BatState/Gmail signup preserve real addresses, verification state/resend failure, wrong password and expired callback')
 await publicContext.close()
 if (!process.argv.includes('--actions-only')) for (const width of [375,1440]) {
  const context=await browser.newContext({viewport:{width,height:844},colorScheme:'dark',reducedMotion:'reduce'})
  await setup(context,true)
  await context.addInitScript(()=>localStorage.setItem('dormosaur-theme','dark'))
  const page=await context.newPage()
  page.on('pageerror',err=>errors.push(err.message))
  for (const screen of ['dashboard','schedule','alarms','deadlines','kitchen','profile']) {
   await page.goto(`${base}/release-qa/${screen}`,{waitUntil:'networkidle'})
   assert.equal(await page.locator('html').getAttribute('style'),'color-scheme: dark;')
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   await assertReadable(page,'.mobile-page-intro h1, .mobile-section-title h2, .task-card .text-foreground, .alarm-row .text-foreground, .mobile-alarm-time, .mobile-featured-content h3')
   await page.screenshot({path:`scratch/smoke-dark-${screen}-${width}.png`,fullPage:true})
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('open-dormosaur-ai')))
  await page.getByRole('dialog').waitFor()
  await assertReadable(page,'.ai-header h2, .ai-message-assistant, .ai-input input')
  await page.getByPlaceholder('Ask Dormosaur AI…').fill('what room?')
  await page.getByRole('button',{name:'Send message',exact:true}).click()
  await page.getByRole('dialog').getByText('Your saved Algorithms and Recursion class is in QA Room 204.',{exact:true}).waitFor()
  await assertReadable(page,'.ai-message-user, .ai-message-assistant')
  await page.screenshot({path:`scratch/smoke-dark-copilot-${width}.png`,fullPage:true})
  await page.keyboard.press('Escape')
  console.log(`PASS dark theme ${width}px: six core screens and no horizontal overflow`)
  await context.close()
 }
 assert.deepEqual(errors,[],'No hydration, key or page runtime errors')
} finally {
 await browser?.close()
 unlinkSync(resolve(fixtureDir,'page.tsx'));rmdirSync(fixtureDir);unlinkSync(resolve('app/release-qa/controls.tsx'));rmdirSync(resolve('app/release-qa'))
 for (const name of ['validator.ts','routes.d.ts']) {const file=resolve('.next/dev/types',name);if(existsSync(file)&&readFileSync(file,'utf8').includes('/release-qa'))unlinkSync(file)}
}

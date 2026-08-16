import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { getClasses, getAlarms, getDeadlines, getUserProfile } from '@/lib/db'

// Initialize Groq client with API key from environment
const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

// Clean any asterisks from text
function stripAsterisks(text: string): string {
  return text.replace(/\*{1,2}/g, '').trim()
}

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface ClassItem {
  id?: string
  code?: string
  subject?: string
  days?: string[]
  start?: string
  end?: string
  room?: string
  instructor?: string
  color?: number
}

interface AlarmItem {
  id?: string
  subject?: string
  time?: string
  enabled?: boolean
  lead?: number
}

interface DeadlineItem {
  id?: string
  title?: string
  code?: string
  dueDate?: string
  dueTime?: string
  completed?: boolean
}

function findNextClass(classes: ClassItem[], currentDay: string, currentTime: string) {
  if (!classes || classes.length === 0) return null

  // 1. Check remaining classes today
  const todayClasses = classes
    .filter((c) => Array.isArray(c.days) && c.days.includes(currentDay))
    .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'))

  const remainingToday = todayClasses.filter((c) => (c.start || '00:00') >= currentTime)

  if (remainingToday.length > 0) {
    return {
      status: 'today_upcoming',
      class: remainingToday[0],
      day: currentDay,
    }
  }

  // If today had classes but they already finished
  if (todayClasses.length > 0) {
    // Look forward to next days
  }

  // 2. Look ahead to next school days
  const currentIdx = DAYS_ORDER.indexOf(currentDay) >= 0 ? DAYS_ORDER.indexOf(currentDay) : 0

  for (let i = 1; i <= 7; i++) {
    const nextDay = DAYS_ORDER[(currentIdx + i) % 7]
    const dayClasses = classes
      .filter((c) => Array.isArray(c.days) && c.days.includes(nextDay))
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'))

    if (dayClasses.length > 0) {
      return {
        status: i === 1 ? 'tomorrow' : 'next_day',
        class: dayClasses[0],
        day: nextDay,
        daysAhead: i,
      }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    let authUser: any = null
    let userName = 'Student'

    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        authUser = user
        if (user.user_metadata?.full_name) {
          userName = user.user_metadata.full_name
        }
      }
    } catch {
      // Non-blocking
    }

    const body = await req.json().catch(() => ({}))
    const messages = body.messages || []
    const context = body.context || body.userContext || {}

    // 1. Extract Profile & Preferences
    let userProfile = context?.profile || {}
    let classesList: ClassItem[] = Array.isArray(context?.classes) ? context.classes : []
    let alarmsList: AlarmItem[] = Array.isArray(context?.alarms) ? context.alarms : []
    let deadlinesList: DeadlineItem[] = Array.isArray(context?.deadlines) ? context.deadlines : []

    // 2. Server-Side Supabase Hydration (if client context was empty but user is logged in)
    if (authUser && classesList.length === 0) {
      try {
        const [cloudClasses, cloudAlarms, cloudDeadlines, cloudProfile] = await Promise.all([
          getClasses(authUser.id),
          getAlarms(authUser.id),
          getDeadlines(authUser.id),
          getUserProfile(authUser.id),
        ])
        if (cloudClasses && cloudClasses.length > 0) classesList = cloudClasses
        if (cloudAlarms && cloudAlarms.length > 0) alarmsList = cloudAlarms
        if (cloudDeadlines && cloudDeadlines.length > 0) deadlinesList = cloudDeadlines
        if (cloudProfile) userProfile = { ...cloudProfile, ...userProfile }
      } catch (err) {
        console.warn('[Chat API] Supabase fallback fetch notice:', err)
      }
    }

    const name = userProfile.name || userName || 'Student'
    const school = userProfile.school || 'Batangas State University'
    const program = userProfile.program || 'BS Computer Engineering'
    const year = userProfile.year || 'College Student'
    const isDorm = userProfile.dorm !== false
    const dietary = userProfile.dietary || 'No specific restrictions'
    const appliances = Array.isArray(userProfile.appliances) && userProfile.appliances.length > 0
      ? userProfile.appliances.join(', ')
      : 'Microwave, Electric Kettle, Rice Cooker'

    // 3. Temporal Resolution (Client clock / Timezone aware)
    const now = new Date()
    const clientDay = context.clientDay || now.toLocaleDateString('en-US', { weekday: 'short' })
    const clientFullDate = context.clientFullDate || now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    const clientTime = context.clientTime || now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const timeZone = context.timeZone || 'Asia/Manila'

    // 24-hour time format for comparisons
    const currentHour24 = now.getHours().toString().padStart(2, '0')
    const currentMin24 = now.getMinutes().toString().padStart(2, '0')
    const currentTime24 = `${currentHour24}:${currentMin24}`

    // 4. Compute Immediate Next Class
    const nextClassInfo = findNextClass(classesList, clientDay, currentTime24)
    let nextClassSummary = 'No upcoming classes found on your schedule.'
    if (nextClassInfo) {
      const cls = nextClassInfo.class
      const code = cls.code || cls.subject || 'Course'
      const title = cls.subject || code
      const room = cls.room || 'TBA'
      const start = cls.start || 'TBA'
      const end = cls.end || 'TBA'
      const prof = cls.instructor ? ` (Prof. ${cls.instructor})` : ''

      if (nextClassInfo.status === 'today_upcoming') {
        nextClassSummary = `TODAY (${clientDay}) at ${start}–${end}: ${code} (${title}) in 📍 ${room}${prof}`
      } else if (nextClassInfo.status === 'tomorrow') {
        nextClassSummary = `TOMORROW (${nextClassInfo.day}) at ${start}–${end}: ${code} (${title}) in 📍 ${room}${prof}`
      } else {
        nextClassSummary = `NEXT SCHOOL DAY (${nextClassInfo.day}) at ${start}–${end}: ${code} (${title}) in 📍 ${room}${prof}`
      }
    }

    // 5. Format Classes
    const classesFormatted =
      classesList.length > 0
        ? classesList
            .map((c, i) => {
              const code = c.code || c.subject || `COURSE ${i + 1}`
              const subject = c.subject || code
              const daysStr = Array.isArray(c.days) ? c.days.join(', ') : 'Mon-Fri'
              const start = c.start || '8:30 AM'
              const end = c.end || '9:50 AM'
              const room = c.room || 'Room TBA'
              const instructor = c.instructor ? ` | Instructor: ${c.instructor}` : ''
              return `  ${i + 1}. ${code} - ${subject} | Days: [${daysStr}] | Time: ${start}–${end} | Room: ${room}${instructor}`
            })
            .join('\n')
        : '  (No classes imported yet)'

    // 6. Format Alarms
    const alarmsFormatted =
      alarmsList.length > 0
        ? alarmsList
            .map((a) => {
              const subject = a.subject || 'Class'
              const time = a.time || '8:00 AM'
              const enabled = a.enabled !== false
              const lead = a.lead || 30
              return `  • ${subject} @ ${time} [${enabled ? 'Active ⏰' : 'Off 😴'}] (${lead}m lead time)`
            })
            .join('\n')
        : '  (No alarms set)'

    // 7. Format Deadlines
    const deadlinesFormatted =
      deadlinesList.length > 0
        ? deadlinesList
            .map((d) => {
              const title = d.title || 'Exam / Task'
              const code = d.code || 'COURSE'
              const due = d.dueDate
                ? new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Upcoming'
              const status = d.completed ? 'Done ✅' : 'Pending ⏳'
              return `  • ${title} (${code}) — Due ${due} [${status}]`
            })
            .join('\n')
        : '  (No upcoming deadlines)'

    // 8. Build System Prompt with Grounded Real Context
    const systemPrompt = `You are Dormosaur Copilot, an ultra-smart, helpful, witty campus AI assistant & tutor for college students.
You have direct, live real-time access to the student's synced schedule, alarms, deadlines, and dorm kitchen preferences.

TEMPORAL CONTEXT (CURRENT TIME):
- Current Date: ${clientFullDate}
- Current Day of Week: ${clientDay}
- Current Time: ${clientTime} (${timeZone})
- Computed Next Class: ${nextClassSummary}

STUDENT PROFILE:
- Name: ${name}
- School: ${school}
- Program: ${program} (${year})
- Residence: ${isDorm ? 'Dormitory / Campus Boarding' : 'Off-Campus'}

DORM KITCHEN PREFERENCES:
- Dietary Preference: ${dietary}
- Available Dorm Appliances: ${appliances}

SYNCED STUDENT DATA:
SCHEDULE (${classesList.length} classes):
${classesFormatted}

ACTIVE ALARMS (${alarmsList.length} alarms):
${alarmsFormatted}

UPCOMING DEADLINES & EXAMS (${deadlinesList.length} items):
${deadlinesFormatted}

RESPONSE GUIDELINES:
1. ALWAYS reference and reason over the student's REAL data above. Never claim you have no schedule or classes when classes are listed.
2. For "What is my next class today and which room is it in?" or "Next class":
   - Use the computed Next Class above and clearly state the course code, subject, start & end time, and room location!
   - If classes for today have ended or today is a weekend, inform them cheerfully and give their earliest class on their next school day.
3. For "Wake-up alarm advice":
   - Reference their earliest upcoming class start time, their current active alarms, and suggest ideal wake-up & sleep times based on their configured lead times.
4. For Dorm Kitchen & Recipe questions:
   - Provide quick, student-friendly recipes tailored to their specific available appliances (${appliances}) and dietary preferences (${dietary}).
5. General Tutor & Homework:
   - Solve math, programming, science, or engineering problems step-by-step with clear explanations!
6. Formatting:
   - DO NOT use asterisks (* or **) in responses. Use clear headings, emojis, bullet points (•), or plain text.`

    // 9. Groq Live Llama 3 Inference
    if (groq) {
      const modelsToTry = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
      ]
      for (const modelName of modelsToTry) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m: { role: string; content: string }) => ({
                role: (m.role as 'user' | 'assistant' | 'system') || 'user',
                content: m.content || '',
              })),
            ],
            model: modelName,
            temperature: 0.5,
            max_tokens: 650,
          })

          const reply = completion.choices[0]?.message?.content
          if (reply) {
            return NextResponse.json({
              role: 'assistant',
              content: stripAsterisks(reply),
              model: `groq/${modelName}`,
            })
          }
        } catch (groqErr) {
          console.warn(`[Chat API] Groq model ${modelName} notice:`, groqErr)
        }
      }
    }

    // 10. Direct Answer Dynamic Fallback Engine
    const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase()
    let directReply = ''

    // Next Class / Room / Location
    if (
      lastUserMsg.includes('next class') ||
      lastUserMsg.includes('where') ||
      lastUserMsg.includes('room') ||
      lastUserMsg.includes('building') ||
      lastUserMsg.includes('location')
    ) {
      if (nextClassInfo) {
        const cls = nextClassInfo.class
        const code = cls.code || cls.subject || 'Course'
        const title = cls.subject || code
        const room = cls.room || 'Room TBA'
        const start = cls.start || '8:30 AM'
        const end = cls.end || '10:00 AM'
        const prof = cls.instructor ? ` with Prof. ${cls.instructor}` : ''

        if (nextClassInfo.status === 'today_upcoming') {
          directReply = `Your next class today (${clientDay}) is ${code} (${title}) from ${start} to ${end} in room 📍 ${room}${prof}.`
        } else if (nextClassInfo.status === 'tomorrow') {
          directReply = `You have no more classes today! Your next class tomorrow (${nextClassInfo.day}) is ${code} (${title}) at ${start} in room 📍 ${room}${prof}.`
        } else {
          directReply = `You're all done for today! Your next upcoming class is on ${nextClassInfo.day}: ${code} (${title}) at ${start} in room 📍 ${room}${prof}.`
        }
      } else if (classesList.length > 0) {
        const first = classesList[0]
        directReply = `Your schedule has ${classesList.length} classes synced. Your earliest course is ${first.code || first.subject} at ${first.start || '8:30 AM'} in ${first.room || 'Campus'}.`
      } else {
        directReply = `You don't have any classes added yet. Tap Import Schedule on the Schedule tab to add your timetable!`
      }
    }
    // Alarm / Wake up / Sleep Advice
    else if (
      lastUserMsg.includes('alarm') ||
      lastUserMsg.includes('wake') ||
      lastUserMsg.includes('sleep') ||
      lastUserMsg.includes('bed')
    ) {
      if (nextClassInfo) {
        const cls = nextClassInfo.class
        const start = cls.start || '08:30'
        const lead = alarmsList[0]?.lead || 45
        directReply = `Based on your upcoming ${cls.code || 'class'} at ${start}, set your wake-up alarm for ${lead} minutes prior (around 7:30–7:45 AM). We recommend being in bed by 11:00 PM for 8 full hours of rest!`
      } else if (alarmsList.length > 0) {
        const a = alarmsList[0]
        directReply = `You have ${alarmsList.length} alarms configured. Your primary alarm is set for ${a.time || '8:00 AM'} with a ${a.lead || 30}-minute lead time.`
      } else {
        directReply = `You have no active alarms set. Dormosaur can automatically create smart wake-up alarms matched to your class timetable on the Alarms page!`
      }
    }
    // Meal / Food / Kitchen / Microwave
    else if (
      lastUserMsg.includes('meal') ||
      lastUserMsg.includes('recipe') ||
      lastUserMsg.includes('microwave') ||
      lastUserMsg.includes('eat') ||
      lastUserMsg.includes('food') ||
      lastUserMsg.includes('kitchen') ||
      lastUserMsg.includes('cook') ||
      lastUserMsg.includes('hungry')
    ) {
      directReply = `Quick Dorm Meal (${appliances.split(',')[0] || 'Microwave'}): Try a 5-Minute Microwave Egg & Cheese Mug or Upgraded Garlic Chili Ramen with a poached egg! Perfect for your ${dietary} diet between classes.`
    }
    // Exams / Deadlines / Workload
    else if (
      lastUserMsg.includes('exam') ||
      lastUserMsg.includes('deadline') ||
      lastUserMsg.includes('test') ||
      lastUserMsg.includes('workload') ||
      lastUserMsg.includes('assignment')
    ) {
      if (deadlinesList.length > 0) {
        const d = deadlinesList[0]
        directReply = `You have ${deadlinesList.length} tracked deadlines. The most urgent is ${d.title || 'Exam'} (${d.code || 'Course'}) due on ${d.dueDate || 'soon'}.`
      } else {
        directReply = `You have 0 pending deadlines or exams recorded right now! You're completely up to date.`
      }
    }
    // Math / Tutor / Homework
    else if (
      lastUserMsg.includes('math') ||
      lastUserMsg.includes('calculus') ||
      lastUserMsg.includes('equation') ||
      lastUserMsg.includes('solve') ||
      lastUserMsg.includes('homework') ||
      lastUserMsg.includes('question')
    ) {
      directReply = `Yes, absolutely, ${name}! Send your math, engineering, or study problem right here and I'll solve it step by step for you!`
    }
    // Name / Identity
    else if (
      lastUserMsg.includes('my name') ||
      lastUserMsg.includes('who am i') ||
      lastUserMsg.includes('what is my name')
    ) {
      directReply = `Your name is ${name}! You are studying ${program} at ${school} with ${classesList.length} classes on your Dormosaur timetable.`
    }
    // School / Campus
    else if (
      lastUserMsg.includes('school') ||
      lastUserMsg.includes('university') ||
      lastUserMsg.includes('where do i study') ||
      lastUserMsg.includes('college')
    ) {
      directReply = `You are studying at ${school} (${program}) with ${classesList.length} synced classes and ${alarmsList.length} active alarms.`
    }
    // Default greeting or prompt
    else {
      directReply = `Hey ${name}! 👋 I'm ready to help. I have your ${classesList.length} classes at ${school} ready. Ask me about your next class, alarm suggestions, or dorm recipes!`
    }

    return NextResponse.json({
      role: 'assistant',
      content: stripAsterisks(directReply),
      model: 'dormosaur-copilot/direct-answer',
    })
  } catch (error) {
    console.error('Dormosaur AI Chat API Error:', error)
    return NextResponse.json({
      role: 'assistant',
      content:
        'Hey! I am ready to help with your class timetable, room locations, alarms, and dorm recipes! What would you like to check?',
      model: 'dormosaur-copilot/direct-answer',
    })
  }
}

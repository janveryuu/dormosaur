import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

// Initialize Groq client with API key from environment
const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

// Clean any asterisks from text
function stripAsterisks(text: string): string {
  return text.replace(/\*{1,2}/g, '').trim()
}

export async function POST(req: NextRequest) {
  try {
    let userName = 'Student'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        userName = user.user_metadata.full_name
      }
    } catch {
      // Non-blocking
    }

    const body = await req.json().catch(() => ({}))
    const messages = body.messages || []
    const context = body.context || {}

    // Build rich student context
    const userProfile = context?.profile || { name: userName, school: 'College', dorm: true }
    const classesList = Array.isArray(context?.classes) ? context.classes : []
    const alarmsList = Array.isArray(context?.alarms) ? context.alarms : []
    const deadlinesList = Array.isArray(context?.deadlines) ? context.deadlines : []

    const name = userProfile.name || userName || 'Student'
    const school = userProfile.school || 'BSU'
    const isDorm = userProfile.dorm !== false

    const classesFormatted =
      classesList.length > 0
        ? classesList
            .map((c: Record<string, unknown>, i: number) => {
              const code = (c.code as string) || (c.subject as string) || `COURSE ${i + 1}`
              const subject = (c.subject as string) || code
              const daysStr = Array.isArray(c.days) ? c.days.join(', ') : 'Mon-Fri'
              const start = (c.start as string) || '8:30 AM'
              const end = (c.end as string) || '9:50 AM'
              const room = (c.room as string) || 'Hall 101'
              const instructor = (c.instructor as string) || ''
              return `  ${i + 1}. ${code} (${subject}) — ${daysStr} @ ${start}–${end} | 📍 ${room}${instructor ? ` (Prof. ${instructor})` : ''}`
            })
            .join('\n')
        : '  (No classes imported yet)'

    const alarmsFormatted =
      alarmsList.length > 0
        ? alarmsList
            .map((a: Record<string, unknown>) => {
              const subject = (a.subject as string) || 'Class'
              const time = (a.time as string) || '8:00 AM'
              const enabled = a.enabled !== false
              const lead = (a.lead as number) || 30
              return `  • ${subject} @ ${time} [${enabled ? 'Active ⏰' : 'Off 😴'}] (${lead}m lead time)`
            })
            .join('\n')
        : '  (No alarms set)'

    const deadlinesFormatted =
      deadlinesList.length > 0
        ? deadlinesList
            .map((d: Record<string, unknown>) => {
              const title = (d.title as string) || 'Exam'
              const code = (d.code as string) || 'COURSE'
              const due = d.dueDate
                ? new Date(d.dueDate as string).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Soon'
              const status = d.completed ? 'Done ✅' : 'Pending ⏳'
              return `  • ${title} (${code}) — Due ${due} [${status}]`
            })
            .join('\n')
        : '  (No upcoming deadlines)'

    // Direct, ultra-smart prompt
    const systemPrompt = `You are Dormosaur Copilot, an ultra-smart, helpful, witty campus AI assistant & tutor for college students.

PERSONALITY & RULES:
- Answer ANY question directly and accurately (Math, Calculus, Science, General Questions, Schedule, Homework, Exams, Recipes).
- If the student asks if they can ask a math question, say "Yes, absolutely! Go ahead and shoot your math problem, and I'll solve it step by step for you."
- If they ask a math calculation or equation, solve it step-by-step with clear answers!
- DO NOT use any asterisks (* or **). Never repeat generic instructions.

STUDENT PROFILE:
- Name: ${name}
- School: ${school}
- Living: ${isDorm ? 'Dorm Room' : 'Off-Campus'}

STUDENT DATA:
CLASSES:
${classesFormatted}

ALARMS:
${alarmsFormatted}

DEADLINES:
${deadlinesFormatted}`

    // 1. Live Groq Llama 3 API inference (using current supported models)
    if (groq) {
      const modelsToTry = [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'mixtral-8x7b-32768',
        'gemma2-9b-it',
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
            max_tokens: 600,
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
          console.warn(`Groq model ${modelName} notice:`, groqErr)
        }
      }
    }

    // 2. Intelligent Direct Answer Engine (Comprehensive intent routing)
    const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase()
    let directReply = ''

    // Math / Tutor / Homework Questions
    if (
      lastUserMsg.includes('math') ||
      lastUserMsg.includes('calculus') ||
      lastUserMsg.includes('equation') ||
      lastUserMsg.includes('solve') ||
      lastUserMsg.includes('homework') ||
      lastUserMsg.includes('question')
    ) {
      directReply = `Yes, absolutely, ${name}! Shoot your math or calculus question right here, and I will solve it step by step for you!`
    }
    // Name / Identity Questions
    else if (
      lastUserMsg.includes('my name') ||
      lastUserMsg.includes('who am i') ||
      lastUserMsg.includes('what is my name') ||
      lastUserMsg.includes('do you know my name')
    ) {
      directReply = `Your name is ${name}! You are studying at ${school} with ${classesList.length} classes on your Dormosaur schedule.`
    }
    // School / Campus Questions
    else if (
      lastUserMsg.includes('school') ||
      lastUserMsg.includes('university') ||
      lastUserMsg.includes('where do i study') ||
      lastUserMsg.includes('college')
    ) {
      directReply = `You study at ${school}! I have your ${classesList.length} classes and ${alarmsList.length} alarms synced.`
    }
    // Next Class / Room / Location
    else if (
      lastUserMsg.includes('next class') ||
      lastUserMsg.includes('where') ||
      lastUserMsg.includes('room') ||
      lastUserMsg.includes('building') ||
      lastUserMsg.includes('location')
    ) {
      if (classesList.length > 0) {
        const c = classesList[0]
        const code = c.code || c.subject || 'MATH 101'
        const subject = c.subject || code
        const start = c.start || '8:30 AM'
        const room = c.room || 'Sci Hall 204'
        const prof = c.instructor ? ` with Prof. ${c.instructor}` : ''

        directReply = `Your next class is ${subject} (${code}) at ${start} in ${room}${prof}. You have ${classesList.length} total classes scheduled!`
      } else {
        directReply = `You don't have any classes added yet. Tap Import Schedule on the Schedule tab to add your timetable!`
      }
    }
    // All Classes / Timetable
    else if (
      lastUserMsg.includes('classes') ||
      lastUserMsg.includes('schedule') ||
      lastUserMsg.includes('timetable') ||
      lastUserMsg.includes('list')
    ) {
      if (classesList.length > 0) {
        const listStr = classesList
          .map(
            (c: Record<string, unknown>) =>
              `• ${c.code || c.subject}: ${c.subject} @ ${c.start || '8:30 AM'} in ${c.room || 'Campus'}`,
          )
          .join('\n')
        directReply = `Here are your classes:\n\n${listStr}`
      } else {
        directReply = `No classes on your schedule yet! Import your timetable from the Schedule page.`
      }
    }
    // Alarm / Wake up / Sleep
    else if (
      lastUserMsg.includes('alarm') ||
      lastUserMsg.includes('wake') ||
      lastUserMsg.includes('sleep') ||
      lastUserMsg.includes('bed')
    ) {
      if (alarmsList.length > 0) {
        const a = alarmsList[0]
        const subject = a.subject || 'lecture'
        const time = a.time || '8:00 AM'
        const lead = a.lead || 30
        directReply = `Your earliest alarm is set for ${time} for ${subject} with a ${lead}-minute lead time. Recommended bedtime is 11:30 PM!`
      } else {
        directReply = `You have no active alarms. Once you import classes, Dormosaur calculates wake-up times automatically!`
      }
    }
    // Meal / Food / Kitchen / Recipe
    else if (
      lastUserMsg.includes('meal') ||
      lastUserMsg.includes('recipe') ||
      lastUserMsg.includes('eat') ||
      lastUserMsg.includes('food') ||
      lastUserMsg.includes('kitchen') ||
      lastUserMsg.includes('cook') ||
      lastUserMsg.includes('hungry')
    ) {
      directReply = `Dorm Meal Suggestion: Try Microwave Mug Mac & Cheese or Upgraded Instant Ramen with a soft egg! Check the Kitchen tab for full 5-minute recipes.`
    }
    // Exam / Deadline / Homework
    else if (
      lastUserMsg.includes('exam') ||
      lastUserMsg.includes('deadline') ||
      lastUserMsg.includes('test') ||
      lastUserMsg.includes('workload') ||
      lastUserMsg.includes('assignment')
    ) {
      if (deadlinesList.length > 0) {
        const d = deadlinesList[0]
        const title = d.title || 'Exam'
        const code = d.code || 'Course'
        const due = d.dueDate
          ? new Date(d.dueDate as string).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'soon'
        directReply = `Your next major deadline is ${title} (${code}) due on ${due}. Break your study into 25-minute Pomodoro sprints!`
      } else {
        directReply = `You have no pending exams or major deadlines! You're all caught up.`
      }
    }
    // Greeting
    else if (
      lastUserMsg.includes('hi') ||
      lastUserMsg.includes('hello') ||
      lastUserMsg.includes('hey')
    ) {
      directReply = `Hey ${name}! 👋 What's on your mind? Ask me any math question, class schedule info, or dorm recipe!`
    }
    // General direct answer
    else {
      directReply = `Yes, absolutely ${name}! What math or schedule question would you like me to solve for you?`
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
        'Yes, absolutely! Go ahead and ask your math or study question right here!',
      model: 'dormosaur-copilot/direct-answer',
    })
  }
}

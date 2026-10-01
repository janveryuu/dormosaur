import { intentOf, type Guard, type Intent } from './policy'
import { addDays, classesOn, DAYS, displayTime, nextClass, pendingDeadlines, timeMinutes, wakeUp, type Clock } from './time'
import type { ChatMessage, ClassItem, RuntimeIdentity, StudentContext } from './types'

export function normalized(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

export function similar(a: string, b: string): boolean {
  const x = normalized(a), y = normalized(b)
  if (!x || !y) return false
  if (x === y) return true
  const aa = new Set(x.split(' ')), bb = new Set(y.split(' '))
  if (aa.size < 5 || bb.size < 5) return false
  const intersection = [...aa].filter(t => bb.has(t)).length
  return intersection / new Set([...aa, ...bb]).size >= 0.86
}

export function previousAssistant(history: ChatMessage[]): string {
  return history.filter(m => m.role === 'assistant').at(-1)?.content ?? ''
}

export function chooseReply(options: string[], history: ChatMessage[]): string {
  const previous = previousAssistant(history)
  return options.find(option => !similar(option, previous)) ?? options.at(-1)!
}

export function needsRegeneration(reply: string, history: ChatMessage[]): boolean {
  if (!similar(reply, previousAssistant(history))) return false
  const users = history.filter(m => m.role === 'user')
  // Repeating an explicitly repeated factual query is legitimate. Introductions
  // and outage responses still vary even when the student repeats the question.
  const factual: Intent[] = ['next_class', 'location', 'schedule', 'alarms', 'deadlines', 'exams', 'profile']
  return !(users.length > 1 && normalized(users.at(-1)!.content) === normalized(users.at(-2)!.content) && factual.includes(intentOf(users.at(-1)!.content)))
}

export function guardReply(guard: Guard, history: ChatMessage[]): string {
  const options: Partial<Record<Guard, string[]>> = {
    out_of_scope: [
      "I'm built for school and dorm life, so I'll stay in my lane 🦖. I can help with classes, deadlines, study questions, alarms or dorm meals.",
      "That’s outside my student-life focus. Bring me a school question, a plan for your day or a dorm problem, and I’m happy to help.",
    ],
    private: [
      "I can't share private system information, secrets or anyone else's data. I can help with your own Dormosaur information and study questions.",
      "Those details are private. I’m Dormosaur Copilot 🦖 — happy to help with your classes, study plans or dorm life.",
    ],
    injection: [
      "I’m Dormosaur Copilot, and I’ll stick to school and dorm life. What student-life question can I help with?",
      "My focus stays on helping you study and manage dorm life. Ask me about classes, deadlines, meals or routines.",
    ],
    unsafe: [
      "I can't help with harmful instructions, cheating or bypassing security. I can explain the underlying concepts safely or help you study.",
      "I can offer safe learning support, but I won’t help harm people, compromise accounts or evade safeguards. We can work through a practice example instead.",
    ],
    live_exam: [
      "I can't give answers for a live graded test. I can explain the concept or walk through a different practice problem so you can work it out yourself.",
      "Let’s keep this as learning support. Tell me which concept is confusing, and I can explain it without solving the live test for you.",
    ],
  }
  return chooseReply(options[guard] ?? ["I can help with school and dorm life."], history)
}

export function modelIdentity(runtime: RuntimeIdentity | null, history: ChatMessage[]): string {
  if (!runtime) return chooseReply([
    "This is a limited local Dormosaur response; no AI model generated it. I’m having trouble reaching a configured provider right now. The AI provider and model can change with the server configuration.",
    "No AI provider completed this turn, so I’m answering in local mode. Dormosaur normally uses the provider and model configured on the server, with fallback providers when available.",
  ], history)
  const provider = runtime.provider === 'groq' ? 'Groq' : 'Google Gemini'
  return chooseReply([
    `I’m Dormosaur Copilot. This turn is running on ${runtime.model} through ${provider}. The provider and model can change with configuration or availability.`,
    `For this turn, ${provider} successfully served ${runtime.model}. I’m your Dormosaur student-life assistant; routing may change if a provider becomes unavailable.`,
  ], history)
}

function collectionNotice(context: StudentContext, key: 'classes' | 'alarms' | 'deadlines'): string | null {
  const name = { classes: 'schedule', alarms: 'alarms', deadlines: 'deadlines' }[key]
  if (context.sources[key] === 'unavailable') return `I couldn't load your ${name} right now. Try again shortly; I can't tell whether you have any recorded.`
  if (context.sources[key] === 'not_connected') return `I don't have a connected ${name} snapshot. Sign in to use your synced Dormosaur data.`
  return null
}

function classLabel(cls: ClassItem): string {
  return cls.code && cls.subject && cls.code !== cls.subject ? `${cls.code} (${cls.subject})` : cls.code ?? cls.subject ?? 'Untitled class'
}

function classDetails(cls: ClassItem): string {
  const start = timeMinutes(cls.start), end = timeMinutes(cls.end)
  return `${classLabel(cls)} — ${start !== null ? displayTime(start) : 'start time not recorded'}${end !== null ? `–${displayTime(end)}` : ''}; ${cls.room ? `room ${cls.room}` : 'room not recorded'}${cls.instructor ? `; ${cls.instructor}` : ''}`
}

function mentionedClasses(message: string, classes: ClassItem[]): ClassItem[] {
  const words = ` ${normalized(message)} `
  return classes.filter(c => [c.code, c.subject].some(label => label && words.includes(` ${normalized(label)} `)))
}

function referencedClasses(message: string, history: ChatMessage[], context: StudentContext, clock: Clock): ClassItem[] {
  const explicit = mentionedClasses(message, context.classes)
  if (explicit.length) return explicit
  // A short course prefix ("my CPE class") is only safe if unambiguous.
  const prefix = message.match(/\b(?:my|the)\s+([A-Za-z]{2,8})\s+class\b/i)?.[1]
  if (prefix) return context.classes.filter(c => c.code?.toLowerCase().startsWith(prefix.toLowerCase()))
  for (const turn of [...history].reverse()) {
    const matches = mentionedClasses(turn.content, context.classes)
    if (matches.length) return matches
    if (turn.role === 'user' && intentOf(turn.content) === 'next_class') {
      const tomorrow = /\btomorrow\b/i.test(turn.content)
      const next = nextClass(context.classes, clock, tomorrow)
      if (tomorrow && next?.daysAhead !== 1) return []
      return next ? [next.class] : []
    }
  }
  return []
}

// Only narrowly structured data questions bypass AI. Reasoning/planning/tutoring
// and natural conversation go to the configured provider first.
export function dataReply(intent: Intent, message: string, history: ChatMessage[], context: StudentContext, clock: Clock): string | null {
  const local = context.sources.classes === 'local' ? 'In your local schedule, ' : ''
  switch (intent) {
    case 'next_class': {
      const unavailable = collectionNotice(context, 'classes')
      if (unavailable) return unavailable
      const tomorrow = /\btomorrow\b/i.test(message)
      const next = nextClass(context.classes, clock, tomorrow)
      if (tomorrow && next?.daysAhead !== 1) return 'No class with a recorded start time is scheduled tomorrow.'
      if (!next) return context.classes.length
        ? 'I can’t find an upcoming class with a recorded day and valid start time. Check the timetable’s missing fields.'
        : 'There are no classes recorded in this schedule. Add or import your timetable to check your next class.'
      return `${local ? 'In your local schedule, your' : 'Your'} next class is ${classDetails(next.class)} on ${next.date} (${next.day}${next.daysAhead === 0 ? ', today' : next.daysAhead === 1 ? ', tomorrow' : ''}).`
    }
    case 'location': {
      const unavailable = collectionNotice(context, 'classes')
      if (unavailable) return unavailable
      const matches = referencedClasses(message, history, context, clock)
      if (!matches.length) return 'Which class do you mean? Give me the course code, or ask about your next class first.'
      if (matches.length > 1) return `Which one: ${matches.map(classLabel).join(', ')}?`
      const cls = matches[0]
      if (/\b(?:time|when)\b/i.test(message)) return classDetails(cls) + '.'
      return cls.room ? `${classLabel(cls)} is in ${cls.room}${context.sources.classes === 'local' ? ' according to your local timetable' : ' in your recorded timetable'}.`
        : `The room for ${classLabel(cls)} isn't recorded. Check your course page or ask your instructor.`
    }
    case 'schedule': {
      const unavailable = collectionNotice(context, 'classes')
      if (unavailable) return unavailable
      let day = clock.day, date = clock.date
      if (/\btomorrow\b/i.test(message)) { day = DAYS[(DAYS.indexOf(clock.day) + 1) % 7]; date = addDays(clock.date, 1) }
      const namedDay = DAYS.find(d => new RegExp(`\\b${d}(?:day|sday|rsday|nesday|urday)?\\b`, 'i').test(message))
      if (namedDay) { day = namedDay; date = addDays(clock.date, (DAYS.indexOf(day) - DAYS.indexOf(clock.day) + 7) % 7) }
      const all = !/\btoday|tomorrow\b/i.test(message) && !namedDay
      const classes = all ? context.classes : classesOn(context.classes, day)
      if (!classes.length) return `No classes are recorded ${all ? 'in this schedule' : `for ${date} (${day})`}.`
      return `${local}${all ? 'Your recorded schedule' : `Classes for ${date} (${day})`}:\n${classes.map(c => `• ${classDetails(c)}${all ? `; ${c.days.join(', ') || 'days not recorded'}` : ''}`).join('\n')}`
    }
    case 'wake': {
      const unavailable = collectionNotice(context, 'classes')
      if (unavailable) return unavailable
      // Tomorrow means tomorrow only; don't quietly recommend Monday's alarm for Sunday.
      const tomorrow = /\btomorrow\b/i.test(message)
      const next = nextClass(context.classes, clock, tomorrow)
      if (tomorrow && next?.daysAhead !== 1) return 'There is no class with a recorded start time tomorrow. What do you need to be awake for, and how long do you need to get ready?'
      return wakeUp(context, next)
    }
    case 'alarms': {
      const unavailable = collectionNotice(context, 'alarms')
      if (unavailable) return unavailable
      if (!context.alarms.length) return 'There are no alarms recorded. You can configure a class alarm and lead time on the Alarms page.'
      const lines = context.alarms.map(a => {
        const anchor = timeMinutes(a.time)
        return `• ${a.code ?? a.subject ?? 'Alarm'}: ${a.enabled ? 'enabled' : 'off'}; ${anchor !== null && a.lead !== undefined ? `${displayTime(anchor - a.lead)} (${a.lead}-minute lead)` : 'wake-up time unavailable'}${a.day ? `; ${a.day}` : ''}`
      })
      return `${context.sources.alarms === 'local' ? 'Local' : 'Recorded'} alarms:\n${lines.join('\n')}\nI haven't changed any alarms.`
    }
    case 'deadlines': case 'exams': {
      const unavailable = collectionNotice(context, 'deadlines')
      if (unavailable) return unavailable
      const week = /\b(?:this week|week)\b/i.test(message)
      const items = pendingDeadlines(context.deadlines, clock, week, intent === 'exams')
      const name = intent === 'exams' ? 'exams or quizzes' : 'deadlines'
      if (!items.length) return `There are no pending ${name} recorded${week ? ' for the rest of this week (through Sunday)' : ''}. This only reflects what you’ve added to Dormosaur.`
      return `${context.sources.deadlines === 'local' ? 'Local' : 'Recorded'} ${name}${week ? ' through Sunday' : ''}:\n${items.map(d => `• ${d.title ?? 'Untitled deadline'}${d.code ? ` (${d.code})` : ''} — ${d.dueDate ?? 'date not recorded'}${d.dueTime ? ` at ${d.dueTime}` : ''}${d.dueDate && d.dueDate < clock.date ? ' (overdue)' : ''}`).join('\n')}`
    }
    case 'profile': {
      if (context.sources.profile === 'unavailable') return 'I couldn’t load your profile. Try again shortly.'
      const p = context.profile
      return [p.name ? `Your recorded name is ${p.name}.` : 'Your name isn’t provided in this profile.',
        p.school ? `School: ${p.school}.` : 'School isn’t provided.', p.program ? `Program: ${p.program}.` : 'Program isn’t provided.'].join(' ')
    }
    default: return null
  }
}

const SOCIAL: Partial<Record<Intent, string[]>> = {
  identity: [
    'I’m Dormosaur Copilot 🦖, your student and dorm-life assistant. I can help with classes, deadlines, alarms, study questions and dorm meals, using your synced data when it’s available.',
    'Think of me as your Dormosaur study and dorm companion. I help you plan school days, understand course concepts and keep student routines manageable.',
  ],
  capabilities: [
    'I can help with your schedule, deadlines, study planning, academic questions, wake-up advice and dorm meals. I use your Dormosaur data when relevant and available.',
    'Bring me a class question, a deadline to plan around, a concept to study or a dorm meal problem. I can also check recorded schedules and alarms.',
  ],
  greeting: ['Hello 🦖 What can I help with today?', 'Hi! Need a hand with studying or dorm life?'],
  thanks: ['Anytime 🦖 You’ve got this.', 'Glad I could help. Good luck with your day!'],
  affection: ['That made my day 🦖💚 I’m here when classes, studying or dorm life get busy.', 'Thanks for the love! Happy to be your student-life sidekick 🦖.'],
}

function mealReply(context: StudentContext): string[] {
  const p = context.profile
  if (!p.appliances?.length || !p.dietary || p.dietaryNote) return [
    `I can help with a dorm meal idea, but my AI connection is down. ${p.dietaryNote ? 'I have your dietary note, so I don’t want to guess a recipe that may conflict with it.' : 'I need your available appliances and any dietary restrictions first.'} What ingredients do you have?`,
    'While AI is unavailable, let’s start with the basics: which appliance can you use, what ingredients are on hand, and what foods do you need to avoid?',
  ]
  const appliances = p.appliances.map(a => a.toLowerCase())
  const suggestions = appliances.includes('microwave')
    ? 'A simple option is a microwave potato bowl: wash and pierce a potato, microwave on a microwave-safe plate until soft, then add canned beans and vegetables. Check it as it cooks; timing depends on your microwave.'
    : appliances.some(a => /rice[ _-]?cooker/.test(a))
      ? 'Try a rice-and-vegetable bowl using your rice cooker’s instructions. Add beans after cooking, and use only ingredients that fit your dietary restrictions.'
      : 'A no-cook bean-and-vegetable wrap is one option if you have suitable ingredients. Choose fillings and a wrap that fit your dietary restrictions.'
  if (!['none', 'vegetarian', 'vegan'].includes(p.dietary.toLowerCase())) return ['I have your dietary preference recorded, but can’t tailor a recipe reliably while AI is unavailable. What ingredients are safe for you?', 'Share ingredients that fit your dietary needs and the appliance you want to use; my AI connection is currently unavailable.']
  return [`My AI connection is down, but here’s a general dorm meal suggestion. ${suggestions} I haven’t checked your pantry.`, `Using your recorded appliance preference as a starting point: ${suggestions} This is a general suggestion; ingredients aren’t synced here.`]
}

export function fallbackReply(message: string, history: ChatMessage[], context: StudentContext, clock: Clock): string {
  const intent = intentOf(message, history.slice(0, -1))
  if (intent === 'model') return modelIdentity(null, history)
  const social = SOCIAL[intent]
  if (social) return chooseReply(social, history)
  const data = dataReply(intent, message, history.slice(0, -1), context, clock)
  if (data) return chooseReply([data, `From the available Dormosaur snapshot:\n${data}`], history)
  if (intent === 'meals') return chooseReply(mealReply(context), history)
  if (intent === 'planning') return chooseReply([
    'My AI connection is down, but a useful study-plan starting point is: pick your highest-priority topic, spend a short block recalling it without notes, check gaps, then try practice questions. Leave time to prepare your class materials and wind down. This is general advice; I haven’t added any tasks.',
    'While AI is unavailable, focus the evening on one priority: review weak topics, practise recalling them, take a break, then pack what you need for tomorrow. What time do you have available? I haven’t saved a plan.',
  ], history)
  if (intent === 'study') return chooseReply([
    'That’s a study question I can help with when my AI connection returns. I can’t give a reliable explanation in local mode right now. Try again shortly, or check your class notes in the meantime.',
    'My tutoring model is temporarily unavailable. Keep that question here and try again in a moment; meanwhile, I can still check recorded classes, deadlines and alarms.',
  ], history)
  return chooseReply([
    'I’m having trouble reaching my AI model right now. I can still check available Dormosaur schedules, alarms and deadlines. Try that question again in a moment.',
    'AI is temporarily unavailable, so I can’t work through that request yet. Ask me to check a recorded class or deadline, or retry your question shortly.',
  ], history)
}

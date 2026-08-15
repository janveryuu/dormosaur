import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ClassEntry, SubjectColor } from '@/lib/data'

export const GEMINI_MODEL_NAME = 'gemini-3.6-flash'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey && !apiKey.includes('placeholder') ? new GoogleGenerativeAI(apiKey) : null

export type GeminiParsedClass = {
  code: string
  subject: string
  instructor?: string | null
  room?: string | null
  days?: string[] | null
  start?: string | null
  end?: string | null
}

const VISION_SYSTEM_PROMPT = `You are an expert academic schedule parser for college students.
Your task is to analyze the provided image or text of a student portal course list or class schedule timetable and extract ALL valid enrolled course entries into structured JSON.

SUPPORTED LAYOUT TYPES:

FORMAT 1: DAY-GROUPED STACKED CARD FORMAT (VERY COMMON)
- Image/Text displays day headers as blocks or rows (e.g. "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN").
- Beneath or beside each day header are stacked class entries, often formatted like:
  "7:00am - 10:00am (Food Chem/Even-Lab 2)"
  "10:00am - 1:00pm (PhyChem/Even-Lab 1)"
  "3:00pm - 5:00pm (ASEANLit/Online)"
- EXTRACTION RULES FOR DAY-GROUPED FORMAT:
  1. Day Header: "MON" -> days: ["Mon"], "TUE" -> days: ["Tue"], "WED" -> days: ["Wed"], "THU" -> days: ["Thu"], "FRI" -> days: ["Fri"], "SAT" -> days: ["Sat"], "SUN" -> days: ["Sun"].
  2. Time Range: "7:00am - 10:00am" -> start: "07:00", end: "10:00". "1:00pm - 3:00pm" -> start: "13:00", end: "15:00".
  3. Parenthetical Subject & Room: "(Food Chem/Even-Lab 2)" -> subject: "Food Chem", code: "Food Chem", room: "Even-Lab 2". "(PhyChem/Online)" -> subject: "PhyChem", code: "PhyChem", room: "Online".
  4. CRITICAL: Strip leading/trailing parentheses. Split by "/" if present to separate Subject Name from Room/Location.
  5. CRITICAL: Day headers (MON, TUE, WED, THU, THURS, FRI, SAT, SUN) are NOT course names! Never output a course named "THURS" or "MON".

FORMAT 2: GRID TIMETABLE FORMAT
- Days (Mon, Tue, Wed, Thu, Fri, Sat, Sun) as column headers and time slots as row headers.
- Extract course code/subject (e.g. "ECE 421", "CpE 408") and room/location (e.g. "ONLINE", "RM 202(CICS)").
- Map course to exact day column and calculate exact start/end times.

FORMAT 3: UNSTRUCTURED / FREEFORM LIST FORMAT
- Freeform text lines like "MATH101 calculus 1 M&F 8:30-9:50am sci hall 204", "chem 130 mon/wed 10:15 to 12 lab b11".
- Extract course code, subject title, meeting days, start/end times, and room.

STRICT DISCARD & SAFETY RULES:
- DISCARD phone status bar text or icons (e.g. "SMART", "4:32", "[58]", Wi-Fi icons).
- DISCARD browser/app chrome, back arrows, navigation bars.
- NEVER treat day labels (Mon, Tue, Wed, Thu, Thurs, Fri, Sat, Sun) as course titles or codes!
- NEVER place time strings (containing "am", "pm", "-", "to", or "00pm-5") into the room/location field! If room is unknown, set room to null.
- NEVER invent generic placeholder names like "COURSE 11" or "COURSE 12". Use the real extracted course name or code. If unknown, set code/subject to the best title or leave empty for student review.

Output ONLY strict, valid JSON matching this schema:
{
  "classes": [
    {
      "code": "Food Chem",
      "subject": "Food Chem",
      "instructor": null,
      "room": "Even-Lab 2",
      "days": ["Mon"],
      "start": "07:00",
      "end": "10:00"
    }
  ]
}`

function parseDataUrl(dataUrl: string): { inlineData: { data: string; mimeType: string } } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+|application\/pdf);base64,(.+)$/)
  if (!match) return null
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  }
}

export async function parseScheduleImageWithGemini(dataUrl: string): Promise<ClassEntry[]> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const imagePart = parseDataUrl(dataUrl)
  if (!imagePart) {
    throw new Error('Invalid image format.')
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const result = await model.generateContent([
    VISION_SYSTEM_PROMPT,
    imagePart,
  ])

  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('Empty response from Gemini vision model.')
  }

  const parsed = JSON.parse(responseText)
  const items: GeminiParsedClass[] = Array.isArray(parsed.classes) ? parsed.classes : []

  return processParsedClasses(items)
}

export async function parseScheduleTextWithGemini(text: string): Promise<ClassEntry[]> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const prompt = `${VISION_SYSTEM_PROMPT}\n\nSCHEDULE TEXT TO PARSE:\n"""\n${text}\n"""`
  const result = await model.generateContent([prompt])

  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('Empty response from Gemini text model.')
  }

  const parsed = JSON.parse(responseText)
  const items: GeminiParsedClass[] = Array.isArray(parsed.classes) ? parsed.classes : []

  return processParsedClasses(items)
}

function processParsedClasses(items: GeminiParsedClass[]): ClassEntry[] {
  if (items.length === 0) {
    return []
  }

  const defaultSlots = [
    { start: '08:00', end: '09:15' },
    { start: '09:30', end: '10:45' },
    { start: '11:00', end: '12:15' },
    { start: '13:00', end: '14:15' },
    { start: '14:30', end: '15:45' },
    { start: '16:00', end: '17:15' },
  ]

  const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'THURS', 'FRI', 'SAT', 'SUN', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  return items
    .filter((item) => {
      // Discard items where subject/code is literally a day name
      const cleanSubj = (item.subject || item.code || '').trim().toUpperCase()
      return cleanSubj && !DAY_NAMES.includes(cleanSubj)
    })
    .map((item, index) => {
      const lowFields: string[] = []

      // Strip parentheses and extraneous formatting
      let rawSubject = (item.subject || item.code || '').trim().replace(/^\(|\)$/g, '')
      let rawCode = (item.code || rawSubject).trim().replace(/^\(|\)$/g, '')

      // If subject contains "/", e.g. "PhyChem/Online", split
      if (rawSubject.includes('/') && (!item.room || item.room === 'Room TBA')) {
        const parts = rawSubject.split('/')
        rawSubject = parts[0].trim()
        rawCode = rawSubject
      }

      const code = rawCode || rawSubject || 'Untitled Class'
      const subject = rawSubject || code

      if (!rawSubject && !rawCode) lowFields.push('subject')

      const hasExplicitTime = Boolean(item.start && item.end)
      const slot = defaultSlots[index % defaultSlots.length]
      const start = hasExplicitTime ? (item.start as string) : slot.start
      const end = hasExplicitTime ? (item.end as string) : slot.end
      if (!hasExplicitTime) lowFields.push('time')

      const days = (Array.isArray(item.days) && item.days.length > 0) ? item.days : ['Mon']
      if (!item.days || item.days.length === 0) lowFields.push('days')

      // Clean room string: remove corrupted time patterns like "00pm-5"
      let room = (item.room || 'Room TBA').trim().replace(/^\(|\)$/g, '')
      if (/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–]\s*\d{1,2})|\b(am|pm)\b/i.test(room)) {
        room = 'Room TBA'
        lowFields.push('room')
      } else if (!item.room) {
        lowFields.push('room')
      }

      const instructor = (item.instructor || 'TBA').trim()
      if (!item.instructor) lowFields.push('instructor')

      const color = ((index % 5) + 1) as SubjectColor

      return {
        id: `gemini-${Date.now()}-${index}`,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        code: code.toUpperCase(),
        instructor,
        room,
        days,
        start,
        end,
        color,
        confidence: lowFields.length === 0 ? 'high' : 'low',
        lowFields: lowFields.length > 0 ? lowFields : undefined,
      }
    })
}

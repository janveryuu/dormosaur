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
Your task is to analyze the provided image of a student portal course list or class schedule timetable and extract ALL valid enrolled course entries into structured JSON.

GRID TIMETABLE SPECIAL INSTRUCTIONS:
- The image may be a weekly schedule grid with days (Mon, Tue, Wed, Thu, Fri, Sat, Sun) as column headers and time slots (e.g. 07:00 AM-07:30 AM) as row headers.
- Each course block in a grid contains a course code (e.g. "ECE 421", "CpE 408", "CpE 406", "CpEE 401", "CpE 407", "ENGG 411", "ENGG 414", "PATHFit 4", "Fili 101") and a room/location (e.g. "ONLINE", "RM 202(CICS)", "CPE LAB", "RM 201(CICS)", "FDC").
- Vertical ditto marks "-do-" indicate that the course extends continuously across those 30-minute time rows. Calculate the exact start time (topmost row) and end time (after the last -do- row).
- Map the course to its exact day column (Mon, Tue, Wed, Thu, Fri, Sat, Sun).

CRITICAL DISCARD RULES (STRICT NOISE DISCARDING):
- You MUST DISCARD and EXCLUDE any phone status bar text or icons (e.g. carrier names like "SMART", clock times like "4:32", battery percentages like "[58]", Wi-Fi icons, signal strength bars, mobile network indicators).
- You MUST DISCARD on-screen mobile UI navigation bars, back arrows, close buttons, app headers, or web browser chrome.
- DO NOT treat phone status bar text (e.g. "SMART 4:32") as a course title or room!

EXTRACTION RULES:
- code: Course code (e.g. "ECE 421", "CpE 408", "CpE 406", "CpEE 401", "ENGG 411", "ENGG 414", "PATHFit 4", "Fili 101")
- subject: Course name/title (e.g. "ECE 421", "CpE 408", "CpE 406", "CpEE 401", "ENGG 411", "ENGG 414", "PATHFit 4", "Fili 101")
- instructor: Instructor name if present in image, otherwise null
- room: Room/building (e.g. "ONLINE", "RM 202(CICS)", "CPE LAB", "RM 201(CICS)", "FDC")
- days: Array of meeting days (e.g. ["Tue"], ["Wed"], ["Thu"], ["Mon"], ["Fri"])
- start: Start time in 24-hr "HH:MM" format (e.g. "07:00", "10:00", "12:00", "13:00", "14:00", "16:00")
- end: End time in 24-hr "HH:MM" format (e.g. "10:00", "12:00", "14:00", "16:00", "19:00")

ACCURACY & TRUTHFULNESS:
- If meeting time, days, room, or instructor are NOT visibly written in the image, set those specific fields to null or empty.
- NEVER fabricate, guess, or invent plausible-looking times, rooms, or instructors if they were not in the image.

Output ONLY strict, valid JSON matching this schema:
{
  "classes": [
    {
      "code": "ECE 421",
      "subject": "ECE 421",
      "instructor": null,
      "room": "ONLINE",
      "days": ["Tue"],
      "start": "07:00",
      "end": "10:00"
    }
  ]
}`

function parseDataUrl(dataUrl: string): { inlineData: { data: string; mimeType: string } } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
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

  return items.map((item, index) => {
    const lowFields: string[] = []

    const code = (item.code || `COURSE ${index + 1}`).trim().toUpperCase()
    const subject = (item.subject || code).trim()

    const hasExplicitTime = Boolean(item.start && item.end)
    const slot = defaultSlots[index % defaultSlots.length]
    const start = hasExplicitTime ? (item.start as string) : slot.start
    const end = hasExplicitTime ? (item.end as string) : slot.end
    if (!hasExplicitTime) lowFields.push('time')

    const days = (Array.isArray(item.days) && item.days.length > 0) ? item.days : ['Mon']
    if (!item.days || item.days.length === 0) lowFields.push('days')

    const room = (item.room || 'Room TBA').trim()
    if (!item.room) lowFields.push('room')

    const instructor = (item.instructor || 'TBA').trim()
    if (!item.instructor) lowFields.push('instructor')

    const color = ((index % 5) + 1) as SubjectColor

    return {
      id: `gemini-${Date.now()}-${index}`,
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      code,
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

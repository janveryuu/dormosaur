import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { ClassEntry } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

export async function POST(req: NextRequest) {
  try {
    // Auth guard — only signed-in users
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, classes } = (await req.json()) as { prompt: string; classes: ClassEntry[] }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 })
    }

    const currentClassesText = JSON.stringify(classes, null, 2)

    const systemPrompt = `You are a precision AI Schedule Parser for college students.
Given the student's current list of classes and a natural language instruction (e.g., "Move Chem lab to 3pm", "Delete Friday elective", "Change Calculus room to Sci Hall 210"), identify:
1. The exact class being targeted (match by subject, code, or day).
2. What action is requested: "update", "delete", or "add".
3. The specific field changed (e.g., "start", "end", "room", "days", "subject", "code").
4. Old value vs New value.
5. A human-readable confirmation question (e.g., "Move General Chemistry Lab from 10:15 AM to 3:00 PM?").

CURRENT CLASSES:
${currentClassesText}

CRITICAL: Return ONLY a valid JSON object matching this schema without any extra text or markdown codeblocks:
{
  "action": "update" | "delete" | "add",
  "targetClassId": "cls-id-here",
  "targetSubject": "Subject Name",
  "targetCode": "CODE101",
  "fieldChanged": "start" | "end" | "room" | "days" | "subject",
  "oldValue": "10:15 AM",
  "newValue": "3:00 PM",
  "confirmationText": "Move General Chemistry Lab from 10:15 AM to 3:00 PM?",
  "updatedClass": {
    "id": "cls-id-here",
    "subject": "General Chemistry Lab",
    "code": "CHEM 120",
    "days": ["Mon", "Wed"],
    "start": "15:00",
    "end": "16:45",
    "room": "Lab B11",
    "color": 2
  }
}`

    // 1. If Groq Key available, call Llama 3
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })

      const rawContent = completion.choices[0]?.message?.content || '{}'
      const parsedRes = JSON.parse(rawContent)
      return NextResponse.json({ ...parsedRes, source: 'groq/llama-3.3-70b' })
    }

    // 2. Intelligent Fallback Logic (if GROQ_API_KEY not configured)
    const lower = prompt.toLowerCase()
    let matchedClass = classes.find(
      (c) =>
        lower.includes(c.subject.toLowerCase()) ||
        lower.includes(c.code.toLowerCase()) ||
        c.subject.toLowerCase().split(' ').some((word) => word.length > 3 && lower.includes(word))
    ) || classes[0]

    let action: 'update' | 'delete' | 'add' = 'update'
    let fieldChanged = 'start'
    let oldValue = matchedClass ? matchedClass.start : '10:00'
    let newValue = '15:00'
    let confirmationText = `Move ${matchedClass?.subject || 'Class'} to 3:00 PM?`

    if (lower.includes('delete') || lower.includes('remove') || lower.includes('drop')) {
      action = 'delete'
      fieldChanged = 'class'
      confirmationText = `Delete ${matchedClass?.subject || 'Class'} from your schedule?`
    } else if (lower.includes('room') || lower.includes('hall') || lower.includes('lab') || lower.includes('sci')) {
      action = 'update'
      fieldChanged = 'room'
      oldValue = matchedClass?.room || 'Room 101'
      const roomMatch = prompt.match(/(?:to|in|room)\s+([A-Za-z0-9\s]+)/i)
      newValue = roomMatch ? roomMatch[1].trim() : 'Sci Hall 210'
      confirmationText = `Change ${matchedClass?.subject} room from "${oldValue}" → "${newValue}"?`
    } else if (lower.includes('3pm') || lower.includes('3:00') || lower.includes('15:00')) {
      action = 'update'
      fieldChanged = 'start'
      oldValue = matchedClass?.start || '10:15 AM'
      newValue = '15:00'
      confirmationText = `Move ${matchedClass?.subject} start time from ${oldValue} → 3:00 PM?`
    }

    const updatedClass: ClassEntry = matchedClass
      ? {
          ...matchedClass,
          ...(fieldChanged === 'room' ? { room: newValue } : {}),
          ...(fieldChanged === 'start' ? { start: newValue } : {}),
        }
      : classes[0]

    return NextResponse.json({
      action,
      targetClassId: matchedClass?.id || 'cls-1',
      targetSubject: matchedClass?.subject || 'Class',
      targetCode: matchedClass?.code || 'CS 101',
      fieldChanged,
      oldValue,
      newValue,
      confirmationText,
      updatedClass,
      source: 'dormosaur/local-ai-fallback',
    })
  } catch (error) {
    console.error('Schedule Edit API Error:', error)
    return NextResponse.json({ error: 'Failed to parse schedule edit instruction' }, { status: 500 })
  }
}

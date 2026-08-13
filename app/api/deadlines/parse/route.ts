import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const SYSTEM_PARSER_PROMPT = `
You are an expert student assistant AI for Dormosaur.
Your task is to parse raw text or OCR output containing assignment, exam, quiz, or project deadlines into structured JSON.

Return ONLY a valid JSON object with the key "deadlines", containing an array of deadline objects:
{
  "deadlines": [
    {
      "title": string (e.g. "Lab Report 2", "Calculus Midterm"),
      "code": string (Course code if mentioned, e.g. "MATH 101", "CS 150", or best match from student classes list),
      "dueDate": string (YYYY-MM-DD format. Infer reasonable future dates from days like "next Monday" or "Oct 15"),
      "dueTime": string or null (HH:MM in 24h format if mentioned, e.g. "23:59" or "14:30"),
      "type": "assignment" | "exam" | "project" | "quiz" | "other",
      "confidence": "high" | "low",
      "lowFields": string[] (Array of field names like ["dueDate", "code"] if text was handwritten/blurry/uncertain)
    }
  ]
}

Rules:
1. Try to match course codes against the provided student classes list.
2. If text is messy or handwritten, do your best and set "confidence": "low" and list uncertain fields in "lowFields".
3. Return ONLY valid JSON, no markdown codeblocks or conversational text.
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { mode, content, userClasses = [] } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'No content provided to parse.' },
        { status: 400 }
      )
    }

    const classesContext = Array.isArray(userClasses)
      ? userClasses
          .map((c: { code?: string; subject?: string }) => `${c.code || ''} ${c.subject || ''}`.trim())
          .filter(Boolean)
          .join(', ')
      : ''

    // Helper: Normalize date to YYYY-MM-DD
    const normalizeDate = (dStr?: string) => {
      if (!dStr) {
        const d = new Date()
        d.setDate(d.getDate() + 5)
        return d.toISOString().split('T')[0]
      }
      try {
        const parsed = new Date(dStr)
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0]
        }
      } catch (_) {}
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    }

    if (groq) {
      if (mode === 'camera' || mode === 'photo') {
        // Image Vision Path
        try {
          const visionModel = 'llama-3.2-11b-vision-preview'
          const imageMessage = content.startsWith('data:')
            ? content
            : `data:image/jpeg;base64,${content}`

          const chatCompletion = await groq.chat.completions.create({
            model: visionModel,
            messages: [
              {
                role: 'system',
                content: `${SYSTEM_PARSER_PROMPT}\nStudent enrolled classes: [${classesContext}]`,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all assignment, exam, quiz, or project deadlines from this photograph/image. Return ONLY valid JSON as instructed.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageMessage,
                    },
                  },
                ],
              },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          })

          const responseText = chatCompletion.choices[0]?.message?.content || '{}'
          const parsedJson = JSON.parse(responseText)

          if (Array.isArray(parsedJson.deadlines) && parsedJson.deadlines.length > 0) {
            const formatted = parsedJson.deadlines.map((d: Record<string, unknown>, idx: number) => ({
              id: `dl-img-${Date.now()}-${idx}`,
              title: (d.title as string) || 'Assignment Deadline',
              code: (d.code as string) || (userClasses[0]?.code as string) || 'GEN 101',
              type: (d.type as string) || 'assignment',
              dueDate: normalizeDate(d.dueDate as string),
              dueTime: (d.dueTime as string) || '23:59',
              color: ((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5,
              completed: false,
              source: 'image_import',
              confidence: (d.confidence as string) === 'low' ? 'low' : 'high',
              lowFields: Array.isArray(d.lowFields) ? d.lowFields : [],
            }))
            return NextResponse.json({ success: true, deadlines: formatted })
          }
        } catch (visionErr) {
          console.warn('[Deadline Parse Notice] Groq Vision attempt:', visionErr)
        }
      }

      // Text Input or Vision Fallback Path
      try {
        const textModel = 'llama-3.3-70b-versatile'
        const promptInput =
          mode === 'camera' || mode === 'photo'
            ? `Extracted image contents / raw deadline note:\n${content}`
            : content

        const chatCompletion = await groq.chat.completions.create({
          model: textModel,
          messages: [
            {
              role: 'system',
              content: `${SYSTEM_PARSER_PROMPT}\nStudent enrolled classes: [${classesContext}]`,
            },
            {
              role: 'user',
              content: `Parse these deadlines:\n\n${promptInput}`,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        })

        const responseText = chatCompletion.choices[0]?.message?.content || '{}'
        const parsedJson = JSON.parse(responseText)

        if (Array.isArray(parsedJson.deadlines) && parsedJson.deadlines.length > 0) {
          const formatted = parsedJson.deadlines.map((d: Record<string, unknown>, idx: number) => ({
            id: `dl-txt-${Date.now()}-${idx}`,
            title: (d.title as string) || 'Assignment Deadline',
            code: (d.code as string) || (userClasses[0]?.code as string) || 'GEN 101',
            type: (d.type as string) || 'assignment',
            dueDate: normalizeDate(d.dueDate as string),
            dueTime: (d.dueTime as string) || '23:59',
            color: ((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5,
            completed: false,
            source: mode === 'text' ? 'text_import' : 'image_import',
            confidence: (d.confidence as string) === 'low' ? 'low' : 'high',
            lowFields: Array.isArray(d.lowFields) ? d.lowFields : [],
          }))
          return NextResponse.json({ success: true, deadlines: formatted })
        }
      } catch (textErr) {
        console.error('[Deadline Parse Error] LLM parsing failed:', textErr)
      }
    }

    // Heuristic Fallback Parser if Groq API is unavailable or returns no entries
    if (mode === 'camera' || mode === 'photo') {
      // If image input had no identifiable deadlines, return clear error
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't read this clearly — try retaking the photo with better lighting, or paste the text instead.",
        },
        { status: 422 }
      )
    }

    // Rule-based fallback parser for text input
    const lines = content.split('\n').filter((l) => l.trim().length > 0)
    const fallbackDeadlines = lines.map((line, idx) => {
      const isExam = /exam|midterm|final|test|quiz/i.test(line)
      const isProject = /project|presentation|thesis|paper/i.test(line)
      const type = isExam ? 'exam' : isProject ? 'project' : 'assignment'

      const codeMatch = line.match(/([A-Z]{2,4}\s*\d{3})/i)
      const code = codeMatch ? codeMatch[1].toUpperCase() : userClasses[0]?.code || 'MATH 101'

      const d = new Date()
      d.setDate(d.getDate() + (idx + 1) * 3)

      return {
        id: `dl-fallback-${Date.now()}-${idx}`,
        title: line.replace(/([A-Z]{2,4}\s*\d{3})/i, '').trim() || 'Imported Task',
        code,
        type,
        dueDate: d.toISOString().split('T')[0],
        dueTime: '23:59',
        color: ((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        completed: false,
        source: 'text_import' as const,
        confidence: 'low' as const,
        lowFields: ['dueDate'],
      }
    })

    return NextResponse.json({ success: true, deadlines: fallbackDeadlines })
  } catch (err: unknown) {
    console.error('Top-level deadline parse route catch:', err)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while parsing deadlines.' },
      { status: 500 }
    )
  }
}

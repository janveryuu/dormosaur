import { NextResponse } from 'next/server'
import { parseScheduleImageWithGemini, parseScheduleTextWithGemini } from '@/lib/gemini'
import { parseRawSchedule } from '@/lib/parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image, text, mode } = body

    // 1. Image / PDF Vision-based parsing via Gemini Vision
    if ((mode === 'camera' || mode === 'photo' || mode === 'file' || image) && (image?.startsWith('data:image/') || image?.startsWith('data:application/pdf'))) {
      try {
        const classes = await parseScheduleImageWithGemini(image)
        if (Array.isArray(classes) && classes.length > 0) {
          return NextResponse.json({
            success: true,
            provider: 'gemini-3.6-flash',
            classes,
          })
        }
      } catch (geminiErr: any) {
        console.warn('[Schedule Parse API Notice] Gemini Vision attempt:', geminiErr?.message || geminiErr)
      }
    }

    // 2. Text-based parsing (AI text model first, local parser fallback)
    const textToParse = text || body.content || ''
    if (textToParse.trim()) {
      // Try AI Text Parsing first
      try {
        const aiClasses = await parseScheduleTextWithGemini(textToParse)
        if (Array.isArray(aiClasses) && aiClasses.length > 0) {
          return NextResponse.json({
            success: true,
            provider: 'gemini-text',
            classes: aiClasses,
          })
        }
      } catch (aiErr: any) {
        console.warn('[Schedule Parse API Notice] AI text attempt:', aiErr?.message || aiErr)
      }

      // Fallback to stateful local parser
      const localClasses = parseRawSchedule(textToParse)
      if (localClasses && localClasses.length > 0) {
        return NextResponse.json({
          success: true,
          provider: 'parser-local',
          classes: localClasses,
        })
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "We couldn't read this schedule clearly — try a clearer photo, better lighting, or paste the raw schedule text instead.",
      },
      { status: 400 }
    )
  } catch (err: any) {
    console.error('[Schedule Parse API Error]:', err)
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.",
      },
      { status: 500 }
    )
  }
}

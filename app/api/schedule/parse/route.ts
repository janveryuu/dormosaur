import { NextResponse } from 'next/server'
import { parseScheduleImageWithGemini } from '@/lib/gemini'
import { parseRawSchedule } from '@/lib/parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { image, text, mode } = body

    // 1. Image-based parsing via Gemini 1.5 Flash Vision
    if ((mode === 'camera' || mode === 'photo' || mode === 'file' || image) && image?.startsWith('data:image/')) {
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

    // 2. Text-based parsing fallback (or for Paste Text mode)
    const textToParse = text || body.content || ''
    if (textToParse.trim()) {
      const classes = parseRawSchedule(textToParse)
      if (classes && classes.length > 0) {
        return NextResponse.json({
          success: true,
          provider: 'parser-local',
          classes,
        })
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "We couldn't read this image clearly — try a clearer photo, better lighting, or paste the text instead.",
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

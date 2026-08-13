import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { recipes } from '@/lib/data'
import type { ClassEntry } from '@/lib/data'
import { analyzeTodaySchedule } from '@/lib/schedule-gap-analyzer'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

export async function POST(req: NextRequest) {
  try {
    const { classes = [], dayName = 'Mon' } = await req.json()

    // Analyze gaps in today's timetable
    const analysis = analyzeTodaySchedule(classes as ClassEntry[], dayName)

    const recipeSummaries = recipes.map((r) => ({
      slug: r.slug,
      title: r.title,
      cookTimeMinutes: r.minutes,
      appliance: r.appliance,
      meal: r.meal,
      blurb: r.blurb,
    }))

    const systemPrompt = `You are an expert AI Campus Meal Advisor for college students.
Given today's class schedule analysis and available recipe library, select 3 ideal recipes that fit the student's exact time constraints today.

SCHEDULE ANALYSIS:
- Summary: ${analysis.summaryHeadline}
- Packed until: ${analysis.packedUntil || 'No classes'}
- Max recommended cook time: ${analysis.maxRecommendedCookTime} minutes
- Today's Gaps: ${JSON.stringify(analysis.gaps)}

AVAILABLE RECIPES:
${JSON.stringify(recipeSummaries, null, 2)}

Return ONLY a valid JSON object matching this schema without any markdown formatting:
{
  "headline": "${analysis.summaryHeadline}",
  "subtext": "Here are 3 quick meals that fit your schedule perfectly today.",
  "recommendedSlugs": ["microwave-mac-and-cheese", "kettle-ramen-egg", "quesadilla"],
  "scheduleInsights": [
    {
      "recipeSlug": "microwave-mac-and-cheese",
      "reason": "Cooks in 5 mins — fits your break between lectures."
    }
  ]
}`

    // 1. Call Groq Llama 3 if API Key is configured
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Suggest schedule-aware meals for today.' },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const rawContent = completion.choices[0]?.message?.content || '{}'
      const aiData = JSON.parse(rawContent)
      return NextResponse.json({ ...aiData, analysis, source: 'groq/llama-3.3-70b' })
    }

    // 2. Local Fallback Engine
    const suitableRecipes = recipes.filter((r) => r.minutes <= analysis.maxRecommendedCookTime + 5)
    const selected = (suitableRecipes.length >= 3 ? suitableRecipes : recipes).slice(0, 3)

    return NextResponse.json({
      headline: analysis.summaryHeadline,
      subtext: `Here are ${selected.length} quick meals under ${analysis.maxRecommendedCookTime + 5} minutes tailored to your schedule!`,
      recommendedSlugs: selected.map((r) => r.slug),
      scheduleInsights: selected.map((r) => ({
        recipeSlug: r.slug,
        reason: `Cooks in ${r.minutes} mins — fits your schedule constraints today.`,
      })),
      analysis,
      source: 'dormosaur/local-ai-fallback',
    })
  } catch (error) {
    console.error('Schedule-Aware Recipe API Error:', error)
    return NextResponse.json({ error: 'Failed to generate schedule-aware meal suggestions' }, { status: 500 })
  }
}

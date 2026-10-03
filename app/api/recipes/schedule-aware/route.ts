import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { recipes } from '@/lib/data'
import { getDietaryFilteredRecipes, getFeasibleRecipes, type ApplianceType, type DietaryPreference } from '@/lib/appliances-data'
import { analyzeTodaySchedule } from '@/lib/schedule-gap-analyzer'
import { getClasses, getUserProfile } from '@/lib/db'
import { clockAt } from '@/lib/copilot/time'
import { apiError, readJson, requireAuthenticated } from '@/lib/api-security'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 10_000, maxRetries: 0 }) : null
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireAuthenticated()
    await readJson(req, 64 * 1024)
    const [classes, profile] = await Promise.all([getClasses(supabase, user.id), getUserProfile(supabase, user.id)])
    const day = clockAt(new Date(), profile?.timezone || 'Asia/Manila').day
    const analysis = analyzeTodaySchedule(classes, day)
    const feasible = getDietaryFilteredRecipes(getFeasibleRecipes(recipes, (profile?.appliances || []) as ApplianceType[]), (profile?.dietary_preference || 'none') as DietaryPreference)
    const suitable = feasible.filter(r => r.minutes <= analysis.maxRecommendedCookTime + 5)
    let selected = suitable.slice(0, 3)
    let source = 'local'
    if (groq && suitable.length) {
      try {
        const completion = await groq.chat.completions.create({ model: 'openai/gpt-oss-20b', response_format: { type: 'json_object' }, temperature: 0.2, max_tokens: 500,
          messages: [{ role: 'system', content: `Select up to 3 recipes from this allowed list that fit the student's schedule. Return JSON {recommendedSlugs:string[]}. Analysis: ${JSON.stringify(analysis)}. Recipes: ${JSON.stringify(suitable.map(r => ({ slug: r.slug, title: r.title, minutes: r.minutes })))}` }, { role: 'user', content: 'Suggest meals for today.' }] })
        const data = JSON.parse(completion.choices[0]?.message?.content || '{}')
        if (Array.isArray(data.recommendedSlugs) && data.recommendedSlugs.length && data.recommendedSlugs.length <= 3 && data.recommendedSlugs.every((s: unknown) => typeof s === 'string' && suitable.some(r => r.slug === s))) {
          selected = [...new Set<string>(data.recommendedSlugs)].map(slug => suitable.find(r => r.slug === slug)!)
          source = 'ai'
        }
      } catch { console.warn('[Schedule Meals]', { category: 'provider_unavailable' }) }
    }
    return NextResponse.json({ headline: analysis.summaryHeadline,
      subtext: selected.length ? `Here are ${selected.length} meals that fit your saved equipment and schedule.` : 'No recipes match this break and your saved equipment. Check your profile or browse the Kitchen.',
      recommendedSlugs: selected.map(r => r.slug), scheduleInsights: selected.map(r => ({ recipeSlug: r.slug, reason: `Cooks in ${r.minutes} minutes.` })), analysis, source })
  } catch (error) { return apiError(error, 'We could not load meal suggestions. Please try again shortly.') }
}

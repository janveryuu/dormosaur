import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { apiError, boundedText, InputError, readJson, requireAuthenticated, stringList } from '@/lib/api-security'
import { getUserProfile } from '@/lib/db'
import { applianceName, fallbackRecipe, validateRecipe } from '@/lib/recipe-safety'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 10_000, maxRetries: 0 }) : null
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireAuthenticated()
    const body = await readJson(req, 16 * 1024)
    const ingredients = stringList(body.ingredients, 20, 80, 'ingredients')
    const appliances = stringList(body.appliances, 4, 40, 'appliances')
    const prompt = boundedText(body.prompt, 1500, 'recipe request')
    if (!ingredients.length) throw new InputError('Select the ingredients you have before generating a recipe.')
    if (appliances.some(a => !['microwave', 'kettle', 'ricecooker', 'inductionburner'].includes(applianceName(a)))) throw new InputError('Please choose a supported dorm appliance.')
    const profile = await getUserProfile(supabase, user.id)
    if (Array.isArray(profile?.appliances) && appliances.some(a => !profile.appliances!.some(p => applianceName(p) === applianceName(a)))) {
      throw new InputError('Choose appliances you have saved in your profile, or update your profile first.')
    }
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({ model: 'openai/gpt-oss-20b', response_format: { type: 'json_object' }, temperature: 0.2, max_tokens: 1600,
          messages: [{ role: 'system', content: `Create one practical dorm recipe using ONLY these ingredients: ${JSON.stringify(ingredients)}. Water is the only permitted extra ingredient. Use ONLY these appliances: ${JSON.stringify(appliances)}. Never assume raw rice is cooked. Kettles heat water only. Never microwave eggs in shells or sealed containers. Egg dishes must beat eggs, cook until fully set with no liquid, and check 71°C (160°F) in the center with a food thermometer. Avoid raw meat, unsafe food storage and undercooked eggs. Follow dietary preference ${profile?.dietary_preference || 'unspecified'}; note ${profile?.dietary_note || 'none'}. Return JSON {title,cook_time_minutes,servings,appliances:string[],ingredients:string[],steps:[{text,duration_minutes}],dorm_tip}. If impossible safely, return {}.` }, { role: 'user', content: prompt || 'Suggest a meal from my selected ingredients.' }] })
        const recipe = validateRecipe(JSON.parse(completion.choices[0]?.message?.content || '{}'), ingredients, appliances)
        if (recipe) return NextResponse.json({ recipe, source: 'ai' })
      } catch { console.warn('[Recipe Generate]', { category: 'provider_unavailable' }) }
    }
    const recipe = fallbackRecipe(ingredients, appliances)
    if (!recipe) throw new InputError('We could not make a safe recipe with that combination. Try ready-to-eat ingredients or choose different equipment.', 422)
    return NextResponse.json({ recipe, source: 'local' })
  } catch (error) { return apiError(error, 'We could not generate a recipe right now. Please try again shortly.') }
}

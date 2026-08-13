import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ingredients = [], appliances = [], prompt = '', dormOnly = true } = body

    const ingredientsStr = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients
    const appliancesStr = Array.isArray(appliances) ? appliances.join(', ') : appliances

    const inputContext = prompt
      ? `User prompt: "${prompt}"`
      : `Ingredients on hand: [${ingredientsStr || 'Eggs, Rice, Soy Sauce'}]. Available appliances: [${appliancesStr || 'Microwave'}].`

    const systemPrompt = `You are an expert recipe generator built specifically for dormitory college students on small budgets with minimal equipment.
Given a list of ingredients on hand and available appliances, generate EXACTLY ONE realistic, delicious, easy dorm recipe.

RULES:
1. NEVER assume equipment not listed. If only "Microwave" or "Kettle" is listed, do NOT use stove, oven, or blender.
2. Servings should be 1 or 2. Cook time should be 3 to 15 minutes.
3. Include a very helpful "dorm_tip" for making it easily in a student room.
4. Return ONLY a valid JSON object with NO codeblocks or markdown formatting matching this JSON schema:

{
  "title": "Microwave Fluffy Egg & Soy Rice Bowl",
  "slug": "ai-microwave-egg-rice",
  "cook_time_minutes": 5,
  "servings": 1,
  "appliances": ["Microwave"],
  "ingredients": [
    "1 cup cooked rice (or instant rice)",
    "2 fresh eggs",
    "1 tbsp soy sauce",
    "1 tsp sesame oil or butter",
    "Green onion (optional)"
  ],
  "steps": [
    { "text": "Crack 2 eggs into a microwave-safe bowl, add 1 tbsp soy sauce, and beat lightly with a fork.", "duration_minutes": 1 },
    { "text": "Add 1 cup cooked rice to the bowl and stir until coated in egg.", "duration_minutes": 1 },
    { "text": "Cover the bowl with a damp paper towel and microwave on high for 90 seconds.", "duration_minutes": 2 },
    { "text": "Stir well, drizzle sesame oil on top, and let rest for 1 minute before eating.", "duration_minutes": 1 }
  ],
  "dorm_tip": "Covering the bowl with a damp paper towel traps steam so the rice stays fluffy and doesn't get dry!"
}`

    // 1. Call Groq Llama 3 if API Key is configured
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputContext },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })

      const rawContent = completion.choices[0]?.message?.content || '{}'
      const recipeData = JSON.parse(rawContent)
      recipeData.slug = `ai-${Date.now()}`
      return NextResponse.json({ recipe: recipeData, source: 'groq/llama-3.3-70b' })
    }

    // 2. Intelligent Fallback Recipe Generator (if GROQ_API_KEY is not configured)
    const lowerPrompt = (prompt + ' ' + ingredientsStr).toLowerCase()
    let fallbackRecipe = {
      title: '5-Minute Microwave Cheesy Egg Rice',
      slug: `ai-${Date.now()}`,
      cook_time_minutes: 5,
      servings: 1,
      appliances: ['Microwave'],
      ingredients: [
        '1 cup cooked rice',
        '2 fresh eggs',
        '2 tbsp shredded cheese or slice of American cheese',
        '1 tbsp soy sauce or sriracha',
        '1 tsp butter'
      ],
      steps: [
        { text: 'In a microwave-safe mug or bowl, whisk 2 eggs with a pinch of salt and 1 tsp butter.', duration_minutes: 1 },
        { text: 'Mix in 1 cup of cooked rice until completely combined.', duration_minutes: 1 },
        { text: 'Microwave on high for 90 seconds. Top with shredded cheese and microwave for another 20 seconds to melt.', duration_minutes: 2 },
        { text: 'Drizzle with soy sauce or sriracha and enjoy warm!', duration_minutes: 1 }
      ],
      dorm_tip: 'Using a wide ceramic mug helps heat the egg and rice evenly without spilling!'
    }

    if (lowerPrompt.includes('ramen') || lowerPrompt.includes('noodle')) {
      fallbackRecipe = {
        title: 'Kettle Soft-Egg Upgraded Ramen',
        slug: `ai-${Date.now()}`,
        cook_time_minutes: 6,
        servings: 1,
        appliances: ['Kettle'],
        ingredients: [
          '1 pack instant ramen',
          '1 egg',
          '1 slice cheese or 1 tsp butter',
          '2 cups boiling water'
        ],
        steps: [
          { text: 'Boil water in your electric kettle and pour into a heat-safe ramen bowl.', duration_minutes: 2 },
          { text: 'Add noodles and seasoning packet, then crack the egg directly into the hot broth.', duration_minutes: 1 },
          { text: 'Cover bowl tightly with a plate for 4 minutes to cook noodles and poach the egg.', duration_minutes: 3 }
        ],
        dorm_tip: 'Covering the bowl with a ceramic plate keeps the steam trapped so the egg poaches perfectly!'
      }
    }

    return NextResponse.json({ recipe: fallbackRecipe, source: 'dormosaur/local-ai-fallback' })
  } catch (error) {
    console.error('AI Recipe Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}

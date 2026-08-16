import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groqApiKey = process.env.GROQ_API_KEY || ''
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

function generateDynamicFallbackRecipe(
  ingredients: string[],
  appliances: string[],
  prompt: string = ''
) {
  const ingLower = ingredients.map((i) => i.toLowerCase())
  const primaryApp = appliances[0] || 'Microwave'

  const hasTuna = ingLower.some((i) => i.includes('tuna'))
  const hasEgg = ingLower.some((i) => i.includes('egg'))
  const hasRice = ingLower.some((i) => i.includes('rice'))
  const hasRamen = ingLower.some((i) => i.includes('ramen') || i.includes('noodle'))
  const hasBread = ingLower.some((i) => i.includes('bread') || i.includes('toast'))
  const hasCheese = ingLower.some((i) => i.includes('cheese'))
  const hasKimchi = ingLower.some((i) => i.includes('kimchi'))
  const hasPB = ingLower.some((i) => i.includes('peanut butter') || i.includes('pb'))

  let title = `${primaryApp} Dorm Scramble Bowl`
  let steps = [
    { text: `Prepare your selected ingredients: ${ingredients.join(', ')}.`, duration_minutes: 1 },
    { text: `Combine ingredients in a ${primaryApp.toLowerCase()}-safe dish with a pinch of seasoning.`, duration_minutes: 1 },
    { text: `Cook using your ${primaryApp} for 2–3 minutes until hot and well-cooked.`, duration_minutes: 2 },
    { text: 'Let rest for 1 minute before enjoying warm!', duration_minutes: 1 },
  ]
  let ingList = [...ingredients, 'Pinch of salt and pepper']
  let tip = 'Covering your dish while cooking in a dorm traps steam for fast, even heating!'

  if (hasTuna && hasEgg) {
    title = `${primaryApp} Savory Tuna-Egg Scramble`
    ingList = ['1 can drained tuna', '2 fresh eggs', '1 tsp soy sauce or mayo', 'Pinch of black pepper']
    steps = [
      { text: `Crack eggs into a ${primaryApp.toLowerCase()}-safe bowl and beat with a fork, pepper, and soy sauce.`, duration_minutes: 1 },
      { text: 'Flake the drained tuna into the eggs and stir until evenly distributed.', duration_minutes: 1 },
      { text: `Cook using your ${primaryApp} until eggs are fluffy and set (about 90–120 seconds in microwave or 3 mins in pan).`, duration_minutes: 2 },
      { text: 'Stir gently and serve hot right in your dorm bowl.', duration_minutes: 1 },
    ]
    tip = 'Draining the tuna liquid thoroughly prevents the egg scramble from becoming watery.'
  } else if (hasBread && (hasCheese || hasPB)) {
    title = hasCheese ? `${primaryApp} Melty Golden Cheese Toast` : `${primaryApp} Warm Peanut Butter Toast`
    ingList = ['2 slices bread', hasCheese ? '2 slices cheese' : '2 tbsp peanut butter', '1 tsp butter']
    steps = [
      { text: 'Place bread slices on a plate or toaster surface.', duration_minutes: 1 },
      { text: hasCheese ? 'Top with cheese and a tiny dab of butter for flavor.' : 'Spread peanut butter generously across both slices.', duration_minutes: 1 },
      { text: `Heat in your ${primaryApp} for 25–40 seconds until gooey and fragrant.`, duration_minutes: 1 },
    ]
    tip = 'Let the toast sit for 30 seconds after heating so the base firms up!'
  } else if (hasRamen && hasKimchi) {
    title = `${primaryApp} Spicy Kimchi Upgraded Ramen`
    ingList = ['1 pack instant ramen', '1/3 cup kimchi with juice', hasEgg ? '1 fresh egg' : '1 slice cheese']
    steps = [
      { text: `Boil water using your ${primaryApp} and prepare your ramen bowl.`, duration_minutes: 2 },
      { text: 'Add noodles, seasoning packet, and kimchi with 2 spoons of kimchi juice for deep flavor.', duration_minutes: 1 },
      { text: hasEgg ? 'Crack an egg directly on top and cover for 3 minutes to poach.' : 'Cover for 3 minutes and top with melted cheese.', duration_minutes: 3 },
    ]
    tip = 'Adding the kimchi brine directly into the broth gives it authentic restaurant-style depth without extra spices!'
  } else if (hasRice && hasEgg) {
    title = `${primaryApp} Golden Egg Fried Rice Bowl`
    ingList = ['1 cup cooked rice', '2 eggs', '1 tbsp soy sauce', hasCheese ? '1 slice cheese' : '1 tsp oil or butter']
    steps = [
      { text: 'In a heat-safe bowl, beat 2 eggs with 1 tbsp soy sauce.', duration_minutes: 1 },
      { text: 'Mix in 1 cup cooked rice until every grain is coated in egg.', duration_minutes: 1 },
      { text: `Cook in your ${primaryApp} for 2 minutes, stirring halfway through for fluffy egg grains.`, duration_minutes: 2 },
    ]
    tip = 'Coating cold leftover rice in raw egg before heating prevents it from clumping and creates perfect separate grains!'
  } else if (hasTuna && hasRice) {
    title = `${primaryApp} Savory Tuna Rice Bowl`
    ingList = ['1 cup cooked rice', '1 can drained tuna', '1 tbsp soy sauce or mayo', 'Sesame oil or pepper']
    steps = [
      { text: 'Fluff cooked rice in a bowl and flake the drained tuna across the top.', duration_minutes: 1 },
      { text: 'Drizzle with soy sauce or mayo and mix well.', duration_minutes: 1 },
      { text: `Warm in your ${primaryApp} for 60–90 seconds until heated through.`, duration_minutes: 1 },
    ]
    tip = 'A quick squeeze of calamansi or splash of vinegar cuts the richness of the tuna perfectly!'
  } else if (hasRamen && hasEgg) {
    title = `${primaryApp} Soft-Egg Upgraded Ramen`
    ingList = ['1 pack instant ramen', '1 fresh egg', '1 slice cheese or 1 tsp butter', '2 cups hot water']
    steps = [
      { text: `Heat water in your ${primaryApp} and pour over the ramen noodles.`, duration_minutes: 2 },
      { text: 'Crack the egg directly into the hot broth and cover the bowl for 3 minutes.', duration_minutes: 3 },
    ]
    tip = 'Covering the bowl with a plate traps steam and perfectly poaches the egg yolk.'
  }

  return {
    title,
    slug: `ai-${Date.now()}`,
    cook_time_minutes: 5,
    servings: 1,
    appliances: [primaryApp],
    ingredients: ingList,
    steps,
    dorm_tip: tip,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ingredients = [], appliances = [], prompt = '' } = body

    const ingredientsList = Array.isArray(ingredients) && ingredients.length > 0 ? ingredients : ['Eggs', 'Rice']
    const appliancesList = Array.isArray(appliances) && appliances.length > 0 ? appliances : ['Microwave']

    const ingredientsStr = ingredientsList.join(', ')
    const appliancesStr = appliancesList.join(', ')

    const inputContext = prompt
      ? `Student Request: "${prompt}". Ingredients selected: [${ingredientsStr}]. Available appliances: [${appliancesStr}].`
      : `Ingredients on hand: [${ingredientsStr}]. Available appliances: [${appliancesStr}]. Create a fast, delicious dorm meal strictly based on these items!`

    const systemPrompt = `You are Chef Dormosaur, an expert culinary assistant specialized in creating ultra-fast, delicious, creative dorm recipes for college students with minimal equipment.

MANDATORY INGREDIENT & APPLIANCE RULES:
1. STRICT INGREDIENT MATCHING: The generated recipe MUST prominently and primarily use the student's selected ingredients: [${ingredientsStr}].
   - If the student selects Tuna + Eggs + Microwave, generate a dish like Microwave Tuna Egg Scramble, Cheesy Tuna Mug Frittata, or Tuna Egg Salad — NEVER default to ramen or rice unless ramen/rice was explicitly selected!
   - If the student selects Bread + Cheese, generate a melted cheese toast or grilled cheese variant — NEVER generate ramen or rice.
   - You may only include 1-2 standard basic pantry staples (e.g. pinch of salt, pepper, cooking oil, soy sauce, water, mayo) if necessary.
2. STRICT APPLIANCE ENFORCEMENT: Only use appliances from: [${appliancesStr}]. NEVER use an oven, stovetop burner, or blender if not listed.
3. SPEED: Cook time must be 3 to 12 minutes.
4. Output schema: Return ONLY a valid JSON object matching:
{
  "title": "Dish Name",
  "cook_time_minutes": number,
  "servings": number,
  "appliances": string[],
  "ingredients": string[],
  "steps": [{"text": string, "duration_minutes": number}],
  "dorm_tip": string
}`

    // 1. Call Groq Llama 3 with sub-second models (Llama 3.1 8B first, 70B fallback)
    if (groq) {
      const modelsToTry = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']
      for (const modelName of modelsToTry) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: inputContext },
            ],
            model: modelName,
            response_format: { type: 'json_object' },
            temperature: 0.6,
            max_tokens: 500,
          })

          const rawContent = completion.choices[0]?.message?.content || '{}'
          const recipeData = JSON.parse(rawContent)
          if (recipeData && recipeData.title && Array.isArray(recipeData.steps)) {
            recipeData.slug = `ai-${Date.now()}`
            if (!Array.isArray(recipeData.appliances) || recipeData.appliances.length === 0) {
              recipeData.appliances = appliancesList.slice(0, 1)
            }
            return NextResponse.json({
              recipe: recipeData,
              source: `groq/${modelName}`,
            })
          }
        } catch (groqErr: any) {
          console.warn(`[Recipe Generate API] Groq model ${modelName} notice:`, groqErr?.message || groqErr)
        }
      }
    }

    // 2. Dynamic Algorithmic Fallback Generator (matched to exact inputs)
    const fallbackRecipe = generateDynamicFallbackRecipe(ingredientsList, appliancesList, prompt)
    return NextResponse.json({
      recipe: fallbackRecipe,
      source: 'dormosaur/dynamic-fallback-engine',
    })
  } catch (error) {
    console.error('AI Recipe Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}

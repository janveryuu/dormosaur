export type SafeRecipe = {
  title: string; slug: string; cook_time_minutes: number; servings: number;
  appliances: string[]; ingredients: string[]; steps: { text: string; duration_minutes: number }[]; dorm_tip: string;
}
export const applianceName = (s: string) => s.toLowerCase().replace(/[ _-]/g, '').replace('electric', '')
function ingredientWords(s: string) {
  return s.toLowerCase().replace(/\b(\d+(?:\/\d+)?|cups?|tbsp|tsp|slices?|cans?|fresh|drained|canned|cooked|instant|of|a|an)\b/g, '')
    .replace(/eggs?/g, 'egg').replace(/noodles?|ramen/g, 'ramen').replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean)
}
export function validateRecipe(value: unknown, ingredients: string[], appliances: string[]): SafeRecipe | null {
  if (!value || typeof value !== 'object') return null
  const r = value as Record<string, unknown>
  const strings = (v: unknown, limit: number) => Array.isArray(v) && v.length > 0 && v.length <= limit && v.every(s => typeof s === 'string' && s.length > 0 && s.length <= 500)
  if (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 120 || typeof r.dorm_tip !== 'string' || r.dorm_tip.length > 600 ||
    !strings(r.ingredients, 25) || !Array.isArray(r.appliances) || r.appliances.length > 4 ||
    !Array.isArray(r.steps) || !r.steps.length || r.steps.length > 15 ||
    typeof r.cook_time_minutes !== 'number' || !Number.isFinite(r.cook_time_minutes) || r.cook_time_minutes < 1 || r.cook_time_minutes > 60 ||
    typeof r.servings !== 'number' || !Number.isInteger(r.servings) || r.servings < 1 || r.servings > 8) return null
  const equipment = new Set(appliances.map(applianceName))
  if (r.appliances.some(a => typeof a !== 'string' || !equipment.has(applianceName(a)))) return null
  const allowedWords = new Set(ingredients.flatMap(ingredientWords).concat('water'))
  if ((r.ingredients as string[]).some(i => ingredientWords(i).some(word => !allowedWords.has(word)))) return null
  if (r.steps.some(s => !s || typeof s.text !== 'string' || !s.text.trim() || s.text.length > 1000 || typeof s.duration_minutes !== 'number' || !Number.isFinite(s.duration_minutes) || s.duration_minutes < 0 || s.duration_minutes > 60)) return null
  const prepared = /\b(?:cooked|canned|luncheon)\b/i
  if ((r.ingredients as string[]).some(i => /chicken|pork|beef|ground meat/i.test(i) &&
    (!prepared.test(i) || !ingredients.some(selected => prepared.test(selected) && ingredientWords(i).every(word => ingredientWords(selected).includes(word)))))) return null
  if ((r.ingredients as string[]).some(i => /\bcooked rice\b/i.test(i)) && !ingredients.some(i => /\bcooked rice\b/i.test(i))) return null
  const steps = r.steps as SafeRecipe['steps']
  const instructions = steps.map(s => s.text).join(' ').toLowerCase()
  const mentionedIngredients = ingredientWords(instructions)
  if (['butter', 'salt', 'pepper', 'oil', 'milk', 'flour', 'sugar', 'egg', 'rice', 'bread', 'cheese', 'peanut', 'tuna', 'kimchi', 'ramen', 'chicken', 'pork', 'beef']
    .some(word => mentionedIngredients.includes(word) && !allowedWords.has(word))) return null
  for (const [pattern, appliance] of [[/\bmicrowave\b/, 'microwave'], [/\bkettle\b/, 'kettle'], [/\brice cooker\b/, 'ricecooker'], [/\bpan\b|stovetop|induction/, 'inductionburner']] as const) {
    if (pattern.test(instructions) && !equipment.has(appliance)) return null
  }
  if (/\boven\b|\btoaster\b|\bblender\b/.test(instructions)) return null
  if (ingredients.some(i => /egg/i.test(i)) && (r.ingredients as string[]).some(i => /egg/i.test(i))) {
    if (!equipment.has('microwave') && !equipment.has('ricecooker') && !equipment.has('inductionburner')) return null
    if (!/71\s*°?c|160\s*°?f/.test(instructions) || !/fully set|firm|no liquid/.test(instructions)) return null
    if (/microwave/.test(instructions) && !/beat|whisk/.test(instructions)) return null
  }
  return { title: r.title.trim(), slug: crypto.randomUUID(), cook_time_minutes: r.cook_time_minutes, servings: r.servings,
    appliances: r.appliances as string[], ingredients: r.ingredients as string[], steps, dorm_tip: r.dorm_tip }
}
export function fallbackRecipe(ingredients: string[], appliances: string[]): SafeRecipe | null {
  const find = (re: RegExp) => ingredients.find(i => re.test(i))
  const egg = find(/\beggs?\b/i), bread = find(/bread/i), cheese = find(/cheese/i), pb = find(/peanut butter/i), ramen = find(/ramen|noodle/i)
  const microwave = appliances.find(a => applianceName(a) === 'microwave')
  const induction = appliances.find(a => applianceName(a) === 'inductionburner')
  const cooker = appliances.find(a => applianceName(a) === 'ricecooker')
  const kettle = appliances.find(a => applianceName(a) === 'kettle')
  let value: Omit<SafeRecipe, 'slug'> | null = null
  if (egg) {
    const appliance = microwave || induction || cooker
    if (!appliance) return null
    const extras = ingredients.filter(i => /cheese|canned tuna/i.test(i))
    const technique = microwave
      ? 'Use a microwave-safe bowl with a vented cover. Microwave in 30-second bursts, stirring between bursts. Never microwave eggs in their shells or in a sealed container.'
      : induction ? 'Cook in a suitable pan on the induction burner over medium heat, stirring continuously.' : 'Use the rice cooker only if its manufacturer permits cooking eggs; otherwise choose another recipe. Follow its cooking instructions, stirring as permitted.'
    value = { title: `${appliance} Scrambled Eggs`, cook_time_minutes: 8, servings: 1, appliances: [appliance], ingredients: [egg, ...extras],
      steps: [{ text: `Crack the eggs into a clean bowl and beat thoroughly${extras.length ? `, then stir in ${extras.join(' and ')}` : ''}.`, duration_minutes: 1 },
        { text: technique, duration_minutes: 3 }, { text: 'Continue cooking until the eggs are fully set with no liquid egg remaining. Check the center reaches 71°C (160°F) with a food thermometer; cooking time varies with equipment. Let stand before eating.', duration_minutes: 3 }],
      dorm_tip: 'Wash hands and utensils after handling raw eggs. Skip raw rice; cook it separately according to its package instructions.' }
  } else if (bread && (cheese || pb)) {
    const filling = cheese || pb!
    value = { title: cheese && microwave ? 'Microwave Cheese Bread' : `${filling} Sandwich`, cook_time_minutes: 3, servings: 1,
      appliances: cheese && microwave ? [microwave] : [], ingredients: [bread, filling],
      steps: [{ text: `Place ${filling} between the bread slices on a clean plate.`, duration_minutes: 1 },
        { text: cheese && microwave ? 'Use a microwave-safe plate and microwave in short bursts until the cheese melts. Let cool before eating.' : 'Serve without heating. Follow storage and use-by instructions on the packaging.', duration_minutes: 1 }], dorm_tip: 'No butter or extra ingredients are needed.' }
  } else if (ramen && (kettle || microwave || induction)) {
    const appliance = kettle || microwave || induction!
    value = { title: 'Dorm Instant Noodles', cook_time_minutes: 8, servings: 1, appliances: [appliance], ingredients: [ramen, 'Water'],
      steps: [{ text: `Prepare the noodles with water according to the package directions using your ${appliance}. ${kettle && appliance === kettle ? 'A kettle heats water only; put the noodles in a separate heat-safe bowl.' : microwave && appliance === microwave ? 'Use a microwave-safe bowl.' : 'Use a suitable pan on the induction burner.'}`, duration_minutes: 5 },
        { text: 'Let cool briefly before eating. Use only the ingredients in the selected noodle package.', duration_minutes: 1 }], dorm_tip: kettle && appliance === kettle ? 'Keep the kettle clean and do not put food inside it.' : 'Follow the noodle package instructions and use heat-safe utensils.' }
  }
  return value ? validateRecipe(value, ingredients, appliances) : null
}

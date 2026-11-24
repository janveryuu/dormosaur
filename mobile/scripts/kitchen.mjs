import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const app = fileURLToPath(new URL('../', import.meta.url))
const data = join(app, 'data/kitchen/recipes')
const images = join(app, 'assets/kitchen')
const output = join(app, 'src/lib/recipes.generated.ts')
const target = 200
const assetLimit = 90 * 1024
const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink', 'Dessert']
const appliances = ['Microwave', 'Rice cooker', 'Kettle', 'Hot plate', 'No cook']
const units = ['g', 'ml', 'pc', 'tsp', 'tbsp', 'cup', 'pinch', 'pack', 'can']
const aisles = ['Produce', 'Protein', 'Dairy & eggs', 'Grains & bread', 'Pantry']
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const photoStyle = 'Photorealistic commercial cookbook photography for a Philippine student recipe app. Simple ivory ceramic bowl or plate as appropriate, warm light oak table, diffused left window daylight, 45-degree overhead angle, delicious realistic textures and modest accessible portions, natural warm color, centered dish with all food in the central 70 percent. Compose for a 5:4 landscape crop. No people, packaging, captions, text, watermarks or graphic elements. One single photo. Dish: '
const isText = value => typeof value === 'string' && Boolean(value.trim())
const regularTitle = title => title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '')

const dataFiles = async () => (await readdir(data)).filter(name => name.endsWith('.json')).sort((a, b) => a === 'originals.json' ? -1 : b === 'originals.json' ? 1 : a.localeCompare(b))

async function load() {
  const files = await dataFiles()
  const batches = await Promise.all(files.map(async name => {
    const contents = JSON.parse(await readFile(join(data, name), 'utf8'))
    return Array.isArray(contents) ? contents : [contents]
  }))
  return batches.flat()
}

function validate(recipes, min = 1) {
  const seen = new Set()
  const titles = new Set()
  const ingredients = new Map()
  const errors = []
  if (recipes.length < min) errors.push(`Expected at least ${min} recipes, found ${recipes.length}`)

  for (const recipe of recipes) {
    const { slug, title, meal, mealTypes, appliance, servings, costPHP, blurb, photo, allergens, searchTerms, steps } = recipe
    const error = message => errors.push(`${slug || '(missing slug)'}: ${message}`)
    if (!slugPattern.test(slug ?? '') || seen.has(slug)) error('Invalid or duplicate slug')
    seen.add(slug)
    if (!isText(title) || titles.has(regularTitle(title))) error('Invalid or duplicate title')
    if (isText(title)) titles.add(regularTitle(title))
    if (!meals.includes(meal) || (mealTypes && !mealTypes.every(type => meals.includes(type)))) error('Invalid meal')
    if (!appliances.includes(appliance)) error('Invalid appliance')
    if (!Number.isInteger(servings) || servings < 1 || servings > 4) error('Invalid serving count')
    if (!Number.isInteger(costPHP) || costPHP < 1 || costPHP > 150) error('Cost must be ₱1–150 per serving')
    if (!isText(blurb) || !isText(photo)) error('Missing description or photo prompt')
    if (recipe.tip !== undefined && !isText(recipe.tip)) error('Invalid tip')
    if (recipe.addedOn !== undefined && !/^\d{4}-\d{2}-\d{2}T/.test(recipe.addedOn)) error('Invalid publication date')
    if (!Array.isArray(allergens) || !allergens.every(isText)) error('Invalid allergens')
    if (!Array.isArray(searchTerms) || !searchTerms.length || !searchTerms.every(isText)) error('Missing search terms')
    if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length) error('Missing ingredients')
    else for (const item of recipe.ingredients) {
      const { name, amount, unit, aisle } = item
      if (!isText(name) || name !== name.toLowerCase().trim() || !Number.isFinite(amount) || amount <= 0 || !units.includes(unit) || !aisles.includes(aisle)) error(`Invalid ingredient ${name}`)
      if (ingredients.has(name) && ingredients.get(name) !== aisle) error(`Conflicting aisle for ${name}`)
      ingredients.set(name, aisle)
    }
    if (!Array.isArray(steps) || !steps.length) error('Missing steps')
    else for (const { text, minutes, phase, timer } of steps) {
      if (!isText(text) || !Number.isInteger(minutes) || minutes < 1 || minutes > 1440 || !['prep', 'cook', 'rest'].includes(phase) || (timer !== undefined && timer !== true)) error('Invalid timed step')
      if (appliance === 'No cook' && phase === 'cook') error('No-cook recipe has a cooking step')
    }
  }
  if (errors.length) throw Error(errors.join('\n'))
}

async function optimize(slug, source) {
  if (!slugPattern.test(slug || '') || !source) throw Error('Supply a valid recipe slug and a source image path')
  await savePhoto(slug, await encodePhoto(slug, source))
}

async function encodePhoto(slug, source) {
  const frame = sharp(source).autoOrient().resize(1080, 864, { fit: 'cover' })
  for (const quality of [82, 78, 74, 70, 65, 60, 55, 49, 43]) {
    const buffer = await frame.clone().webp({ quality, effort: 5 }).toBuffer()
    if (buffer.length <= assetLimit) return buffer
  }
  throw Error(`${slug}: could not fit the image in ${assetLimit} bytes`)
}

async function savePhoto(slug, buffer) {
  await mkdir(images, { recursive: true })
  const path = join(images, `${slug}.webp`)
  await writeFile(`${path}.tmp`, buffer)
  await rename(`${path}.tmp`, path)
}

const imageHash = buffer => createHash('sha256').update(buffer).digest('hex')
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

async function assets(recipes) {
  const seen = new Map()
  const results = []
  for (const { slug } of recipes) {
    const buffer = await readFile(join(images, `${slug}.webp`))
    const hash = imageHash(buffer)
    if (seen.has(hash)) throw Error(`${slug}: same image as ${seen.get(hash)}`)
    seen.set(hash, slug)
    const picture = sharp(buffer)
    const { width, height, format } = await picture.metadata()
    if (width !== 1080 || height !== 864 || format !== 'webp' || buffer.length > assetLimit) throw Error(`${slug}: unexpected image dimensions, format or size`)
    const placeholder = await picture.resize(12, 10).jpeg({ quality: 35 }).toBuffer()
    results.push({ slug, hash, bytes: buffer.length, placeholder: `data:image/jpeg;base64,${placeholder.toString('base64')}` })
  }
  return results
}

async function buildCatalog(check) {
  const recipes = await load()
  validate(recipes, target)
  const pictures = await assets(recipes)
  const rows = pictures.map(({ slug, placeholder }) => `  '${slug}': [require('../../assets/kitchen/${slug}.webp'), '${placeholder}'],`)
  const files = (await dataFiles()).map((name, index) => ({ name, binding: `batch${index}` }))
  const imports = files.map(({ name, binding }) => `import ${binding} from '../../data/kitchen/recipes/${name}'`)
  const source = files.map(({ binding }) => `...[ ${binding} ].flat()`)
  const doc = `// Generated by npm run kitchen:build.\n// The static image imports let Metro include every photo in the app.\n${imports.join('\n')}\n\nexport const recipeData = [${source.join(', ')}]\n\nexport const recipeImages: Record<string, [number, string]> = {\n${rows.join('\n')}\n}\n`
  if (check) {
    if ((await readFile(output, 'utf8')).replace(/\r\n/g, '\n') !== doc) throw Error('Image manifest is stale. Run npm run kitchen:build.')
  } else {
    await writeFile(output, doc)
  }
  const bytes = pictures.reduce((total, image) => total + image.bytes, 0)
  console.log(`${recipes.length} recipes, ${pictures.length} unique WebP photos, ${(bytes / 1024 ** 2).toFixed(2)} MiB`)
}

async function main() {
  const [action, slug, input] = process.argv.slice(2)
  if (action === 'optimize') return optimize(slug, input)
  if (action === 'optimize-manifest') {
    const entries = JSON.parse(await readFile(slug, 'utf8'))
    for (const [id, source] of entries) await optimize(id, source)
    return
  }
  if (action === 'validate') {
    const recipes = await load()
    validate(recipes, target)
    console.log(`${recipes.length} recipes passed data validation`)
    return
  }
  if (action === 'build' || action === 'check') return buildCatalog(action === 'check')
  if (action === 'prompt') {
    if (!slug) throw Error('Supply a recipe slug or a recipe JSON file')
    const recipe = slug.endsWith('.json')
      ? JSON.parse(await readFile(slug, 'utf8'))
      : (await load()).find(item => item.slug === slug)
    if (!recipe) throw Error(`Unknown recipe ${slug}`)
    console.log(/^(?:Photorealistic commercial|Generate one photorealistic)/.test(recipe.photo) ? recipe.photo : `${photoStyle}${recipe.photo}`)
    return
  }
  if (action === 'add') {
    if (!slug || !input) throw Error('Supply a recipe JSON file and a source image path')
    const recipe = JSON.parse(await readFile(slug, 'utf8'))
    recipe.addedOn = new Date().toISOString()
    const existing = await load()
    validate([...existing, recipe], target + 1)
    const pictures = await assets(existing)
    const buffer = await encodePhoto(recipe.slug, input)
    const hash = imageHash(buffer)
    const duplicate = pictures.find(picture => picture.hash === hash)
    if (duplicate) throw Error(`${recipe.slug}: same image as ${duplicate.slug}`)
    await savePhoto(recipe.slug, buffer)
    await writeFile(join(data, `${recipe.slug}.json`), `${JSON.stringify(recipe, null, 2)}\n`, { flag: 'wx' })
    return buildCatalog(false)
  }
  if (action === 'contact-sheet') {
    const recipes = await load()
    const pictures = await assets(recipes)
    const figures = await Promise.all(pictures.map(async ({ slug }, index) => {
      const { title } = recipes[index]
      const image = await sharp(join(images, `${slug}.webp`)).resize(340, 272).webp({ quality: 70 }).toBuffer()
      return `<figure><img src="data:image/webp;base64,${image.toString('base64')}" width="340" height="272" loading="lazy" alt=""><figcaption>${escapeHtml(title)}<small>${slug}</small></figcaption></figure>`
    }))
    await writeFile(slug, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Kitchen photos</title><style>body{font:16px system-ui;margin:26px;background:#f6f2ea;color:#23251d}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:16px}figure{margin:0;background:white;border-radius:12px;overflow:hidden}img{width:100%;height:auto;display:block}figcaption{padding:12px}small{display:block;color:#575f50;margin-top:3px;overflow-wrap:anywhere}</style><h1>Kitchen photos</h1><main>${figures.join('\n')}</main></html>`)
    return
  }
  throw Error('Use build, check, validate, optimize, prompt, add, or contact-sheet')
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})

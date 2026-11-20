import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'
function load(file) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, { exports })
  return exports
}
const registry = load('lib/template-registry.ts')
const utils = load('lib/wallpaper-schedule-utils.ts')
const hashes = {
  'ultra-pink': '94cd7fab03b5fe8d6fe0bdb06a0add787cff42ad89527e7536731806f4acab9a',
  'pink-notebook': 'e1086c2a91b527dd2e2aefb98da8b362ecaed54645595af167c9daf3b5b08f26',
  'cute-cat-blue': 'ddfc266692fabe42c1b313f5bf09cca723496fd333e9cb9bf41708ce6ffdeb5b',
  'ocean-party': '91356fa737f5e8777c87298385137db7d43cbfa26c4817299940b2ce82c0ed80',
  'sage-green': '9f5be4f8f883b050e59aaddb94cd1fab5e92dedc873ea411846895b56776b964',
  'forest-whimsy': '5b21a6ba256e989e1b2d39881741fde44e4be60b4b441fef7c9f3b04e9330e85',
  'dormosaur-adventure': 'fac666b035f4ca5ad1ecdc9b9bf66fd615ff48ed5af5f8c2f945ab7f49504e00',
  'dormosaur-night-mode': 'e1086c2a91b527dd2e2aefb98da8b362ecaed54645595af167c9daf3b5b08f26',
}
assert.deepEqual([...registry.SCHEDULE_TEMPLATES.map((entry) => entry.id)], Object.keys(hashes))
for (const entry of registry.SCHEDULE_TEMPLATES) {
  assert.equal(createHash('sha256').update(readFileSync(`public${entry.imagePath}`)).digest('hex'), hashes[entry.id], `${entry.id}: approved asset must stay byte-identical`)
  assert.ok(existsSync(`public${entry.thumbnailPath}`))
  assert.ok(statSync(`public${entry.thumbnailPath}`).size < 200000, 'Thumbnails must not load full-resolution images')
}
assert.equal(registry.getTemplateById('simple-modern').id, 'sage-green')
assert.equal(registry.getTemplateById('dormosaur-classic').id, 'dormosaur-adventure')
for (const id of [undefined, 'unknown', null]) assert.equal(registry.getTemplateById(id).id, 'dormosaur-adventure')
assert.equal(registry.ARTBOARD_SIZES.phone.width / registry.ARTBOARD_SIZES.phone.height, 9 / 16)
assert.equal(utils.wallpaperMinutes('05:00'), 300, 'Stored 24-hour times must not gain an invented PM suffix')
assert.equal(utils.wallpaperTime('00:30'), '12:30 AM')
const entry = { id: 'fixture', code: 'CPE 414', subject: 'Test only', days: ['Mon', 'Monday', 'Sat', 'Sun'], start: '05:00', end: '06:00' }
const grouped = utils.groupWallpaperClasses([entry])
assert.equal(grouped.Mon.length, 1)
assert.equal(grouped.Sat.length, 1)
assert.equal(grouped.Sun.length, 1)
assert.equal(grouped.Tue.length, 0)
assert.equal(utils.wallpaperCourse(entry), 'CPE 414')
assert.equal(utils.groupWallpaperClasses([]).Mon.length, 0)
console.log('PASS: eight approved assets, small matching thumbnails, legacy fallback, 9:16 artboard, real course codes, early times and weekends')

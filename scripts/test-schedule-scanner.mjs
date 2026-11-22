import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadTs(path, overrides = {}, globals = {}) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(code, {
    exports, require: (name) => overrides[name] ?? require(name),
    process, console, Buffer, URL, Uint8Array, setTimeout, clearTimeout, ...globals,
  }, { filename: path })
  return exports
}

let canvasCalls = 0
const imageUtils = loadTs('lib/image-utils.ts', {}, {
  window: {},
  FileReader: class { readAsDataURL(file) { this.onload({ target: { result: file.dataUrl } }) } },
  Image: class {
    width = 3000
    height = 1600
    set src(value) { this.onload() }
  },
  document: { createElement: () => {
    canvasCalls++
    return {
      getContext: () => ({ fillRect() {}, drawImage() {} }),
      toDataURL: () => 'data:image/jpeg;base64,changed',
    }
  } },
})
const original = 'data:image/png;base64,aGVsbG8='
assert.equal(await imageUtils.compressImageForOcr(original), original,
  'A reasonable 3000px PNG must reach Gemini unchanged')
assert.equal(canvasCalls, 0, 'Screenshots must not be unnecessarily re-encoded')
assert.equal(await imageUtils.compressImageForOcr({ dataUrl: original }), original)
console.log('PASS: original high-resolution PNG preserved')

const tinyPng = 'data:image/png;base64,' + Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')
const tinyJpg = 'data:image/jpeg;base64,' + Buffer.from([255, 216, 255, 224]).toString('base64')
const tinyPdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n').toString('base64')
assert.equal(await imageUtils.compressImageForOcr(tinyJpg), tinyJpg)
assert.equal(await imageUtils.compressImageForOcr(tinyPdf), tinyPdf)
console.log('PASS: JPG and PDF preserved')

let encodedFormat
let encodedQuality
let resizedCanvas
const oversizedUtils = loadTs('lib/image-utils.ts', {}, {
  window: {},
  Image: class { width = 6000; height = 4000; set src(value) { this.onload() } },
  document: { createElement: () => resizedCanvas = {
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toDataURL: (format, quality) => {
      encodedFormat = format
      encodedQuality = quality
      return `data:${format};base64,c21hbGw=`
    },
  } },
})
assert.equal(await oversizedUtils.compressImageForOcr(tinyPng), tinyPng,
  'Even a 6000px screenshot stays original if its file fits the upload budget')
const largePixels = 'A'.repeat(4 * 1024 * 1024 + 100)
await oversizedUtils.compressImageForOcr(tinyPng + largePixels)
assert.equal(resizedCanvas.width, 3200)
assert.equal(resizedCanvas.height, 2133)
assert.equal(encodedFormat, 'image/png')
await oversizedUtils.compressImageForOcr(tinyJpg + largePixels)
assert.equal(encodedFormat, 'image/jpeg')
assert.equal(encodedQuality, 0.95)
console.log('PASS: oversized screenshots stay PNG; camera/JPG use 3200px and 0.95')

// Scanner behaviour (grid resolver, PDF text layer, text fast path, AI fallback,
// deadlines) is covered by tests/scanner.test.ts; accuracy by scripts/eval-scanner.ts.

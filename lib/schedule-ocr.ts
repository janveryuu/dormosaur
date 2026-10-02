import { createRequire } from 'node:module'
import path from 'node:path'
import { createWorker, OEM, PSM, type Worker } from 'tesseract.js'
import sharp from 'sharp'
import { renderSchedulePdf } from '@/lib/schedule-pdf'

const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'))

export type ScheduleOcrWord = {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

type Pixels = { data: Buffer; width: number; height: number }
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeRange = /\b(\d{1,2}:\d{2}\s*(?:[ap]m)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:[ap]m)?)\b/i
const courseCode = /\b(?!ROOM\b|RM\b|LAB\b|HALL\b|BSU\b)([a-z]{2,8})\s*[-_]?\s*(\d{2,4}[a-z]?)\b/i
const centerY = (word: ScheduleOcrWord) => (word.bbox.y0 + word.bbox.y1) / 2

function groupLines(words: ScheduleOcrWord[]): ScheduleOcrWord[][] {
  const rows: ScheduleOcrWord[][] = []
  for (const word of [...words].sort((a, b) => centerY(a) - centerY(b))) {
    const last = rows[rows.length - 1]
    const tolerance = Math.max(4, (word.bbox.y1 - word.bbox.y0) * 0.65)
    if (last && Math.abs(centerY(last[0]) - centerY(word)) < tolerance) last.push(word)
    else rows.push([word])
  }
  return rows.map((row) => row.sort((a, b) => a.bbox.x0 - b.bbox.x0))
}

/** Recover weekday/time relationships that plain OCR text loses in a grid. */
export function gridMeetingText(words: ScheduleOcrWord[], pixels?: Pixels): { text: string; uncertainTimes: boolean } {
  const rows = groupLines(words)
  const headerRow = rows.find((row) => row.filter((word) => /^(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\.?$/i.test(word.text)).length >= 2)
  if (!headerRow) return { text: '', uncertainTimes: false }
  const headers = headerRow.flatMap((word) => {
    const name = weekdays.find((day) => word.text.slice(0, 3).toLowerCase() === day.toLowerCase())
    return name ? [{ name, x: (word.bbox.x0 + word.bbox.x1) / 2, word }] : []
  }).sort((a, b) => a.x - b.x)
  const axis = rows.flatMap((row) => {
    const left = row.filter((word) => word.bbox.x0 < headers[0].word.bbox.x0)
    const text = left.map((word) => word.text).join(' ').replace(/\s*:\s*/g, ':')
    const match = text.match(timeRange)
    return match ? [{ y: centerY(left[0]), range: `${match[1]}-${match[2]}` }] : []
  }).sort((a, b) => a.y - b.y)
  if (axis.length < 2) return { text: '', uncertainTimes: false }
  const steps = axis.slice(1).map((row, index) => row.y - axis[index].y).sort((a, b) => a - b)
  const rowHeight = steps[Math.floor(steps.length / 2)]
  const meetings: string[] = []
  let uncertainTimes = false
  for (let dayIndex = 0; dayIndex < headers.length; dayIndex++) {
    const day = headers[dayIndex]
    const left = dayIndex ? (headers[dayIndex - 1].x + day.x) / 2 : day.x - (headers[1].x - day.x) / 2
    const right = dayIndex + 1 < headers.length ? (day.x + headers[dayIndex + 1].x) / 2 : day.x + (day.x - headers[dayIndex - 1].x) / 2
    for (const row of rows) {
      const cell = row.filter((word) => word.bbox.x0 >= left && word.bbox.x0 < right && centerY(word) > centerY(day.word))
      const text = cell.map((word) => word.text).join(' ')
      const code = text.match(courseCode)
      if (!code) continue
      const codeText = `${code[1]} ${code[2]}`
      const explicit = text.match(timeRange)
      if (explicit) {
        meetings.push(`${codeText} ${day.name} ${explicit[1]}-${explicit[2]}`)
        continue
      }
      const label = cell.find((word) => /[a-z]/i.test(word.text))!
      const y = centerY(label)
      const nearest = axis.reduce((best, row) => Math.abs(row.y - y) < Math.abs(best.y - y) ? row : best)
      if (Math.abs(nearest.y - y) > rowHeight * 0.55) continue
      let range = nearest.range
      if (pixels) {
        // Trace visible cell borders, not assumed class durations. Sample blank
        // space on both sides of the code so text glyphs cannot become borders.
        const codeEnd = cell.find((word) => /\d/.test(word.text)) || label
        const xs = [label.bbox.x0 - 10, codeEnd.bbox.x1 + 10, (label.bbox.x0 + codeEnd.bbox.x1) / 2].map(Math.round)
        const border = (scanY: number) => xs.every((x) => x >= 0 && x < pixels.width && pixels.data[scanY * pixels.width + x] < 200)
        let top = Math.floor(label.bbox.y0) - 1
        let bottom = Math.ceil(label.bbox.y1) + 1
        while (top >= Math.max(0, axis[0].y - rowHeight / 2) && !border(top)) top--
        while (bottom < Math.min(pixels.height, axis[axis.length - 1].y + rowHeight / 2) && !border(bottom)) bottom++
        const enclosed = axis.filter((row) => row.y > top && row.y < bottom)
        if (top >= 0 && bottom < pixels.height && border(top) && border(bottom) && enclosed.length) {
          range = `${enclosed[0].range.split('-')[0]}-${enclosed[enclosed.length - 1].range.split('-')[1]}`
        }
      }
      // A visible row interval is still a reviewable partial meeting. Flag its
      // time when a merged block's full extent cannot be established.
      // Grid boundaries can also belong to another overlapping class. Always
      // invite review of inferred times, even when visible borders were found.
      uncertainTimes = true
      meetings.push(`${codeText} ${day.name} ${range}`)
    }
  }
  return { text: [...new Set(meetings)].join('\n'), uncertainTimes }
}

export async function recognizeScheduleWithTesseract(dataUrl: string) {
  const source = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  let worker: Worker | undefined
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const job = async () => {
    const root = path.dirname(nodeRequire.resolve('tesseract.js/package.json'))
    const languageRoot = path.dirname(nodeRequire.resolve('@tesseract.js-data/eng/package.json'))
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: path.join(root, 'src/worker-script/node/index.js'),
      langPath: path.join(languageRoot, '4.0.0'),
      cacheMethod: 'none',
      logger: () => {},
      errorHandler: () => {},
    })
    if (timedOut) {
      await worker.terminate()
      throw new Error('OCR initialization timed out')
    }
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: '1' })
    const images = dataUrl.startsWith('data:application/pdf') ? await renderSchedulePdf(source) : [source]
    const results = []
    for (const image of images) {
      if (timedOut) throw new Error('OCR timed out')
      const normalized = await sharp(image).rotate().flatten({ background: '#fff' }).png().toBuffer()
      const { data } = await worker.recognize(normalized, { rotateAuto: true }, { text: true, blocks: true, imageColor: true })
      const words: ScheduleOcrWord[] = (data.blocks || []).flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.flatMap((line) => line.words)))
      const deskewed = data.imageColor ? Buffer.from(data.imageColor.split(',')[1], 'base64') : normalized
      const { data: pixels, info } = await sharp(deskewed).greyscale().raw().toBuffer({ resolveWithObject: true })
      const grid = gridMeetingText(words, { data: pixels, width: info.width, height: info.height })
      results.push({ text: data.text, words, meetingText: grid.text, uncertainTimes: grid.uncertainTimes })
    }
    return {
      text: results.map((result) => result.text).join('\n'),
      words: results.flatMap((result) => result.words),
      meetingText: results.map((result) => result.meetingText).join('\n'),
      uncertainTimes: results.some((result) => result.uncertainTimes),
    }
  }
  try {
    return await Promise.race([job(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => { timedOut = true; reject(new Error('OCR timed out')) }, 45000)
    })])
  } finally {
    if (timer) clearTimeout(timer)
    await worker?.terminate()
  }
}

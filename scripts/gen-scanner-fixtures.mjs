// Generates a second, differently styled timetable (merged blocks, hourly rows,
// code + room stacked in one cell) as PNG and as a digital PDF, with its answer.
import sharp from 'sharp'
import { jsPDF } from 'jspdf'
import { writeFileSync } from 'node:fs'
const out = 'tests/fixtures/scanner/'
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const classes = [
  { code: 'IT 311', room: 'CL 2', day: 'Mon', start: 8, end: 11 },
  { code: 'IT 312', room: 'RM 105', day: 'Mon', start: 13, end: 15 },
  { code: 'MATH 31', room: 'RM 210', day: 'Tue', start: 7, end: 9 },
  { code: 'IT 313', room: 'CL 1', day: 'Tue', start: 10, end: 13 },
  { code: 'IT 311', room: 'CL 2', day: 'Wed', start: 8, end: 11 },
  { code: 'GEC 7', room: 'AVR', day: 'Wed', start: 14, end: 17 },
  { code: 'MATH 31', room: 'RM 210', day: 'Thu', start: 7, end: 9 },
  { code: 'IT 314', room: 'ONLINE', day: 'Thu', start: 15, end: 18 },
  { code: 'IT 312', room: 'RM 105', day: 'Fri', start: 13, end: 15 },
  { code: 'PE 3', room: 'GYM', day: 'Sat', start: 9, end: 11 },
]
const hours = Array.from({ length: 11 }, (_, i) => 7 + i) // 7..17 → rows 7-8 … 17-18
const fmt = h => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`
const W = 1300, left = 170, top = 70, rowH = 48, colW = (W - left - 20) / days.length
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${top + rowH * hours.length + 30}"><rect width="100%" height="100%" fill="#fff"/>`
svg += `<style>text{font-family:Arial,Helvetica,sans-serif}</style>`
svg += `<text x="${left / 2}" y="${top - 25}" font-size="17" font-weight="bold" text-anchor="middle">TIME</text>`
days.forEach((d, i) => { svg += `<rect x="${left + i * colW}" y="${top - 50}" width="${colW}" height="50" fill="#1e5c40"/><text x="${left + i * colW + colW / 2}" y="${top - 19}" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">${d.toUpperCase()}</text>` })
hours.forEach((h, r) => {
  const y = top + r * rowH
  svg += `<rect x="0" y="${y}" width="${left}" height="${rowH}" fill="${r % 2 ? '#f4f6f4' : '#fff'}" stroke="#ccc"/><text x="${left / 2}" y="${y + 30}" font-size="15" text-anchor="middle">${fmt(h)} - ${fmt(h + 1)}</text>`
  days.forEach((_, i) => { svg += `<rect x="${left + i * colW}" y="${y}" width="${colW}" height="${rowH}" fill="none" stroke="#ddd"/>` })
})
for (const c of classes) {
  const i = days.indexOf(c.day), y = top + (c.start - 7) * rowH, h = (c.end - c.start) * rowH
  svg += `<rect x="${left + i * colW + 3}" y="${y + 3}" width="${colW - 6}" height="${h - 6}" rx="8" fill="#e6f0fb" stroke="#7fa4e0"/>`
  svg += `<text x="${left + i * colW + colW / 2}" y="${y + h / 2 - 4}" font-size="17" font-weight="bold" text-anchor="middle">${c.code}</text>`
  svg += `<text x="${left + i * colW + colW / 2}" y="${y + h / 2 + 18}" font-size="14" text-anchor="middle" fill="#333">${c.room}</text>`
}
svg += '</svg>'
await sharp(Buffer.from(svg)).png().toFile(out + 'merged-grid.png')
const pad = n => String(n).padStart(2, '0')
writeFileSync(out + 'merged-grid.expected.json', JSON.stringify({ note: 'Generated: merged blocks, hourly rows, code and room stacked in one cell.', meetings: classes.map(c => ({ code: c.code, day: c.day, start: `${pad(c.start)}:00`, end: `${pad(c.end)}:00`, room: c.room })) }, null, 2))
// Digital PDF of the same timetable (text layer with positions).
const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
const L = 40, T = 70, pl = 90, cw = 115, rh = 30
pdf.setFontSize(10)
pdf.text('TIME', L + 20, T - 10)
days.forEach((d, i) => pdf.text(d.toUpperCase(), L + pl + i * cw + cw / 2, T - 10, { align: 'center' }))
hours.forEach((h, r) => { pdf.rect(L, T + r * rh, pl + cw * days.length, rh); pdf.text(`${fmt(h)} - ${fmt(h + 1)}`, L + 4, T + r * rh + 18) })
for (const c of classes) {
  const i = days.indexOf(c.day)
  pdf.setFillColor(230, 240, 251)
  pdf.setDrawColor(127, 164, 224)
  pdf.roundedRect(L + pl + i * cw + 2, T + (c.start - 7) * rh + 2, cw - 4, (c.end - c.start) * rh - 4, 4, 4, 'FD')
  pdf.setDrawColor(0, 0, 0)
  pdf.text(c.code, L + pl + i * cw + cw / 2, T + (c.start - 7) * rh + 13, { align: 'center' })
  pdf.text(c.room, L + pl + i * cw + cw / 2, T + (c.start - 7) * rh + 24, { align: 'center' })
}
writeFileSync(out + 'merged-grid.ai.pdf', Buffer.from(pdf.output('arraybuffer')))
console.log('fixtures written')

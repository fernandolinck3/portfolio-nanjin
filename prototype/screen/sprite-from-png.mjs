/* Turns a drawing into one of the Screen's text sprites.
 *
 *   node prototype/screen/sprite-from-png.mjs art/bust.png --size 28x40 --write
 *
 * Draw her wherever you like and at whatever size is comfortable — this snaps the
 * image to the sprite grid, quantises it to the Screen's four tones, and prints
 * the array. `--write` splices it straight into `drawn.js`.
 *
 * The PNG itself never enters the repo (see .gitignore): the text array is the
 * committed artefact, which is what keeps ADR-0004's "no binary assets" true
 * while you still get to draw in a real tool.
 *
 * Flags
 *   --size WxH   target grid. Default 28x40, the size ADR-0013 specifies.
 *   --name NAME  which export to replace with --write. Default BUST.
 *   --trim       crop transparent margins before fitting. Use when your canvas
 *                is bigger than the drawing.
 *   --write      rewrite the export in drawn.js instead of only printing.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodePng } from './png.mjs'

const here = dirname(fileURLToPath(import.meta.url))

/* The Screen's palette (screen.js:61) as a luminance ramp. Matching on luminance
   rather than RGB distance means a drawing in any hue still lands on the right
   tone — only how light each mark is has to be right. */
const TONES = [
  { ch: '#', hex: '#E9E3D2', lum: 227.1, name: 'lit' },
  { ch: '-', hex: '#8A8470', lum: 131.8, name: 'half-light' },
  { ch: '=', hex: '#5E5A4C', lum:  89.9, name: 'shadow / hair' },
  { ch: 'o', hex: '#0A0B09', lum:  10.6, name: 'black — lashes, eyes, mouth' },
]
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const toneOf = (L) => {
  let best = TONES[0]
  for (const t of TONES) if (Math.abs(L - t.lum) < Math.abs(L - best.lum)) best = t
  return best.ch
}

const argv = process.argv.slice(2)
const file = argv.find(a => !a.startsWith('--'))
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1] }
const has = n => argv.includes('--' + n)
if (!file) {
  console.error('usage: node prototype/screen/sprite-from-png.mjs <file.png> [--size 28x40] [--name BUST] [--trim] [--write]')
  process.exit(1)
}
const [TW, TH] = (flag('size', '28x40')).split('x').map(Number)
const NAME = flag('name', 'BUST')

const img = decodePng(readFileSync(file))
const at = (x, y) => { const o = (y * img.width + x) * 4; return img.data.subarray(o, o + 4) }

/* Optional crop to what was actually drawn. */
let x0 = 0, y0 = 0, x1 = img.width - 1, y1 = img.height - 1
if (has('trim')) {
  x0 = img.width; y0 = img.height; x1 = -1; y1 = -1
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++)
    if (at(x, y)[3] >= 128) {
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  if (x1 < 0) { console.error('nothing opaque in that image — is it all transparent?'); process.exit(1) }
}
const srcW = x1 - x0 + 1, srcH = y1 - y0 + 1

/* Average each target cell over its source rectangle. Alpha is premultiplied so
   a half-covered edge does not drag the colour toward black. */
const rows = []
const histogram = {}
for (let ty = 0; ty < TH; ty++) {
  let line = ''
  for (let tx = 0; tx < TW; tx++) {
    const ax = x0 + Math.floor((tx * srcW) / TW), bx = x0 + Math.max(Math.floor(((tx + 1) * srcW) / TW), Math.floor((tx * srcW) / TW) + 1)
    const ay = y0 + Math.floor((ty * srcH) / TH), by = y0 + Math.max(Math.floor(((ty + 1) * srcH) / TH), Math.floor((ty * srcH) / TH) + 1)
    let r = 0, g = 0, b = 0, a = 0, n = 0
    for (let y = ay; y < by && y <= y1; y++) for (let x = ax; x < bx && x <= x1; x++) {
      const px = at(x, y), w = px[3] / 255
      r += px[0] * w; g += px[1] * w; b += px[2] * w; a += px[3]; n++
    }
    const alpha = n ? a / n : 0
    let ch = '.'
    if (alpha >= 128) {
      const wsum = n ? (a / 255) : 0
      ch = wsum > 0 ? toneOf(lum(r / wsum, g / wsum, b / wsum)) : 'o'
    }
    histogram[ch] = (histogram[ch] || 0) + 1
    line += ch
  }
  rows.push(line)
}

/* ---- report ---- */
const BLOCK = { '.': '  ', '#': '██', '-': '▒▒', '=': '░░', 'o': '▓▓' }
console.log(`\n  ${file} — ${img.width}x${img.height}` + (has('trim') ? ` → cropped ${srcW}x${srcH}` : '') +
            ` → ${TW}x${TH} (${(srcW / TW).toFixed(1)}x${(srcH / TH).toFixed(1)} px per cell)\n`)
rows.forEach((r, i) => console.log('  ' + String(i).padStart(2) + ' ' + [...r].map(c => BLOCK[c]).join('')))
console.log('\n  tones used:')
for (const t of TONES)
  console.log(`    ${t.ch}  ${t.hex}  ${String(histogram[t.ch] || 0).padStart(4)} px   ${t.name}`)
console.log(`    .  transparent  ${String(histogram['.'] || 0).padStart(4)} px`)

/* Her on-screen size is derived from the sprite's height, so changing it silently
   resizes her. Say so rather than letting it be discovered later. */
const STAGE_H = [92, 66, 86, 86, 86, 92]
const MODULES = ['Ident', 'Now/Next', 'Proj 001', 'Rack', 'Method', 'Out']
const scaleAt = (fh, h) => Math.max(1, Math.round((fh * 0.58) / h))
console.log('\n  on-screen scale per Module (spriteBox: fh * .58 / height):')
let shrunk = false
for (let i = 0; i < 6; i++) {
  const now = scaleAt(STAGE_H[i], TH), was = scaleAt(STAGE_H[i], 32)
  if (now < was) shrunk = true
  console.log(`    ${MODULES[i].padEnd(9)} ${now}x` + (now === was ? '' : `   (was ${was}x at height 32)`))
}
if (shrunk)
  console.log(`\n  ⚠  She gets SMALLER at this height. To keep her size, raise the .58 in\n     spriteBox() (screen.js) to about ${(0.58 * TH / 32).toFixed(2)}.`)

const body = rows.map(r => `  '${r}',`).join('\n')
if (has('write')) {
  const p = resolve(here, 'drawn.js')
  const src = readFileSync(p, 'utf8')
  const re = new RegExp(`(export const ${NAME} = \\[\\n)[\\s\\S]*?(\\n\\])`)
  if (!re.test(src)) { console.error(`\n  could not find "export const ${NAME} = [" in drawn.js`); process.exit(1) }
  writeFileSync(p, src.replace(re, `$1${body}$2`))
  console.log(`\n  wrote ${NAME} into drawn.js — rebuild or reload the workbench to see her.`)
} else {
  console.log(`\nexport const ${NAME} = [\n${body}\n]\n\n  (add --write to put this into drawn.js)`)
}

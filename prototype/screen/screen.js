/* Screen design workbench.
   Three directions for the Unit's Screen, drawn from the `display` are.na board,
   rendered at the internal resolution the real Screen would use (320x180) and
   shown twice: at 3x so the design can be judged, and at 1x so it can be judged
   the way a visitor actually meets it — a ~300px inset on the Plate.

   Everything reads the real content source. No lorem. */
import { MODULES } from '../../src/content/modules.ts'

const W = 320, H = 180
const buf = document.createElement('canvas'); buf.width = W; buf.height = H
const g = buf.getContext('2d')
const big = document.getElementById('big').getContext('2d')
const real = document.getElementById('real').getContext('2d')
big.imageSmoothingEnabled = real.imageSmoothingEnabled = false

let dir = 'grimoire', mod = 0, xf = 0.18, switchedAt = performance.now()

/* ---------- helpers ---------- */

/** Bayer 4x4. Ordered dither is what makes 1-bit art read as shading. */
const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
function dither(x, y, level) { return level * 16 > BAYER[y & 3][x & 3] }

/** Fill a rect with an ordered-dither tone. level 0..1. */
function tone(x, y, w, h, level, colour) {
  g.fillStyle = colour
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (dither(x + i, y + j, level)) g.fillRect(x + i, y + j, 1, 1)
}

/** Break a line that was written for a 52-char Screen into lines that fit `max` px. */
function wrap(text, max) {
  const out = [], words = text.split(' ')
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (g.measureText(t).width > max && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

function lines(m) {
  if (m.kind === 'prose') return m.lines
  if (m.kind === 'thesis') return (xf > .5 ? m.b : m.a).lines
  return []
}

/** How many characters of the current face fit across the body. The budget question. */
function charsAcross(width) { return Math.floor(width / g.measureText('n').width) }

const since = () => (performance.now() - switchedAt) / 1000

/* ================= A. GRIMOIRE =================
   1-bit, dithered, ornamental frame drawn in pixels. Refs 00, 25, 26, 15, 21, 04.
   Alive: torchlight breathes across the field, the text types itself on when the
   Module changes, and a block cursor blinks at the end of it. */

const INK = '#E9E3D2', BG = '#0A0B09'

/** A pixel ornament in the corner — the Plate's foliate engraving at 1-bit. */
function corner(cx, cy, sx, sy) {
  const px = (x, y) => g.fillRect(cx + x * sx, cy + y * sy, 1, 1)
  g.fillStyle = INK
  const pts = [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[2,2],[3,2],[2,3],
               [5,0],[6,0],[0,5],[0,6],[4,4],[5,4],[4,5],[7,1],[1,7],[6,3],[3,6]]
  for (const [x, y] of pts) px(x, y)
}

function grimoire(m, t) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H)

  /* torchlight: the whole field breathes, unevenly, like two candles */
  const flick = .5 + .5 * Math.sin(t * 1.7) * Math.sin(t * .9 + 1.3)
  tone(6, 6, W - 12, H - 12, .06 + flick * .05, '#1C2018')

  /* frame: double rule with pixel corners */
  g.fillStyle = INK
  g.fillRect(5, 5, W - 10, 1); g.fillRect(5, H - 6, W - 10, 1)
  g.fillRect(5, 5, 1, H - 10); g.fillRect(W - 6, 5, 1, H - 10)
  tone(8, 8, W - 16, 1, .5, INK); tone(8, H - 9, W - 16, 1, .5, INK)
  corner(8, 8, 1, 1); corner(W - 9, 8, -1, 1); corner(8, H - 9, 1, -1); corner(W - 9, H - 9, -1, -1)

  /* header: blackletter title, slot number opposite */
  g.font = '16px UnifrakturMaguntia, serif'; g.fillStyle = INK
  g.fillText(m.title, 20, 28)
  g.font = '8px Silkscreen, monospace'
  tone(0, 0, 0, 0, 0, INK)
  g.fillStyle = '#8A8470'
  g.fillText('MOD 0' + m.slot + '/06', W - 20 - g.measureText('MOD 0' + m.slot + '/06').width, 26)
  tone(18, 34, W - 36, 1, .35, INK)

  /* body */
  g.font = '13px VT323, monospace'
  const bodyW = W - 40, x0 = 20
  let y = 50
  const typed = Math.min(1, since() / .9)

  if (m.kind === 'table') {
    g.font = '8px Silkscreen, monospace'; g.fillStyle = '#8A8470'
    g.fillText(m.head[0], x0, y); g.fillText(m.head[2], W - 40, y)
    y += 10
    m.rows.forEach((r, i) => {
      if (i / m.rows.length > typed) return
      g.font = '13px VT323, monospace'; g.fillStyle = INK
      g.fillText(r[0], x0, y + 9)
      g.font = '8px Silkscreen, monospace'; g.fillStyle = '#6E6A5A'
      g.fillText(r[2], W - 40, y + 9)
      tone(x0, y + 13, bodyW, 1, .25, INK)
      y += 17
    })
  } else if (m.kind === 'steps') {
    m.steps.forEach((s, i) => {
      if (i / m.steps.length > typed) return
      g.font = '8px Silkscreen, monospace'; g.fillStyle = '#8A8470'
      g.fillText('0' + (i + 1), x0, y + 8)
      g.font = '13px VT323, monospace'; g.fillStyle = INK
      g.fillText(s, x0 + 22, y + 9)
      y += 16
    })
  } else {
    if (m.kind === 'thesis') {
      const s = xf > .5 ? m.b : m.a
      g.font = '13px VT323, monospace'; g.fillStyle = INK
      g.fillText(s.heading, x0, y); y += 16
    }
    const all = wrap(lines(m).join(' '), bodyW)
    const shown = Math.floor(all.length * typed + .0001)
    g.fillStyle = INK
    all.slice(0, Math.max(1, shown)).forEach(l => { g.fillText(l, x0, y); y += 13 })
    if (m.kind === 'prose' && m.mail) {
      g.fillStyle = '#C9BE96'; y += 4; g.fillText(m.mail, x0, y); y += 14
    }
    g.fillStyle = '#6E6A5A'
    for (const l of (m.dim || [])) for (const w of wrap(l, bodyW)) { g.fillText(w, x0, y); y += 12 }
    /* the cursor the whole direction hangs on */
    if (Math.floor(t * 2) % 2) { g.fillStyle = INK; g.fillRect(x0, y - 9, 5, 8) }
  }

  /* status line — the text adventure's footer (ref 26) */
  g.font = '8px Silkscreen, monospace'; g.fillStyle = '#6E6A5A'
  g.fillText('TENEBRAE', 20, H - 14)
  const rt = charsAcross(bodyW) + ' COLS'
  g.fillText(rt, W - 20 - g.measureText(rt).width, H - 14)
}

/* ================= B. INSTRUMENT =================
   VFD phosphor: cyan on near-black with an amber accent. Refs 31, 22, 11, 12, 13.
   Alive: the spectrum never stops, a needle sweeps, the counter ticks. */

const VFD = '#7BE8FF', VFD_DIM = '#2A6E80', AMBER = '#FFAE3D', VBG = '#04080B'

function instrument(m, t) {
  g.fillStyle = VBG; g.fillRect(0, 0, W, H)
  /* the glass: a faint horizontal grille, as every VFD has */
  g.fillStyle = '#081218'
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1)

  /* tab strip — OP-I | MIDI | DISK | OPT, but the six Modules (ref 13) */
  const tabW = (W - 16) / 6
  MODULES.forEach((mm, i) => {
    const x = 8 + i * tabW, on = i === mod
    g.fillStyle = on ? VFD : '#0E2028'
    g.fillRect(x, 8, tabW - 2, 11)
    g.font = '8px Silkscreen, monospace'
    g.fillStyle = on ? VBG : VFD_DIM
    const lab = String(mm.slot).padStart(2, '0')
    g.fillText(lab, x + tabW / 2 - g.measureText(lab).width / 2 - 1, 17)
  })

  /* title + a counter that ticks, because instruments always have one */
  g.font = '9px Silkscreen, monospace'; g.fillStyle = VFD
  g.fillText(m.title, 8, 34)
  g.font = '8px Silkscreen, monospace'; g.fillStyle = AMBER
  const clock = (t % 60).toFixed(2).padStart(5, '0')
  g.fillText(clock, W - 8 - g.measureText(clock).width, 34)
  g.fillStyle = VFD_DIM; g.fillRect(8, 40, W - 16, 1)

  /* body */
  const x0 = 8, bodyW = W - 16
  let y = 54
  g.font = '13px VT323, monospace'

  if (m.kind === 'table') {
    m.rows.forEach(r => {
      g.fillStyle = VFD; g.fillText(r[0], x0, y)
      g.font = '8px Silkscreen, monospace'; g.fillStyle = AMBER
      g.fillText(r[2], W - 8 - g.measureText(r[2]).width, y)
      g.font = '13px VT323, monospace'
      g.fillStyle = '#0E2028'; g.fillRect(x0, y + 3, bodyW, 1)
      y += 15
    })
  } else if (m.kind === 'steps') {
    m.steps.forEach((s, i) => {
      g.font = '8px Silkscreen, monospace'; g.fillStyle = AMBER
      g.fillText(String(i + 1).padStart(2, '0'), x0, y)
      g.font = '13px VT323, monospace'; g.fillStyle = VFD
      g.fillText(s, x0 + 20, y)
      y += 14
    })
  } else {
    if (m.kind === 'thesis') {
      const s = xf > .5 ? m.b : m.a
      /* the fader's own readout — a real meter, since this is an instrument */
      g.font = '8px Silkscreen, monospace'; g.fillStyle = AMBER
      g.fillText((xf > .5 ? 'B' : 'A') + '  ' + String(Math.round(xf * 100)).padStart(3, '0'), x0, y)
      g.fillStyle = '#0E2028'; g.fillRect(x0 + 44, y - 5, bodyW - 44, 5)
      g.fillStyle = AMBER; g.fillRect(x0 + 44 + xf * (bodyW - 48), y - 6, 3, 7)
      y += 12
      g.font = '13px VT323, monospace'; g.fillStyle = VFD
      wrap(s.heading, bodyW).forEach(l => { g.fillText(l, x0, y); y += 13 })
      y += 2
    }
    g.fillStyle = VFD
    wrap(lines(m).join(' '), bodyW).forEach(l => { g.fillText(l, x0, y); y += 13 })
    if (m.kind === 'prose' && m.mail) { g.fillStyle = AMBER; y += 3; g.fillText(m.mail, x0, y); y += 14 }
    g.fillStyle = VFD_DIM
    for (const l of (m.dim || [])) for (const w of wrap(l, bodyW)) { g.fillText(w, x0, y); y += 12 }
  }

  /* spectrum analyser — the thing that makes it alive (ref 31) */
  const bars = 48, bw = (W - 16) / bars
  for (let i = 0; i < bars; i++) {
    const p = i / bars
    const env = Math.abs(Math.sin(p * 9 + t * 2.1) * Math.cos(p * 4 - t * 1.3))
    const h = 2 + env * 14
    for (let s = 0; s < h; s += 2) {
      g.fillStyle = s > 11 ? AMBER : s > 7 ? VFD : VFD_DIM
      g.fillRect(8 + i * bw, H - 10 - s, Math.max(1, bw - 1), 1)
    }
  }
}

/* ================= C. CRACKTRO =================
   Blackletter over raster bars, a centred credit column, an endless scroller.
   Refs 02, 05, 06. Alive by construction: nothing on screen ever stops moving. */

const RED = '#F03A22', BONE = '#DCD6C6'

function cracktro(m, t) {
  g.fillStyle = '#08070A'; g.fillRect(0, 0, W, H)

  /* copper bars behind the logo */
  for (let y = 10; y < 42; y++) {
    const v = Math.sin((y - 10) / 32 * Math.PI + t * 1.6)
    if (v <= 0) continue
    g.fillStyle = v > .82 ? '#F87A5E' : v > .5 ? RED : '#6E1810'
    g.fillRect(0, y, W, 1)
  }

  /* the logo */
  g.font = '22px UnifrakturMaguntia, serif'
  const tw = g.measureText('Tenebrae').width
  g.fillStyle = '#08070A'; g.fillText('Tenebrae', W / 2 - tw / 2 + 1, 35)
  g.fillStyle = BONE; g.fillText('Tenebrae', W / 2 - tw / 2, 34)

  /* ASCII rule, the cracktro's signature */
  g.font = '8px Silkscreen, monospace'; g.fillStyle = RED
  const rule = '-=+=-'.repeat(12)
  g.fillText(rule, W / 2 - g.measureText(rule).width / 2, 48)

  /* centred credit column */
  g.font = '8px Silkscreen, monospace'; g.fillStyle = RED
  const head = 'PROUDLY PRESENTS: ' + m.title
  g.fillText(head, W / 2 - g.measureText(head).width / 2, 62)

  let y = 78
  const centre = (txt, colour, font) => {
    g.font = font; g.fillStyle = colour
    g.fillText(txt, W / 2 - g.measureText(txt).width / 2, y); y += font.startsWith('8') ? 11 : 13
  }

  if (m.kind === 'table') {
    m.rows.forEach(r => centre(r[0] + '  ' + r[2], BONE, '13px VT323, monospace'))
  } else if (m.kind === 'steps') {
    m.steps.forEach((s, i) => centre(String(i + 1).padStart(2, '0') + '. ' + s, BONE, '13px VT323, monospace'))
  } else {
    if (m.kind === 'thesis') centre((xf > .5 ? m.b : m.a).heading, RED, '8px Silkscreen, monospace')
    g.font = '13px VT323, monospace'
    wrap(lines(m).join(' '), W - 60).forEach(l => centre(l, BONE, '13px VT323, monospace'))
    if (m.kind === 'prose' && m.mail) centre(m.mail, '#5FE08A', '8px Silkscreen, monospace')
  }

  /* the scroller. A cracktro without one is just a picture. */
  const dimText = (MODULES[mod].dim || ['']).join('   ')
  const msg = ('   ' + (dimText || m.title) + '   ***   ').toUpperCase().repeat(4)
  g.font = '8px Silkscreen, monospace'
  const mw = g.measureText(msg).width / 4
  const off = (t * 34) % mw
  g.fillStyle = '#08070A'; g.fillRect(0, H - 16, W, 14)
  g.fillStyle = RED; g.fillRect(0, H - 17, W, 1); g.fillRect(0, H - 2, W, 1)
  g.save(); g.beginPath(); g.rect(0, H - 16, W, 14); g.clip()
  g.fillStyle = BONE
  /* each glyph rides its own sine — the classic sine-scroller */
  for (let i = 0; i < msg.length; i++) {
    const cx = -off + g.measureText(msg.slice(0, i)).width
    if (cx < -8 || cx > W) continue
    g.fillText(msg[i], cx, H - 6 + Math.sin(t * 3 + cx / 18) * 2.5)
  }
  g.restore()
}

/* ---------- drive ---------- */
const DIRS = { grimoire, instrument, cracktro }

function frame(now) {
  const t = now / 1000
  DIRS[dir](MODULES[mod], t)
  big.clearRect(0, 0, 960, 540); big.drawImage(buf, 0, 0, 960, 540)
  real.clearRect(0, 0, W, H); real.drawImage(buf, 0, 0)
  requestAnimationFrame(frame)
}

function press(attr, apply) {
  document.querySelectorAll('[data-' + attr + ']').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-' + attr + ']').forEach(o =>
        o.setAttribute('aria-pressed', String(o === b)))
      apply(b.dataset[attr]); switchedAt = performance.now()
    })
  })
}
press('dir', v => { dir = v })
press('mod', v => { mod = +v })
press('xf', v => { xf = +v })

/* Silkscreen and VT323 are unused until first paint, and document.fonts.ready does
   not load a face nothing has asked for. Ask for each one by name. */
Promise.all([
  document.fonts.load('8px Silkscreen'), document.fonts.load('13px VT323'),
  document.fonts.load('22px UnifrakturMaguntia'), document.fonts.load('9px Silkscreen'),
]).then(() => requestAnimationFrame(frame))

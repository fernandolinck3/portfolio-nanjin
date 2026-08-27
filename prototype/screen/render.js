/* The Screen, drawn.
   This is the Unit's display and nothing else — no page chrome, no controls, no
   canvases of its own beyond the 320x180 buffer it paints into. It was split out
   of the workbench so the 3D Unit and the workbench render the *same* Screen
   rather than two that drift (they had already drifted: one had Lyra and no
   Decks, the other had Decks and no figure).

   Everything is drawn at 320x180 because that is what the Screen is — a low-res
   phosphor panel. The Unit uploads this buffer as a texture and lets the GPU
   scale it with a nearest filter, so the pixels stay pixels at any size.

   State comes in through the setters at the bottom. The module keeps it rather
   than taking it per call because the reaction, the raven and the Cast all need
   continuity between frames.
*/
import { MODULES, WORKS, LYRA_NAME, lyraAt } from '../../src/content/modules.ts'
import { EMBLEMS, disc, ring } from './sprites.js'
import { drawWizard, drawRaven, updateRaven, flush, drawSpell, castHand,
         heldOrbs, heldBook, heldUnit, drawRobe } from './figure.js'
import { BUST, BUST_PREV, RAVEN, STAFF, ANCHOR, drawSprite, SPRITE_W, SPRITE_H } from './drawn.js'
import { REACTION_FRAMES, REACTION_W, REACTION_H } from './reaction-frames.js'
import { createKnobReaction } from './reaction.js'
import { dusk, LAST_CANDLE_OUT } from '../light.js'

const W = 320, H = 180
const buf = document.createElement('canvas'); buf.width = W; buf.height = H
const g = buf.getContext('2d')

let mod = 0, xf = 0.18, figure = 'reaction', switchedAt = performance.now()

/* The Vigil (0..1) is what the two Decks hold between them. The 3D Unit funnels
   every change through `setVigil` in scene.js; this workbench has no Decks, so a
   slider stands in for them — same continuous, many-small-deltas signal. */
let vigil = 0
const reaction = createKnobReaction({ idle: true })

/* ---------- helpers ---------- */

const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
const dither = (x, y, level) => level * 16 > BAYER[y & 3][x & 3]

/** Fill a rect with an ordered-dither tone. Ordered dither is what makes 1-bit read as shading. */
function tone(x, y, w, h, level, colour) {
  g.fillStyle = colour
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (dither(x + i, y + j, level)) g.fillRect(x + i, y + j, 1, 1)
}

/** Break a line written for a 52-char Screen into lines that fit `max` px. */
function wrap(text, max) {
  const out = []; let line = ''
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w
    if (g.measureText(t).width > max && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

const charsAcross = w => Math.floor(w / g.measureText('n').width)
const since = () => (performance.now() - switchedAt) / 1000
const clamp01 = v => Math.max(0, Math.min(1, v))

/** A dotted leader, the way a contents page runs a name out to its number. */
function leader(x, y, w, colour) {
  g.fillStyle = colour
  for (let i = 0; i < w; i += 3) g.fillRect(x + i, y, 1, 1)
}

/* ================= A. GRIMOIRE ================= */

/**
 * The palette travels.
 *
 * `DAY` is Grimoire at first light; `DARK` is where each colour has arrived by the
 * time the last Candle is out. Everything on the Screen reads these, Lyra's four
 * tones included — she is drawn with ink/mid/dim/bg like the chrome is, so she
 * changes colour with the room instead of being tinted as a special case.
 *
 * They are `let` and rewritten once a frame from `dusk()`, which is computed off
 * the Candles' own ramps. The Screen therefore darkens on exactly the schedule the
 * Altar darkens on, and the Face change at the end lands on a Screen that has
 * already arrived.
 */
const DAY  = { ink: '#E9E3D2', mid: '#8A8470', dim: '#5E5A4C', bg: '#0A0B09', gold: '#C9BE96' }
const DARK = { ink: '#DCD6C6', mid: '#9C5A4E', dim: '#6E1810', bg: '#08070A', gold: '#F03A22' }

let INK = DAY.ink, MID = DAY.mid, DIM = DAY.dim, BG = DAY.bg, GOLD = DAY.gold

/** Mix two #rrggbb strings. Plain sRGB — these are flat fills, not light. */
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const at = s => (pa >> s) & 255, bt = s => (pb >> s) & 255
  return '#' + [16, 8, 0]
    .map(s => Math.round(at(s) + (bt(s) - at(s)) * k).toString(16).padStart(2, '0')).join('')
}

/** Move the palette to where the room's light is now. Once a frame, before drawing. */
function setPalette(d) {
  INK  = mix(DAY.ink,  DARK.ink,  d); MID  = mix(DAY.mid,  DARK.mid,  d)
  DIM  = mix(DAY.dim,  DARK.dim,  d); BG   = mix(DAY.bg,   DARK.bg,   d)
  GOLD = mix(DAY.gold, DARK.gold, d)
}

/**
 * The celestial gauge — the Screen's own small sky, and the one element that
 * reads the Vigil continuously.
 *
 * A rayed sun at first light climbs its track, loses its rays, and arrives as a
 * crescent moon exactly when the last Candle dies. It is how the visitor sees the
 * night coming *before* the Face changes under them: the old hard switch at 0.94
 * gave no warning, because nothing on the Screen moved until it had already
 * happened.
 *
 * Deliberately small. At 1x this is nine pixels of travel, which the eye reads as
 * a state rather than as an animation competing with the Module.
 */
function celestial(d, t, ink, gold, dim, bg) {
  const x0 = W - 76, x1 = W - 18, span = x1 - x0
  const base = 22, rise = 8
  const x = Math.round(x0 + span * d)
  const y = Math.round(base - Math.sin(d * Math.PI) * rise)

  /* the track it runs on, so the gauge still reads as a gauge at either end */
  g.fillStyle = dim
  for (let i = 0; i <= span; i += 3) {
    const k = i / span
    g.fillRect(x0 + i, Math.round(base - Math.sin(k * Math.PI) * rise), 1, 1)
  }

  /* stars come out as the room does, and only near the end */
  const night = clamp01((d - .55) / .45)
  if (night > 0) {
    g.fillStyle = mix(bg, ink, night * .8)
    for (const [sx, sy, ph] of [[x0 - 6, 12, 0], [x0 + 14, 9, 1.7], [x1 - 4, 11, 3.1]])
      if (Math.sin(t * 1.3 + ph) > -.4) g.fillRect(sx, sy, 1, 1)
  }

  /* the body: gold and rayed at first, bone and bitten by the end */
  g.fillStyle = mix(gold, ink, d)
  disc(g, x, y, 3)

  const ray = Math.round(3 * (1 - Math.min(1, d / .45)))
  if (ray > 0) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      g.fillRect(Math.round(x + Math.cos(a) * (4 + ray)), Math.round(y + Math.sin(a) * (4 + ray)), 1, 1)
    }
  }

  /* the bite that turns the disc into a crescent — it only starts once the rays
     are gone, so the body is never both rayed and crescent */
  const bite = Math.round(clamp01((d - .4) / .6) * 4)
  if (bite > 0) { g.fillStyle = bg; disc(g, x + bite, y - 1, 3) }
}

/**
 * The recess Lyra stands in.
 *
 * She used to be composited over whatever the Module had left over, which is
 * exactly what made her read as pasted on: nothing in the layout accounted for
 * her, she stood on air, and she cast no shadow. The niche is the layout
 * accounting for her — a shallow chapel recess with a lit back wall, a floor she
 * has weight on, and a jamb that turns the Module into two designed columns
 * instead of a text block with a sprite next to it.
 *
 * The head is a lancet, the same arch the room's window is getting (T-08), so the
 * Screen and the chapel around it are quoting one another.
 */
function niche(st, box, d, ink, mid, dim, bg) {
  const pad = 5
  const x = Math.max(7, box.x - pad)
  const w = Math.min(W - 8 - x, box.w + pad * 2)
  const floor = st.fy + 2
  const top = 50
  const archH = Math.min(22, Math.round(w * .55))
  const hw = w / 2

  /* how far in from each jamb the arch has closed at row r */
  const inset = r => Math.round(hw * (1 - Math.pow(Math.sin((r / archH) * Math.PI / 2), .72)))

  /* the back wall, brighter at the top where the light falls into it */
  for (let yy = top; yy < floor; yy++) {
    const r = yy - top
    const i = r < archH ? inset(r) : 0
    const level = .16 * (1 - (yy - top) / (floor - top)) + .05
    tone(x + i, yy, w - i * 2, 1, level, ink)
  }

  /* jambs and arch outline */
  g.fillStyle = mix(dim, ink, .25 + d * .2)
  for (let r = 0; r < archH; r++) {
    const i = inset(r)
    g.fillRect(x + i, top + r, 1, 1); g.fillRect(x + w - 1 - i, top + r, 1, 1)
  }
  g.fillRect(x, top + archH, 1, floor - top - archH)
  g.fillRect(x + w - 1, top + archH, 1, floor - top - archH)

  /* the floor she stands on, and the shadow that gives her weight */
  g.fillStyle = mid; g.fillRect(x, floor, w, 1)
  tone(x, floor + 1, w, 2, .3, bg)
  const cx = Math.round(box.x + box.w / 2)
  const sw = Math.round(box.w * .8)
  /* `tone` indexes the Bayer matrix with the coordinate, so it wants integers */
  tone(Math.round(cx - sw / 2), floor - 1, sw, 1, .55, bg)
  tone(Math.round(cx - sw / 3), floor - 2, Math.round(sw * .66), 1, .3, bg)
}

/** A pixel ornament in the corner — the Plate's foliate engraving at 1-bit. */
function corner(cx, cy, sx, sy) {
  g.fillStyle = INK
  for (const [x, y] of [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[2,2],[3,2],[2,3],
                        [5,0],[6,0],[0,5],[0,6],[4,4],[5,4],[4,5],[7,1],[1,7],[6,3],[3,6]])
    g.fillRect(cx + x * sx, cy + y * sy, 1, 1)
}

function grimoireChrome(m, t) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H)
  const flick = .5 + .5 * Math.sin(t * 1.7) * Math.sin(t * .9 + 1.3)
  tone(6, 6, W - 12, H - 12, .06 + flick * .05, '#1C2018')

  g.fillStyle = INK
  g.fillRect(5, 5, W - 10, 1); g.fillRect(5, H - 6, W - 10, 1)
  g.fillRect(5, 5, 1, H - 10); g.fillRect(W - 6, 5, 1, H - 10)
  tone(8, 8, W - 16, 1, .5, INK); tone(8, H - 9, W - 16, 1, .5, INK)
  corner(8, 8, 1, 1); corner(W - 9, 8, -1, 1); corner(8, H - 9, 1, -1); corner(W - 9, H - 9, -1, -1)

  /* header band: emblem, blackletter title, slot */
  EMBLEMS[mod](g, 12, 10, t, INK, DIM)
  g.font = '17px UnifrakturMaguntia, serif'; g.fillStyle = INK
  g.fillText(m.title, 52, 32)
  g.font = '8px Silkscreen, monospace'; g.fillStyle = MID
  const slot = 'MOD 0' + m.slot + '/06'
  g.fillText(slot, W - 20 - g.measureText(slot).width, 40)
  celestial(dusk(vigil), t, INK, GOLD, DIM, BG)
  tone(18, 44, W - 36, 1, .4, INK)

}

/* How many lines the Module could not fit. Drawn after the body, so it can say so. */
let overflow = 0
const FLOOR = H - 24

/** Lay out lines, stop at the floor, and count what was left over. */
function flow(all, x, y, step, colour) {
  g.fillStyle = colour
  for (const l of all) {
    if (y > FLOOR) { overflow++; continue }
    g.fillText(l, x, y); y += step
  }
  return y
}

function grimoireStatus() {
  g.font = '8px Silkscreen, monospace'
  const cols = charsAcross(BODY_W()) + ' COLS'
  g.fillStyle = DIM
  g.fillText(cols, W - 20 - g.measureText(cols).width, H - 14)
  /* the constraint, said out loud rather than clipped silently */
  if (overflow) {
    const over = '+' + overflow + ' LINES'
    g.fillStyle = GOLD; g.fillText(over, 20, H - 14)
  }
}

/* ---------- the stage ----------
   Each Module is composed around what she is doing in it, rather than laid out
   first and given a panel afterwards. She moves side to side, changes height,
   and changes what is in her hands; the body of the Module takes what is left.
   `fy` is her feet. */
const STAGE = [
  { fx: W - 50, fy: H - 14, fh: 92, pose: 'present', bx: 20,  bw: W - 118, by: 60 },
  { fx: W / 2,  fy: H - 10, fh: 66, pose: 'balance', bx: 20,  bw: W - 40,  by: 58 },
  { fx: 46,     fy: H - 14, fh: 86, pose: 'craft',   bx: 96,  bw: W - 118, by: 60 },
  { fx: W - 42, fy: H - 14, fh: 86, pose: 'point',   bx: 20,  bw: W - 104, by: 58 },
  { fx: 42,     fy: H - 14, fh: 86, pose: 'read',    bx: 88,  bw: W - 110, by: 58 },
  { fx: W - 48, fy: H - 14, fh: 92, pose: 'send',    bx: 20,  bw: W - 116, by: 60 },
]
const stage = () => STAGE[mod]

/** Which drawing of her bust is live. The workbench flips it; the Unit ships BUST. */
let bustRows = BUST

/**
 * The outer edge of her hat brim — where the raven sits.
 *
 * It sat on her shoulder first and vanished: bone bird on a bone robe is one
 * shape. On the brim it has the dark ground behind it and reads at 1x.
 */
function perchOf(st) {
  if (figure === 'reaction') {
    /* her hat brim sits about a fifth of the way down the sprite, on the left */
    const b = reactionBox(st)
    return [b.x + 5 * b.scale, b.y + 8 * b.scale]
  }
  if (figure === 'drawn') {
    const b = spriteBox(st)
    /* the far brim tip from the frame edge she is standing against */
    const col = st.fx < W / 2 ? SPRITE_W - ANCHOR.brim[0] : ANCHOR.brim[0]
    return [b.x + col * b.scale, b.y + ANCHOR.brim[1] * b.scale]
  }
  const sc = st.fh / 74
  const headY = st.fy - st.fh * .58
  const brimY = headY - 11 * sc * .55
  return [Math.round(st.fx - 19 * sc), Math.round(brimY)]
}
const roamOf = st => ({ lo: 34, hi: W - 34, y: st.by + 24 })

/** The hand-drawn sprite placed on the same stage marks as the procedural one. */
function spriteBox(st) {
  /* the drawn bust is the top ~58% of her; the generated robe fills the rest */
  const scale = Math.max(1, Math.round((st.fh * .58) / SPRITE_H))
  return {
    scale,
    x: Math.round(st.fx - (SPRITE_W * scale) / 2),
    y: Math.round(st.fy - st.fh),
    neckY: Math.round(st.fy - st.fh + ANCHOR.neck[1] * scale),
  }
}
/**
 * Lyra's speech bubble, and her name on it.
 *
 * It sits above her and is anchored to her sprite rather than to the Module's
 * layout, so it travels with her when a Module puts her on the other side of the
 * Screen. The tail points down at her hat.
 *
 * Drawn with the same fills as everything else — no rounded corners, because a
 * radius costs pixels the 320x180 buffer does not have and reads as mush at 1x.
 */
function drawBubble(g, box, lines, ink, mid, bg) {
  const PAD = 4, LH = 9, NAME_H = 8
  g.font = '11px VT323, monospace'

  /**
   * The bubble is opaque and it used to be laid out from her sprite alone, so on
   * any Module that stands her beside the body — WORKS puts her at x=46 with the
   * series starting at x=96 — it reached straight across and painted over the
   * text. Fernando: "lyra is covering up parts of the texts".
   *
   * She gets her own column and stays in it. The side she is on decides which
   * span is hers, her lines wrap to it, and the box is clamped to it. If that
   * leaves too little room to say anything she stays silent rather than
   * overlapping — a bubble is never worth losing a line of the Module for.
   */
  const st = stage()
  const onLeft = st.fx < W / 2
  const limit = onLeft ? st.bx - 8 : W - (st.bx + st.bw) - 8
  const avail = Math.max(0, limit - PAD * 2)
  if (avail < 34) return

  const fitted = []
  for (const l of lines) for (const ln of wrap(l, avail)) fitted.push(ln)
  if (!fitted.length) return

  let wide = Math.min(avail, g.measureText(LYRA_NAME).width)
  for (const l of fitted) wide = Math.max(wide, Math.min(avail, g.measureText(l).width))
  const w = Math.ceil(wide) + PAD * 2
  const h = NAME_H + fitted.length * LH + PAD * 2
  lines = fitted

  /* Prefer sitting above her; if the Module has pushed her high, sit beside her. */
  let x = Math.round(box.x + (28 * box.scale) / 2 - w / 2)
  let y = box.y - h - 6
  if (y < 4) y = 4
  /* keep her entirely inside her own column, not merely on the Screen */
  const lo = onLeft ? 4 : st.bx + st.bw + 4
  const hi = onLeft ? st.bx - 4 - w : W - w - 4
  x = Math.max(lo, Math.min(hi, x))

  g.fillStyle = bg; g.fillRect(x, y, w, h)
  g.fillStyle = ink
  g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1)
  g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h)

  /* the tail — three stepped pixels, pointing at her hat */
  const tx = Math.max(x + 4, Math.min(x + w - 8, Math.round(box.x + 8 * box.scale)))
  for (let i = 0; i < 3; i++) {
    g.fillStyle = bg; g.fillRect(tx - 2 + i, y + h - 1 + i, 5 - i * 2, 1)
    g.fillStyle = ink
    g.fillRect(tx - 3 + i, y + h - 1 + i, 1, 1)
    g.fillRect(tx + 3 - i, y + h - 1 + i, 1, 1)
  }

  g.fillStyle = mid
  g.fillText(LYRA_NAME, x + PAD, y + PAD + 6)
  g.fillStyle = ink
  lines.forEach((l, i) => g.fillText(l, x + PAD, y + PAD + NAME_H + 6 + i * LH))
}

/* The reaction sprite is her whole height, not the top 58% — so it divides by her
   stage height directly rather than through the bust's .58. */
function reactionBox(st) {
  const scale = Math.max(1, Math.round(st.fh / REACTION_H))
  return {
    scale,
    x: Math.round(st.fx - (REACTION_W * scale) / 2),
    y: Math.round(st.fy - REACTION_H * scale),
  }
}

const at = (box, key) =>
  [box.x + ANCHOR[key][0] * box.scale, box.y + ANCHOR[key][1] * box.scale]
const BODY_W = () => (figure === 'none' ? W - 40 : stage().bw)
const BODY_X = () => (figure === 'none' ? 20 : stage().bx)

/* The cast runs for this long after a Module change, and she holds the casting
   pose through the first half of it. */
const CAST_MS = .85
const castP = () => clamp01(since() / CAST_MS)

/* ---------- the series ----------
   PROJECT 001 is the only Module that is a list of things rather than a piece of
   copy, and the only one where something on the Screen can be clicked. Its rows
   are laid out here and published in `workRows` in buffer coordinates, so the
   Unit can turn a ray into "the visitor clicked 003" without a second copy of the
   layout to disagree with this one. */

let hoverWork = -1, plinthWork = -1
let workRows = []

/**
 * 17 fitted five rows. There are six Works now, plus the MORE SOON rule.
 *
 * The arithmetic, because guessing it wrong is what clipped it twice: the series
 * starts at `st.by` = 60, the first row sits at +12, and `FLOOR` is 156. Six rows
 * at 13 put the last one at 137 and the closing rule at 154 — inside the floor,
 * with the status line still clear beneath it.
 */
const WROW = { h: 13 }

/** The series, or — while a Work is on the Plinth — that Work's plaque. */
function drawWorks(x0, bodyW, top) {
  workRows = []

  if (plinthWork >= 0) {
    const w = WORKS[plinthWork]
    let y = top
    g.font = '8px Silkscreen, monospace'; g.fillStyle = GOLD
    g.fillText('ON THE PLINTH', x0, y); y += 16

    g.font = '17px UnifrakturMaguntia, serif'; g.fillStyle = INK
    g.fillText(w.title, x0, y); y += 13
    g.font = '8px Silkscreen, monospace'; g.fillStyle = MID
    g.fillText(w.no + ' · ' + w.kind.toUpperCase() + ' · ' + w.year, x0, y); y += 10

    tone(x0, y, bodyW, 1, .4, INK); y += 12
    g.font = '12px VT323, monospace'; g.fillStyle = MID
    for (const l of w.blurb) for (const ln of wrap(l, bodyW)) { g.fillText(ln, x0, y); y += 11 }

    if (w.placeholder) {
      y += 3
      g.font = '8px Silkscreen, monospace'; g.fillStyle = GOLD
      g.fillText('PLACEHOLDER', x0, y); y += 12
    }
    g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
    g.fillText('CLICK TO SEND IT BACK', x0, FLOOR - 2)
    return
  }

  /**
   * The series sits on its own ground.
   *
   * The rest of the Screen is type on the Grimoire's field, which is fine for
   * prose; a list of six rows over the same field was the one place it stopped
   * being readable — Fernando: "the screen where the works appear is off the
   * aesthetic... you can add more black overlay so it can be more readable".
   *
   * So the list gets a plate laid under it, dark and hard-edged, with a rule top
   * and bottom. It is the same move the Plate makes for the Print: clear the
   * ground before you put a label on it.
   */
  const plateY = top - 10
  const plateH = 12 + WORKS.length * WROW.h + 20
  tone(x0 - 10, plateY, bodyW + 16, plateH, .92, '#04050A')
  tone(x0 - 10, plateY, bodyW + 16, 1, .45, INK)
  tone(x0 - 10, plateY + plateH - 1, bodyW + 16, 1, .45, INK)

  g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
  g.fillText('CLICK A WORK', x0, top)

  WORKS.forEach((w, i) => {
    const y = top + 12 + i * WROW.h
    workRows.push({ i, x: x0 - 6, y: y - 9, w: bodyW + 10, h: WROW.h })
    const hot = i === hoverWork

    if (hot) tone(x0 - 6, y - 9, bodyW + 10, WROW.h - 2, .5, INK)
    g.fillStyle = hot ? GOLD : DIM
    g.fillRect(x0 - 6, y - 9, 1, WROW.h - 2)

    g.font = '8px Silkscreen, monospace'; g.fillStyle = hot ? GOLD : DIM
    g.fillText(w.no, x0, y)

    g.font = '12px VT323, monospace'
    g.fillStyle = w.placeholder ? MID : INK
    g.fillText(w.title, x0 + 26, y)

    g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
    const meta = w.placeholder ? 'PLACEHOLDER' : w.kind.toUpperCase() + ' · ' + w.year
    g.fillText(meta, x0 + bodyW - g.measureText(meta).width, y)
  })

  /* The series is open, and says so. A portfolio that ends on its last row reads
     as finished; one that says more is coming reads as someone still working.
     Drawn dim and rule-led so it is plainly a note and not a sixth clickable row. */
  const endY = top + 12 + WORKS.length * WROW.h
  tone(x0 - 6, endY - 4, bodyW + 10, 1, .35, INK)
  g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
  g.fillText('MORE SOON', x0, endY + 4)
}

function grimoire(m, t) {
  overflow = 0
  grimoireChrome(m, t)

  const st = stage()
  const cast = castP()
  const casting = figure !== 'none' && cast > 0 && cast < 1
  let hands = null

  if (figure === 'drawn') {
    const box = spriteBox(st)
    const sc = box.scale
    /* A bitmap has one pose, so it acts with its whole body: she hops on the Cast
       and her staff's orb does the rest. */
    const hop = casting && cast < .55 ? Math.round(Math.sin(cast / .55 * Math.PI) * 3 * sc) : 0
    const by = box.y - hop

    /* The staff goes on her outboard side, so it never falls off the frame when
       the stage puts her against an edge. */
    const outboard = st.fx < W / 2 ? SPRITE_W : ANCHOR.staff[0]
    const [sx, sy] = [box.x + outboard * sc, by + ANCHOR.staff[1] * sc]
    drawSprite(g, STAFF, sx, sy, sc, INK, MID, DIM, BG)
    /* the orb answers the Cast */
    if (casting) {
      const flare = Math.sin(Math.min(1, cast / .55) * Math.PI)
      g.fillStyle = GOLD
      disc(g, sx + 2 * sc, sy + 2 * sc, Math.round(3 * sc + flare * 5 * sc))
    }

    /* the generated body first, then the drawn bust sits on its shoulders */
    hands = drawRobe(g, st.fx, box.neckY - hop, st.fy - hop, sc,
                     casting ? 'cast' : st.pose, t, INK, MID, DIM, BG)
    drawSprite(g, bustRows, box.x, by, sc, INK, MID, DIM, BG)
    if (!casting) {
      const c = [Math.round((hands.leftHand[0] + hands.rightHand[0]) / 2),
                 Math.round((hands.leftHand[1] + hands.rightHand[1]) / 2)]
      if (m.kind === 'thesis') heldOrbs(g, hands.leftHand, hands.rightHand, xf, INK, DIM, t)
      else if (st.pose === 'read') heldBook(g, c, c, INK, DIM, BG, t)
      else if (st.pose === 'craft') heldUnit(g, c, c, INK, DIM, BG, t)
    }
  } else if (figure === 'reaction') {
    /* One bitmap for the whole of her, so there is no pose and nothing held —
       the animation is the performance. Frame 0 is the idle she rests on. */
    const box = reactionBox(st)
    niche(st, { x: box.x, w: REACTION_W * box.scale }, dusk(vigil), INK, MID, DIM, BG)
    drawSprite(g, REACTION_FRAMES[reaction.frameAt()], box.x, box.y, box.scale, INK, MID, DIM, BG)
    /* she speaks once the Cast has handed the Module over */
    if (!casting) drawBubble(g, box, lyraAt(mod), INK, MID, BG)
  } else if (figure !== 'none') {
    const fig = { x: st.fx, y: st.fy, h: st.fh }
    hands = drawWizard(g, fig, st.pose, t, INK, DIM, BG, casting && cast < .55 ? 1 : 0)
    /* what she is holding is what makes the pose an action rather than a shape */
    if (!casting) {
      if (m.kind === 'thesis') heldOrbs(g, hands.leftHand, hands.rightHand, xf, INK, DIM, t)
      else if (st.pose === 'read') heldBook(g, hands.leftHand, hands.rightHand, INK, DIM, BG, t)
      else if (st.pose === 'craft') heldUnit(g, hands.leftHand, hands.rightHand, INK, DIM, BG, t)
    }
  }

  const x0 = BODY_X(), bodyW = BODY_W()
  let y = st.by
  const typed = clamp01((since() - CAST_MS * .5) / .8)
  g.font = '13px VT323, monospace'

  if (m.id === 'project-001') {
    /* the series, not the prose — this Module lists things */
    drawWorks(x0, bodyW, y)

  } else if (m.kind === 'thesis') {
    /* She is the fader made flesh: an orb in each hand, the heavier one lit.
       The columns flank her, so the gutter is hers. */
    const gutter = figure === 'none' ? 14 : 54
    const colW = (bodyW - gutter) / 2
    const FL = H - 30
    ;[[m.a, x0, 1 - xf], [m.b, x0 + colW + gutter, xf]].forEach(([side, cx, weight]) => {
      const lead = weight >= .5
      g.font = '8px Silkscreen, monospace'
      g.fillStyle = lead ? GOLD : DIM
      g.fillText(side.heading.slice(0, 1), cx, y)
      g.font = '11px VT323, monospace'
      let yy = y + 11
      g.fillStyle = lead ? INK : DIM
      wrap(side.heading.slice(4), colW).forEach(l => { g.fillText(l, cx, yy); yy += 10 })
      if (lead) {
        yy += 4
        g.fillStyle = MID
        for (const l of wrap(side.lines.join(' '), colW)) {
          if (yy > FL) { overflow++; continue }
          g.fillText(l, cx, yy); yy += 10
        }
      } else {
        yy += 5
        tone(cx, yy, colW, 1, .3, INK)
        g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
        g.fillText(side.lines.join(' ').length + ' CHARS', cx, yy + 11)
      }
    })

  } else if (m.kind === 'table') {
    /* She points at it, so it is a shelf she is showing you rather than a table */
    m.rows.forEach((r, i) => {
      if (i / m.rows.length > typed) return
      g.fillStyle = i === 0 ? GOLD : DIM
      if (i === 0) disc(g, x0 + 3, y + 4, 3); else ring(g, x0 + 3, y + 4, 3, 1)
      g.font = '13px VT323, monospace'; g.fillStyle = i === 0 ? INK : MID
      g.fillText(r[0], x0 + 12, y + 8)
      const tw = g.measureText(r[0]).width
      g.font = '8px Silkscreen, monospace'
      /* The middle column was never drawn — only [0] and [2] ever reached the
         Screen, so a row's "where" was invisible. Fernando dropped the years, so
         the right-hand slot shows the third column when there is one and falls
         back to the second, which is where the "where" now lives. */
      const yr = r[2] || r[1], yw = g.measureText(yr).width
      leader(x0 + 16 + tw, y + 7, Math.max(4, bodyW - 20 - tw - yw), DIM)
      g.fillStyle = i === 0 ? GOLD : DIM
      g.fillText(yr, x0 + bodyW - yw, y + 8)
      y += 16
    })

  } else if (m.kind === 'steps') {
    /* The steps come off the book in her hands */
    const top = y - 2, span = m.steps.length * 16
    tone(x0 - 8, top, 1, span, .3, INK)
    g.fillStyle = MID; g.fillRect(x0 - 8, top, 1, Math.round(span * typed))
    m.steps.forEach((s, i) => {
      if (i / m.steps.length > typed) return
      g.fillStyle = INK; disc(g, x0 - 8, y + 4, 2)
      g.font = '8px Silkscreen, monospace'; g.fillStyle = DIM
      g.fillText('0' + (i + 1), x0, y + 7)
      g.font = '12px VT323, monospace'; g.fillStyle = MID
      g.fillText(s, x0 + 17, y + 8)
      y += 16
    })

  } else {
    const all = wrap(m.lines.join(' '), bodyW)
    const shown = Math.max(1, Math.floor(all.length * typed + .0001))
    y = flow(all.slice(0, shown), x0, y, 13, INK)
    if (m.mail) {
      y += 6
      g.fillStyle = GOLD
      g.fillRect(x0, y - 10, bodyW, 1); g.fillRect(x0, y + 6, bodyW, 1)
      g.fillRect(x0, y - 10, 1, 17); g.fillRect(x0 + bodyW - 1, y - 10, 1, 17)
      g.font = '8px Silkscreen, monospace'
      g.fillText(m.mail, x0 + 6, y + 1)
      g.font = '13px VT323, monospace'
      y += 18
    }
    /**
     * Where else to find him.
     *
     * Boxed like the address above, one row, so OUT reads as a set of routes
     * rather than an address with footnotes. A link without a `url` is drawn the
     * same but not treated as clickable — `modules.ts` withholds the LinkedIn
     * address rather than guessing a slug from a name.
     */
    if (m.links?.length) {
      g.font = '8px Silkscreen, monospace'
      let lx = x0
      for (const l of m.links) {
        const label = l.label + ' ' + l.handle
        const w = Math.ceil(g.measureText(label).width) + 10
        if (lx + w > x0 + bodyW) break
        g.fillStyle = DIM
        g.fillRect(lx, y - 9, w, 1); g.fillRect(lx, y + 4, w, 1)
        g.fillRect(lx, y - 9, 1, 14); g.fillRect(lx + w - 1, y - 9, 1, 14)
        g.fillStyle = l.url ? MID : DIM
        g.fillText(label, lx + 5, y)
        lx += w + 6
      }
      g.font = '13px VT323, monospace'
      y += 16
    }
    const dimAll = []
    for (const l of (m.dim || [])) dimAll.push(...wrap(l, bodyW))
    y = flow(dimAll, x0, y, 12, DIM)
    if (y <= FLOOR && Math.floor(t * 2) % 2) { g.fillStyle = INK; g.fillRect(x0, y - 9, 5, 8) }
  }

  grimoireStatus()

  /* The raven, then the spell over everything.
     This used to be gated on `hands`, which only the procedural and drawn figures
     ever set — so the default figure had no familiar and no Cast in this Face,
     while Cracktro drew the raven regardless. She is never alone in one Face and
     accompanied in the other; the gate is on the figure existing, nothing more. */
  if (figure !== 'none') {
    if (figure === 'drawn') {
      const pc = perchOf(st), sc = spriteBox(st).scale
      const flip = stage().fx < W / 2 ? 0 : -7
      drawSprite(g, RAVEN, pc[0] + flip * sc, pc[1] - 7 * sc, sc, INK, MID, DIM, BG)
    } else drawRaven(g, perchOf(st), t, INK, DIM)
    if (casting) drawSpell(g, castHand({ x: st.fx, y: st.fy, h: st.fh }), cast, W, H, INK, GOLD)
  }
}


/* ================= B. INSTRUMENT (kept for comparison, not developed) ================= */


/* ================= C. CRACKTRO ================= */

const RED = '#F03A22', BONE = '#DCD6C6', EMBER = '#F87A5E', DEEP = '#6E1810'

function cracktro(m, t) {
  g.fillStyle = '#08070A'; g.fillRect(0, 0, W, H)

  /* copper bars */
  for (let y = 8; y < 40; y++) {
    const v = Math.sin((y - 8) / 32 * Math.PI + t * 1.6)
    if (v <= 0) continue
    g.fillStyle = v > .82 ? EMBER : v > .5 ? RED : DEEP
    g.fillRect(0, y, W, 1)
  }

  /* The moon carries over from Grimoire. It is at the far end of its track by
     definition — this Face only exists once the gauge has arrived — so it reads as
     the same object that has been crossing all along, not a new ornament. */
  celestial(dusk(vigil), t, BONE, EMBER, DEEP, '#08070A')

  /* logo, with the Module's emblem riding beside it on a sine */
  g.font = '22px UnifrakturMaguntia, serif'
  const tw = g.measureText('Tenebrae').width
  g.fillStyle = '#08070A'; g.fillText('Tenebrae', W / 2 - tw / 2 + 1, 33)
  g.fillStyle = BONE; g.fillText('Tenebrae', W / 2 - tw / 2, 32)
  const bob = Math.round(Math.sin(t * 2.3) * 3)
  EMBLEMS[mod](g, W / 2 - tw / 2 - 40, 6 + bob, t, BONE, DEEP)
  EMBLEMS[mod](g, W / 2 + tw / 2 + 8, 6 - bob, t, BONE, DEEP)

  g.font = '8px Silkscreen, monospace'; g.fillStyle = RED
  const rule = '-=+=-'.repeat(12)
  g.fillText(rule, W / 2 - g.measureText(rule).width / 2, 46)
  const head = 'PROUDLY PRESENTS: ' + m.title
  g.fillStyle = EMBER
  g.fillText(head, W / 2 - g.measureText(head).width / 2, 60)

  let y = 76
  const centre = (txt, colour, font, step) => {
    g.font = font; g.fillStyle = colour
    g.fillText(txt, W / 2 - g.measureText(txt).width / 2, y); y += step
  }

  if (m.kind === 'table') {
    /* credits-roll layout: name left, year right, leader between (ref 02) */
    const boxW = 210, x0 = (W - boxW) / 2
    m.rows.forEach((r, i) => {
      g.font = '13px VT323, monospace'; g.fillStyle = i === 0 ? EMBER : BONE
      g.fillText(r[0], x0, y)
      const tw2 = g.measureText(r[0]).width
      g.font = '8px Silkscreen, monospace'
      const yw = g.measureText(r[2]).width
      leader(x0 + tw2 + 4, y - 3, boxW - tw2 - yw - 8, DEEP)
      g.fillStyle = RED; g.fillText(r[2], x0 + boxW - yw, y)
      y += 15
    })
  } else if (m.kind === 'steps') {
    m.steps.forEach((s, i) =>
      centre(String(i + 1).padStart(2, '0') + '. ' + s, i % 2 ? BONE : EMBER, '13px VT323, monospace', 14))
  } else {
    const src = m.kind === 'thesis' ? (xf > .5 ? m.b : m.a) : m
    if (m.kind === 'thesis') {
      centre(src.heading, RED, '8px Silkscreen, monospace', 14)
      /* the fader as a bar of blocks, cracktro-style */
      const bw = 160, bx = (W - bw) / 2
      for (let i = 0; i < 32; i++) {
        g.fillStyle = i / 32 < xf ? EMBER : DEEP
        g.fillRect(bx + i * 5, y - 6, 4, 4)
      }
      y += 10
    }
    g.font = '13px VT323, monospace'
    wrap(src.lines.join(' '), W - 60).forEach(l => centre(l, BONE, '13px VT323, monospace', 13))
    if (m.mail) { y += 4; centre(m.mail, '#5FE08A', '8px Silkscreen, monospace', 12) }
  }

  /* the scroller. A cracktro without one is just a picture. */
  const msg = ('   ' + ((m.dim || []).join('   ') || m.title) + '   ***   ').toUpperCase().repeat(4)
  g.font = '8px Silkscreen, monospace'
  const mw = g.measureText(msg).width / 4
  const off = (t * 34) % mw
  g.fillStyle = '#08070A'; g.fillRect(0, H - 16, W, 14)
  g.fillStyle = RED; g.fillRect(0, H - 17, W, 1); g.fillRect(0, H - 2, W, 1)
  g.save(); g.beginPath(); g.rect(0, H - 16, W, 14); g.clip()
  g.fillStyle = BONE
  for (let i = 0; i < msg.length; i++) {
    const cx = -off + g.measureText(msg.slice(0, i)).width
    if (cx < -8 || cx > W) continue
    g.fillText(msg[i], cx, H - 6 + Math.sin(t * 3 + cx / 18) * 2.5)
  }
  g.restore()

  if (figure !== 'none') {
    const st = { fx: W - 46, fy: H - 20, fh: 74, pose: stage().pose }
    const cast = castP(), casting = cast > 0 && cast < 1
    if (figure === 'reaction') {
      const box = reactionBox(st)
      drawSprite(g, REACTION_FRAMES[reaction.frameAt()], box.x, box.y, box.scale,
                 BONE, DEEP, DEEP, '#08070A')
      if (!casting) drawBubble(g, box, lyraAt(mod), BONE, DEEP, '#08070A')
    } else {
      drawWizard(g, st, st.pose, t, BONE, DEEP, '#08070A', casting && cast < .55 ? 1 : 0)
    }
    drawRaven(g, perchOf(st), t, BONE, DEEP)
    if (casting) drawSpell(g, castHand(st), cast, W, H, BONE, EMBER)
  }
}

/* ---------- drive ---------- */
const DIRS = { grimoire, cracktro }

/**
 * The Vigil chooses the Face. Grimoire is the day face and burns while any Candle
 * is still alight; Cracktro is the night face and takes over once the last one
 * dies and the Screen's phosphor is the only source left in the room.
 *
 * This is now the *last* thing to change rather than the only one. The palette,
 * the celestial gauge and Lyra's tones have been travelling since Vigil 0, so by
 * the time this flips the Screen is already night and only the authored layout
 * swaps under it — which is what keeps a Face a Face and not a palette (ADR-0016).
 *
 * The threshold is `LAST_CANDLE_OUT`, derived in `light.js` from the third
 * Candle's ramp. It is not a taste number and it is not typed here.
 */
const faceFor = v => (v >= LAST_CANDLE_OUT ? 'cracktro' : 'grimoire')
export { LAST_CANDLE_OUT }

/** Module changes are a cut with a dithered curtain across it, not a fade. */
function curtain() {
  const p = since() / .34
  if (p >= 1) return
  const level = p < .5 ? p * 2 : (1 - p) * 2
  const night = faceFor(vigil) === 'cracktro'
  tone(0, 0, W, H, level, night ? '#08070A' : '#0A0B09')
  tone(0, 0, W, H, level * .5, night ? RED : INK)
}


/* ---------- state in, frames out ---------- */

/**
 * Which Face to draw, or `null` to let the Vigil choose.
 *
 * The Unit pins this to Grimoire: one instrument, one aesthetic, authored all the
 * way through. The workbench leaves it null so both can still be looked at side
 * by side while Cracktro's future is decided.
 */
let faceOverride = null

/** The 320x180 buffer. Upload it as a texture, or blit it — do not draw into it. */
export const buffer = buf
export const SCREEN_W = W, SCREEN_H = H

/** Change Module. Restarts the Cast and sends the raven up to look at what arrived. */
export function setModule(i) {
  if (i === mod) return
  mod = i
  switchedAt = performance.now()
  if (figure !== 'none') flush(performance.now() / 1000)
}

/** The Vigil, 0..1. Also what the reaction listens to for a Deck being turned. */
export function setVigil(v) {
  vigil = v
  reaction.notify(v)
}

export function setCrossfade(v) { xf = v }

/** Which row the pointer is over, or -1. Lamps it. */
export function setHoverWork(i) { hoverWork = i }

/** Which Work is on the Plinth, or -1. Turns the series into that Work's plaque. */
export function setPlinthWork(i) { plinthWork = i }

/**
 * Which Work row is at a point in buffer coordinates, or -1.
 *
 * The boxes come from the same pass that drew them, so a row can never be
 * clickable somewhere it is not painted.
 */
export function workRowAt(x, y) {
  for (const r of workRows)
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.i
  return -1
}
export function setFigure(f) { figure = f }
export function setBust(rows) { bustRows = rows }
export function setFace(f) { faceOverride = f }
export function triggerReaction() { reaction.trigger() }
export function disposeReaction() { reaction.dispose() }

/** Which Face is live right now, override included. */
export const currentFace = () => faceOverride || faceFor(vigil)
export const moduleIndex = () => mod

/**
 * Paint one frame into the buffer and hand it back.
 *
 * `t` is seconds and `dt` is the delta since the last call — the caller owns the
 * clock, because the Unit already has one and two rAF loops disagreeing about the
 * time is how the raven ends up flying at a different speed than the Cast.
 */
/**
 * The Screen powering on, 0 to 1.
 *
 * Driven by `intro.js` while the camera travels, so the display comes up *under*
 * the move rather than after it. Held at 1 for the rest of the session — this is
 * an arrival, not an effect the Unit does again.
 */
let boot = 1
export function setBoot(k) { boot = clamp01(k) }

/**
 * A cathode tube finding itself — and saying what it is while it does.
 *
 * The loading lives *here*, in the Screen's own 320x180 buffer, rather than as an
 * overlay on the page. The page is the room the Unit sits in; the Unit is the
 * thing that switches on. A div fading over the top said "this website is
 * loading", which is a different sentence.
 *
 * Four beats, in the order a tube actually does them:
 *
 *   the line     a single bright scan snaps across the middle
 *   the aperture it eases open out of that line, vertically
 *   the self-test the Unit names itself and counts its own parts
 *   the settle   the boot type clears and the Module comes up under it
 *
 * Drawn *over* the finished frame, so nothing below has to know the Screen is
 * still waking up.
 */
function powerOn(t) {
  if (boot >= 1) return
  const k = boot

  /* the aperture, easing open out of a single line */
  const open = clamp01(k / 0.38)
  const eased = 1 - Math.pow(1 - open, 3)
  const half = Math.max(0.5, (H / 2) * eased)
  const y0 = Math.round(H / 2 - half), y1 = Math.round(H / 2 + half)

  g.fillStyle = '#000'
  g.fillRect(0, 0, W, y0)
  g.fillRect(0, y1, W, H - y1)

  /* the hot edges of the sweep, while it is still travelling */
  if (open < 1) {
    g.fillStyle = '#CFEBD8'
    g.fillRect(0, y0, W, 1)
    g.fillRect(0, y1 - 1, W, 1)
  }

  /**
   * The boot wears the Module's own chrome.
   *
   * It was a name floating on black, which is a *different object* from the thing
   * that comes up half a second later — same Screen, two design languages. So it
   * is built from exactly the pieces `grimoireChrome` uses: the double rule and
   * the ruled inner line, the four foliate `corner()` ornaments, blackletter where
   * the Modules put their titles, Silkscreen for the machine's small print, the
   * header rule at y=44 that every Module hangs its body under, and the leader
   * dots the Rack runs between a row and its value. The slot readout becomes the
   * boot percentage, in the place a Module says MOD 03/06.
   */
  const typeIn = clamp01((k - 0.14) / 0.34)
  const typeOut = clamp01((k - 0.86) / 0.14)
  const show = typeIn > 0 ? (1 - typeOut) : 0
  if (show > 0.01) {
    g.save()
    g.globalAlpha = show
    g.fillStyle = BG
    g.fillRect(0, y0, W, y1 - y0)

    /* the Module's frame, drawn the way grimoireChrome draws it */
    g.fillStyle = INK
    g.fillRect(5, 5, W - 10, 1); g.fillRect(5, H - 6, W - 10, 1)
    g.fillRect(5, 5, 1, H - 10); g.fillRect(W - 6, 5, 1, H - 10)
    tone(8, 8, W - 16, 1, .5, INK); tone(8, H - 9, W - 16, 1, .5, INK)
    corner(8, 8, 1, 1); corner(W - 9, 8, -1, 1)
    corner(8, H - 9, 1, -1); corner(W - 9, H - 9, -1, -1)

    /* header band, in the Module's own places */
    g.font = '17px UnifrakturMaguntia, serif'
    g.fillStyle = INK
    g.fillText('Tenebrae', 20, 32)
    g.font = '8px Silkscreen, monospace'
    g.fillStyle = MID
    const pct = String(Math.round(clamp01(k / 0.86) * 100)).padStart(3, ' ') + '%'
    g.fillText(pct, W - 20 - g.measureText(pct).width, 40)
    tone(18, 44, W - 36, 1, .4, INK)

    /**
     * The name, in the Unit's own hand.
     *
     * Blackletter, the same face the Modules title themselves with, because the
     * name is the one line on this Screen that is not machine output — everything
     * else the boot says is the device talking about itself.
     *
     * Title case, not caps: blackletter capitals are near-illegible in a run, and
     * the whole tradition sets them as initials with lowercase behind. Still eaten
     * out by a cursor — a dissolve at 320x180 is mush, a cursor running along a
     * line is legible at any size and is what a terminal actually does.
     */
    const NAME = 'Fernando Bittencourt'
    const shown = NAME.slice(0, Math.round(NAME.length * typeIn))
    g.font = '21px UnifrakturMaguntia, serif'
    g.fillStyle = INK
    g.fillText(shown, 20, 88)
    if (typeIn < 1 && Math.floor(t * 5) % 2) {
      g.fillRect(20 + Math.round(g.measureText(shown).width) + 3, 76, 5, 13)
    }

    /* what he does, under the name, once it has finished arriving */
    if (typeIn >= 1) {
      g.font = '8px Silkscreen, monospace'
      g.fillStyle = DIM
      g.fillText('FRONT-END  ·  WEB DESIGN  ·  AI', 20, 106)
    }

    /* the machine counting itself, on the leader the Rack uses for its rows */
    const CHECKS = [['PLATE', 0.40], ['DECKS', 0.55], ['PHOSPHOR', 0.70]]
    g.font = '8px Silkscreen, monospace'
    CHECKS.forEach(([label, at], i) => {
      if (k < at) return
      const y = 126 + i * 12
      g.fillStyle = DIM
      g.fillText(label, 20, y)
      const lw = g.measureText(label).width
      leader(20 + lw + 6, y - 3, W - 62 - lw, DIM)
      g.fillStyle = k > at + 0.06 ? GOLD : MID
      g.fillText('OK', W - 20 - g.measureText('OK').width, y)
    })

    g.restore()
  }

  /* brightness climbing once the aperture is open */
  const settle = clamp01((k - 0.5) / 0.5)
  if (settle < 1) {
    g.globalAlpha = (1 - settle) * 0.6
    g.fillStyle = '#000'
    g.fillRect(0, 0, W, H)
    g.globalAlpha = 1
  }
}

export function render(t, dt) {
  if (figure !== 'none') updateRaven(dt, t, perchOf(stage()), roamOf(stage()))
  /* the room's light first — every draw below reads the palette it sets */
  setPalette(dusk(vigil))
  DIRS[currentFace()](MODULES[mod], t)
  curtain()
  powerOn(t)
  return buf
}

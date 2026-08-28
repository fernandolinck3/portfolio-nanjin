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
import { MODULES, WORKS, GAP, LYRA_NAME, lyraAt, LYRA_IDLE_MS } from '../../src/content/modules.ts'
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
/** The paragraph's ink: a step from `INK` toward `MID`, so it is not the title. */
let BODY = DAY.ink

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
  BODY = mix(INK, MID, .38)
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
  /**
   * Sentence case, not caps.
   *
   * The header is blackletter, and blackletter capitals are near-illegible in a
   * run — "CRITÉRIOS" set in UnifrakturMaguntia is a row of shapes. The lowercase
   * forms are what that face is *for*. The Pads keep their caps: those are silkscreen
   * on metal, where caps are the convention and the words are short.
   */
  g.fillText(sentence(m.title), 52, 32)
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

/**
 * The footer — the line that says what just happened, or what a control would do.
 *
 * Precedence is deliberate: a **flash** beats a **hint** beats the Module's own
 * standing line. A hint is a question the visitor is asking with the pointer ("what
 * is this Pad?"); a flash is the answer to something they already did. An answer
 * outranks a question.
 *
 * The `COLS` and `+N LINES` readouts stay, pushed to the right. They are the
 * Screen saying out loud when a Module does not fit it, which is the thing that
 * kept the no-scrolling constraint honest, and losing them to a prettier footer
 * would mean losing the only place overflow is ever reported.
 */
function grimoireStatus() {
  g.font = '8px Silkscreen, monospace'
  const now = performance.now()
  if (flash && now > flashUntil) flash = ''

  const m = MODULES[mod]
  /**
   * On an index page the standing line says nothing the page does not.
   *
   * It read `PROJETO 01/03 · PORTFÓLIO` under a list whose first row was already
   * marked with a filled dot and spelled out — and in PROJETOS the list is three
   * rows deep, so the line landed **on top of the third project**: *"em projetos, o
   * texto inferior esquerdo tapa os projetos. Remova-o."*
   *
   * It stays everywhere it carries something: on a case page, where it is the only
   * thing reporting which page of how many; on a Module with no list; and whenever a
   * flash or a hover hint has something to say. What goes is the one case where the
   * footer was repeating the screen back to itself.
   */
  const onIndex = (m.items?.length || 0) > 0 && (placeOf(mod).sec || 0) === 0
  const line = flash || hint || (onIndex ? '' : standingLine(m))
  if (!line && !overflow) return

  /**
   * The footer gets its own ground.
   *
   * LYRA stands to the floor of the panel, so on the four Modules where she is on
   * the left her robe is *behind* this line, and 8px Silkscreen over a dithered robe
   * is a smear — `CAMADAS 01/04` came out as a row of broken glyphs. Every other
   * band on the Screen is cleared before it is written on; this one never was,
   * because for most of its life nothing stood under it.
   */
  g.save()
  g.globalAlpha = .92
  g.fillStyle = BG
  g.fillRect(14, H - 22, W - 28, 16)
  g.restore()

  g.fillStyle = flash ? GOLD : hint ? INK : DIM
  g.fillText(line.slice(0, 46).toUpperCase(), 20, H - 14)

  /**
   * `29 COLS` is gone from the corner.
   *
   * It was the Screen reporting its own measurements — useful while the layout was
   * being fitted, and noise once it was. Fernando wanted the corner for the status
   * line: *"tem um texto no canto inferior direito dizendo 29 cols — ele pode ser
   * removido para a mensagem de estado ficar ali."*
   *
   * The overflow warning stays, because that one is not a measurement, it is the
   * Screen saying a Module does not fit — the only place that is ever reported.
   */
  if (overflow) {
    /* left of wherever the page marks end, so the two right-hand readouts never
       stack on top of each other */
    const over = '+' + overflow
    g.fillStyle = GOLD
    g.fillText(over, W - 26 - markSpan - g.measureText(over).width, H - 14)
  }
}

/**
 * What the footer says when nothing is flashing and nothing is hovered.
 *
 * The cursor can sit **past the end** — that is the seventh detent, and it is the
 * one position with no item under it. Reading `items[sel].label` there threw and
 * took the whole Screen down with it, which is the cost of assuming a selection
 * always points at something.
 */
function standingLine(m) {
  /* ECLIPSE first, and above the no-items shortcut — QUEM has no items, so opening
     the seventh state from QUEM left the footer still saying QUEM. */
  if (eclipseOpen) return 'ECLIPSE'
  if (!m.items?.length) return m.title.replace(' / ', '/')
  const p = placeOf(mod)
  const n = m.items.length
  if (p.sel >= n) return m.title.replace(' / ', '/')
  const it = m.items[p.sel]
  /* on a section page the item is already the heading above; the page number is the
     thing the reader cannot see, so that is what the footer spends its width on */
  if (p.sec > 0 && pageMax) {
    return `${it.label} · ${String(p.sec).padStart(2, '0')}/${String(pageMax).padStart(2, '0')}`
  }
  return `${m.unit} ${String(p.sel + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`
    + ` · ${it.label}`
}

/* ---------- the stage ----------
   Each Module is composed around what she is doing in it, rather than laid out
   first and given a panel afterwards. She moves side to side, changes height,
   and changes what is in her hands; the body of the Module takes what is left.
   `fy` is her feet. */
/**
 * Where she stands, and what is left for the body.
 *
 * `bx`/`bw` is the body's column and `fx` is hers, and the two must not overlap —
 * which slot 2 did, spectacularly: she stood at `W/2` while the body spanned the
 * full width, so the list was drawn straight over her. "em projetos, a lyra atrás
 * tá dificultando a leitura." She moves to the left edge and the body starts after
 * her, the same arrangement every other Module already used.
 */
const CHROME_H = 52
/* Air under the header. The title's rule and the first line of the paragraph were
   touching, which made the two read as one block — see `by` below, which is now the
   rule's baseline plus this rather than a number picked by eye. */
const TITLE_GAP = 8
const STAGE = [
  { fx: W - 50, fy: H - 14, fh: 92, pose: 'present', bx: 20,  bw: W - 118, by: 60 + TITLE_GAP },
  { fx: 44,     fy: H - 12, fh: 78, pose: 'balance', bx: 92,  bw: W - 114, by: 58 },
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
/**
 * Where the raven is allowed to land — **the header rule, never the text.**
 *
 * `st.by + 24` put it a line and a half *into* the body, so it sat on the copy and
 * the reader had a bird in the paragraph: *"the raven should never fly to the text.
 * he can fly to the line that separates the title from the content."*
 *
 * That line is real and fixed: `grimoireChrome` strikes it at y = 44, and every
 * Module hangs its body under it. The bird perches a few pixels above it, on the
 * rule itself, which is the one horizontal in the layout that belongs to nothing
 * else. `hi` also stops short of the body's right edge so it cannot drift over the
 * page marks.
 */
const RULE_Y = 44
const roamOf = st => ({ lo: 34, hi: W - 44, y: RULE_Y - 3 })

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

  /**
   * Prefer sitting above her; if the Module has pushed her high, sit beside her —
   * but never above `CHROME_H`.
   *
   * The clamp used to be 4, which is the top of the Screen rather than the top of
   * the *body*. On QUEM she stands tall and to the right, so the bubble ran up into
   * the header band and painted over the module counter and the celestial mark:
   * "o balão de fala da lyra tá ocupando o texto abaixo do sol e lua no canto
   * superior direito". The chrome is drawn before her and is not hers to cover.
   */
  let x = Math.round(box.x + (28 * box.scale) / 2 - w / 2)
  let y = box.y - h - 6
  if (y < CHROME_H) y = CHROME_H
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
/** `CRITÉRIOS` → `Critérios`. Locale-aware, so the accents survive. */
const sentence = t => t.charAt(0).toLocaleUpperCase('pt-BR') + t.slice(1).toLocaleLowerCase('pt-BR')

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

/**
 * The page ground — a near-solid sheet laid over LYRA so the body can use the width.
 *
 * Solid rather than a dither, because a dithered veil is a checkerboard and 13px
 * VT323 on one is unreadable: the glyph stems and the pattern are the same width.
 * At .93 she stays a ghost behind the paper, which is the effect wanted, and the
 * dithered top edge keeps it from reading as a rectangle pasted on.
 */
function pageScrim() {
  g.save()
  g.globalAlpha = .93
  g.fillStyle = BG
  g.fillRect(14, RULE_Y + 6, W - 28, FLOOR - RULE_Y - 2)
  g.restore()
  tone(14, RULE_Y + 3, W - 28, 3, .5, BG)
}

function grimoire(m, t) {
  overflow = 0
  grimoireChrome(m, t)

  const st = stage()
  const cast = castP()
  const casting = figure !== 'none' && cast > 0 && cast < 1
  let hands = null

  /**
   * Is this a page of the case rather than the index?
   *
   * Needed *here*, above the figure, because a page draws a scrim over her and her
   * speech bubble is the one thing a scrim cannot save: bubble text at 12% behind
   * body text at 100% is two paragraphs in the same place, which is exactly the
   * complaint that started this — *"a lyra atrás tá dificultando a leitura."* She
   * still holds the page; she just stops talking over it. What she has to say is
   * about the index anyway, which is one turn of the SUN away.
   */
  /**
   * Does this Module's body take the whole panel?
   *
   * Two cases, and they want the same thing. A **page of a case** does, because prose
   * needs the width. And a Module with **no items** does, because the strip beside
   * LYRA exists to leave room for a list, and where there is no list it is 120px of
   * panel spent on nothing — which is why QUEM, the one Module without items, was
   * both the tightest column on the object and the only one overflowing it.
   *
   * Needed above the figure, because the full width means drawing over her, and her
   * speech bubble is the one thing a scrim cannot rescue: bubble text at 7% under
   * body text at 100% is two paragraphs in the same place. In QUEM the bubble was
   * also lying — *"A LUA escolhe o item"* in the Module that has none.
   */
  const wide = !(m.items || []).length || (placeOf(mod).sec || 0) > 0
  const onPage = wide

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
      if (m.id === 'now-next') heldOrbs(g, hands.leftHand, hands.rightHand, .5, INK, DIM, t)
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
    if (!casting && !onPage) drawBubble(g, box, lyraLines(), INK, MID, BG)
  } else if (figure !== 'none') {
    const fig = { x: st.fx, y: st.fy, h: st.fh }
    hands = drawWizard(g, fig, st.pose, t, INK, DIM, BG, casting && cast < .55 ? 1 : 0)
    /* what she is holding is what makes the pose an action rather than a shape */
    if (!casting) {
      if (m.id === 'now-next') heldOrbs(g, hands.leftHand, hands.rightHand, .5, INK, DIM, t)
      else if (st.pose === 'read') heldBook(g, hands.leftHand, hands.rightHand, INK, DIM, BG, t)
      else if (st.pose === 'craft') heldUnit(g, hands.leftHand, hands.rightHand, INK, DIM, BG, t)
    }
  }

  const x0 = BODY_X(), bodyW = BODY_W()
  let y = st.by
  const typed = clamp01((since() - CAST_MS * .5) / .8)
  g.font = '13px VT323, monospace'

  /**
   * One Module, two kinds of page — and **nothing scrolls** (ADR-0024, amended).
   *
   * Scrolling was tried for one round and gave the reader a 98px window onto a
   * column, which is a worse cramped than the one it replaced: *"não estou gostando
   * de como o texto está ficando dentro do painel, ele tá em um espaço muito
   * enclausurado."* A small screen does not want a long column moved through a slot.
   * It wants **fewer words, laid out properly, one page at a time.**
   *
   *   page 0    the lead and the item list — the index, and where the Moon works
   *   page 1..n one section of the selected item, alone, in the whole body
   *
   * The Sun turns pages. That is the same control doing the same job as before; it
   * just moves a whole screen instead of twenty-two pixels. And because a section
   * page has the body to itself, it gets real leading and real margins rather than
   * whatever was left under a list.
   */
  const p = placeOf(mod)
  const items = m.items || []
  const past = items.length > 0 && p.sel >= items.length
  const sel = items.length && !past ? Math.min(p.sel, items.length - 1) : -1
  const item = sel >= 0 ? items[sel] : null
  const sections = (item && m.id !== 'projects') ? item.sections : []

  /**
   * **The renderer paginates, because only the renderer can measure.**
   *
   * One section is not one page. A section is up to five 58-character lines, and a
   * full-width page holds six *rendered* lines — at 13px VT323 a 58-character line
   * wraps to two, so a five-line section is ten lines and would silently overflow.
   * The alternative was cutting the writing down to what fits a slide, which is the
   * budget solving a layout problem by deleting content.
   *
   * So sections flow into as many pages as their wrapped length needs, and a new
   * section always starts a new page — a heading is a break, and running two of them
   * onto one screen would put a title halfway down a page of the previous one. A
   * section continuing onto a second page repeats its heading with a `·` so the
   * reader knows they have not arrived somewhere new.
   *
   * `pageMax` is then written out for the controller to clamp against, the same
   * contract the scroll offset used: the draw is the only thing that knows.
   */
  const PAGE_LINES = 6
  const pages = []
  if (sections.length) {
    g.font = '13px VT323, monospace'
    for (const sec of sections) {
      const src = sec.lines.length ? sec.lines : [GAP]
      const flat = []
      for (const l of src) flat.push(...wrap(l, W - 40))
      for (let i = 0; i < flat.length; i += PAGE_LINES) {
        pages.push({
          heading: sec.heading, cont: i > 0,
          gap: !sec.lines.length, lines: flat.slice(i, i + PAGE_LINES),
        })
      }
    }
  }
  pageMax = pages.length
  markSpan = pages.length * 7
  const page = Math.max(0, Math.min(pages.length, p.sec || 0))

  if (page === 0) {
    /**
     * The lead, as paragraphs with air between them.
     *
     * It used to be one undifferentiated run of lines, so the name ran straight into
     * the sentence under it: *"precisa-se adicionar um espaço entre o título do
     * módulo quem e o parágrafo."* `m.lead` has always been a list of separate
     * statements; this stops flattening it into one.
     */
    const lx = wide ? 20 : x0, lw = wide ? W - 40 : bodyW
    if (wide) { pageScrim(); y = RULE_Y + 20 }

    const paras = m.lead.map(l => wrap(l, lw))
    const total = paras.reduce((n, q) => n + q.length, 0)
    let budget = Math.max(1, Math.floor(total * typed + .0001))
    for (const q of paras) {
      if (budget <= 0) break
      y = flow(q.slice(0, budget), lx, y, 14, BODY)
      budget -= q.length
      y += 7
    }

    workRows = []
    if (items.length) {
      y += 6
      const top = y - 8, span = items.length * 13
      tone(x0 - 8, top, 1, span, .3, INK)
      items.forEach((it, i) => {
        if (i / items.length > typed) return
        workRows.push({ i, x: x0 - 8, y: y - 10, w: bodyW + 12, h: 13 })
        const on = i === sel
        if (i === hoverWork && !on) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x0 - 8, y - 10, bodyW + 12, 13) }
        g.fillStyle = on ? GOLD : DIM
        if (on) disc(g, x0 - 8, y - 3, 3); else ring(g, x0 - 8, y - 3, 2, 1)
        g.font = '12px VT323, monospace'
        g.fillStyle = on ? INK : MID
        g.fillText(it.label, x0 + 4, y)
        if (it.meta) {
          g.font = '8px Silkscreen, monospace'
          const mw = g.measureText(it.meta).width
          g.fillStyle = on ? GOLD : DIM
          g.fillText(it.meta, x0 + bodyW - mw, y - 1)
        }
        y += 13
      })
    }
    const dimAll = []
    for (const l of (m.dim || [])) dimAll.push(...wrap(l, lw))
    if (dimAll.length) { y += 2; y = flow(dimAll, lx, y, 12, DIM) }

  } else {
    /**
     * A page of the case — **the whole panel, not the column left over.**
     *
     * *"Não estou gostando de como o texto está ficando dentro do painel, ele tá em
     * um espaço muito enclausurado."* He was right, and the cause was structural: the
     * body has always been the strip beside LYRA, ~200px of a 320px screen, because
     * every Module until now drew a list next to her. A page of prose in that strip
     * wraps every sentence twice and stacks into a brick.
     *
     * So a page takes the full width and hangs from the header rule. She is still
     * there — this is her book — but she goes **behind a scrim**, which is the lesson
     * from PROJETOS: *"a lyra atrás tá dificultando a leitura."* Drawing her behind
     * text without one is what made that unreadable; with one, the full width is
     * available and she is still visibly holding the page.
     */
    const pg = pages[page - 1]
    const sx = 20, sw = W - 40
    pageScrim()

    g.font = '8px Silkscreen, monospace'
    g.fillStyle = GOLD
    g.fillText(pg.cont ? pg.heading + ' ·' : pg.heading, sx, RULE_Y + 14)
    tone(sx, RULE_Y + 19, sw, 1, .3, INK)

    g.font = '13px VT323, monospace'
    g.fillStyle = pg.gap ? DIM : BODY
    let cy = RULE_Y + 34
    for (const l of pg.lines) { g.fillText(l, sx, cy); cy += 15 }
    y = cy
  }

  /**
   * The page marks, bottom right.
   *
   * Dots rather than a scrollbar, because there is nothing continuous left to report
   * — a reader on page 2 of 5 wants to know there are five, not what fraction of a
   * column is showing. Filled is where you are; the first mark is the index, which is
   * why there is always one more than there are pages of text.
   */
  if (eclipseOpen) drawEclipse(g, t, W, H, INK, MID, DIM, GOLD, BG)
  grimoireStatus()

  /* Drawn after the status, and on its row, because the status clears its own band
     and would otherwise wipe them. The marks and the footer line are the same piece
     of information anyway — where you are — so they belong on the same rule. */
  if (pages.length) {
    const n = pages.length + 1
    const dx = 7, x1 = W - 20 - (n - 1) * dx
    for (let i = 0; i < n; i++) {
      g.fillStyle = i === page ? GOLD : DIM
      if (i === page) disc(g, x1 + i * dx, H - 17, 2.2)
      else ring(g, x1 + i * dx, H - 17, 2, 1)
    }
  }

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
  const tw = g.measureText(WORDMARK).width
  g.fillStyle = '#08070A'; g.fillText(WORDMARK, W / 2 - tw / 2 + 1, 33)
  g.fillStyle = BONE; g.fillText(WORDMARK, W / 2 - tw / 2, 32)
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

  /**
   * Cracktro reads the same shape, and reads it flatter.
   *
   * This Face is unwired — the Unit is pinned to Grimoire — but it is intact and
   * kept side by side while its future is decided, which means it cannot be left
   * branching on `kind`s that no longer exist. It shows the lead, then the item
   * list with the Moon's cursor on it, and skips sections: a centred credits roll
   * is the wrong furniture for a section pager, and inventing one for a Face
   * nothing currently renders would be work spent on a coin toss.
   */
  const p = placeOf(mod)
  const items = m.items || []
  const sel = items.length ? Math.min(p.sel, items.length - 1) : -1

  wrap(m.lead.join(' '), W - 60).forEach(l => centre(l, BONE, '13px VT323, monospace', 13))

  if (items.length) {
    y += 6
    const boxW = 210, bx = (W - boxW) / 2
    items.forEach((it, i) => {
      g.font = '13px VT323, monospace'
      g.fillStyle = i === sel ? EMBER : BONE
      g.fillText(it.label, bx, y)
      const tw2 = g.measureText(it.label).width
      g.font = '8px Silkscreen, monospace'
      const meta = it.meta || ''
      const mw = g.measureText(meta).width
      leader(bx + tw2 + 4, y - 3, Math.max(4, boxW - tw2 - mw - 8), DEEP)
      g.fillStyle = i === sel ? RED : DEEP
      g.fillText(meta, bx + boxW - mw, y)
      y += 15
    })
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
      if (!casting) drawBubble(g, box, lyraLines(), BONE, DEEP, '#08070A')
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
/**
 * What the Screen calls itself.
 *
 * "Portfolio", not "Tenebrae", at Fernando's ask. The two are not the same thing and
 * conflating them was the mistake: **Tenebrae is the name of the object**, and the
 * object is Project 001 in `WORKS` — a real, checkable entry that a visitor can open
 * and read. Printing that name across the Screen's own chrome made the whole site
 * look like it was titled after one of its own exhibits. The chrome should say what
 * this *is*.
 *
 * One constant, because it is drawn by two Faces and the boot, and a wordmark that
 * disagrees with itself in one of three places is the kind of thing nobody notices
 * until it ships.
 */
const WORDMARK = 'Portfolio'

export const buffer = buf
export const SCREEN_W = W, SCREEN_H = H

/** Change Module. Restarts the Cast and sends the raven up to look at what arrived. */
export function setModule(i) {
  if (i === mod) return
  mod = i
  /* a new Module means a new atmosphere line, so her clock starts over with it */
  lyraSince = performance.now()
  switchedAt = performance.now()
  if (figure !== 'none') flush(performance.now() / 1000)
}

/** The Vigil, 0..1. Also what the reaction listens to for a Deck being turned. */
export function setVigil(v) {
  vigil = v
  reaction.notify(v)
}

export function setCrossfade(v) { xf = v }

/* ---------- selection, depth, and what the footer is saying ---------- */

/**
 * Where the Moon is standing, and how deep the Sun has gone.
 *
 * Both are **per Module**, kept in a map rather than as two numbers, because the
 * brief says pressing the active Pad again resets *that* Module to its overview —
 * which is only meaningful if leaving a Module and coming back does not. One pair
 * of globals would have made every Pad press a reset, silently.
 */
const place = new Map()
const placeOf = i => {
  let p = place.get(i)
  if (!p) place.set(i, (p = { sel: 0, sec: 0 }))
  return p
}
export const selectionOf = i => placeOf(i).sel
export const sectionOf = i => placeOf(i).sec
export function setSelection(i, sel) { placeOf(i).sel = sel; placeOf(i).sec = 0 }
export function setSection(i, sec) { placeOf(i).sec = sec }

/**
 * How many pages of text the current Module's selection has.
 *
 * Written by the draw, because pagination depends on measured text and the draw is
 * the only thing holding a canvas. The controller clamps against it rather than
 * against `sections.length`, which is no longer the same number.
 */
let pageMax = 0
export const pageRange = () => pageMax
/** Pixels the page marks occupy on the footer row, so the overflow warning clears them. */
let markSpan = 0
export function resetPlace(i) { place.set(i, { sel: 0, sec: 0 }) }


/**
 * The footer, and the two things that can speak through it.
 *
 * `flash` is what a control just did — `MOON · PROJECT 03/06 · GRAECUS`. It is
 * transient and it expires on its own clock, because the brief asks for the module
 * footer to come *back*, and a caller that has to remember to clear it will
 * eventually not.
 *
 * `hint` is a Pad describing itself under the pointer. It is **not** transient: it
 * lasts exactly as long as the hover, so it is set and unset rather than timed.
 * They are separate fields on purpose — a hover arriving during a flash must not
 * cancel the flash's timer, and a flash must not be wiped by a pointer leaving.
 */
let flash = '', flashUntil = 0, hint = ''
export function setFlash(text, ms = 1600) {
  flash = text
  flashUntil = performance.now() + ms
}
export function setHint(text) { hint = text || '' }

/* ---------- ECLIPSE, as the Screen sees it ---------- */

/**
 * The Screen holds none of ECLIPSE's logic and all of its appearance.
 *
 * `scene.js` decides what has been seen and what is unlocked; this only draws it.
 * Keeping the rule and the picture apart is what lets the workbench force the state
 * without also forging a claim — the button flips the flag, and everything here
 * follows from the flag rather than from how it came to be set.
 */
let eclipseSeen = 1, eclipseUnlocked = false, eclipseOpen = false, eclipseClaim = false
let eclipseFace = 'moon'
export function setEclipseSeen(n) { eclipseSeen = n }
export function setEclipseUnlocked(v) { eclipseUnlocked = !!v }
export function setEclipseOpen(v, claimEnabled, face) {
  eclipseOpen = !!v; eclipseClaim = !!claimEnabled
  if (face) eclipseFace = face
}
export const eclipseIsOpen = () => eclipseOpen

/**
 * The secret screen.
 *
 * Drawn over everything, and it says **exactly what is true**: the claim exists, and
 * it is not open, because there is no server to decide who was first. The brief is
 * blunt about this — the browser cannot decide a winner, and a prize announced
 * before the endpoint exists is a promise nobody can keep. So the field is visible,
 * disabled, and labelled, rather than absent or — far worse — accepting a handle it
 * would quietly drop.
 */
function drawEclipse(g, t, W, H, INK, MID, DIM, GOLD, BG) {
  g.fillStyle = BG; g.fillRect(0, 0, W, H)
  /* the constellation, complete */
  /**
   * The same screen under a different sky.
   *
   * Whichever wheel was pressed decides what hangs over the constellation — a disc
   * with a bite out of it for the MOON, a rayed one for the SUN. The words, the
   * count and the claim are identical, because they are the same state reached two
   * ways, and giving them different *content* would make them two secrets instead
   * of one with two doors.
   */
  const CY = 44
  {
    const cx = W / 2, cy = 22, r = 9
    g.fillStyle = GOLD
    if (eclipseFace === 'sun') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.2832 + t * .2
        g.fillRect(cx + Math.cos(a) * (r + 3) - .5, cy + Math.sin(a) * (r + 3) - .5, 1.6, 1.6)
      }
      g.beginPath(); g.arc(cx, cy, r * .62, 0, 6.2832); g.fill()
    } else {
      g.beginPath(); g.arc(cx, cy, r * .8, 0, 6.2832); g.fill()
      g.fillStyle = BG
      g.beginPath(); g.arc(cx + r * .42, cy - r * .22, r * .74, 0, 6.2832); g.fill()
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.2832 - Math.PI / 2
    const x = W / 2 + Math.cos(a) * 42, y = CY + Math.sin(a) * 20
    g.fillStyle = GOLD
    g.beginPath(); g.arc(x, y, 1.6, 0, 6.2832); g.fill()
    const nx = W / 2 + Math.cos(a + 1.047) * 42, ny = CY + Math.sin(a + 1.047) * 20
    g.strokeStyle = 'rgba(214,170,90,.30)'; g.lineWidth = 1
    g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke()
  }
  const pulse = .55 + .45 * Math.sin(t * 2)
  g.fillStyle = GOLD
  g.globalAlpha = pulse
  g.beginPath(); g.arc(W / 2, CY, 4.5, 0, 6.2832); g.fill()
  g.globalAlpha = 1

  g.font = '8px Silkscreen, monospace'; g.fillStyle = GOLD
  /* `SINAL 07` named the seventh detent, which no longer exists — the light is the
     key now. `SEXTO PARA SÉTIMO` names what actually happened to get here. */
  const tag = 'ECLIPSE / SEXTO PARA SÉTIMO'
  g.fillText(tag, W / 2 - g.measureText(tag).width / 2, 82)

  g.font = '12px VT323, monospace'; g.fillStyle = INK
  let y = 98
  for (const l of ['Seis sinais alinhados.', 'Um ficou fora do índice.']) {
    g.fillText(l, W / 2 - g.measureText(l).width / 2, y); y += 12
  }

  y += 4
  g.font = '8px Silkscreen, monospace'
  g.fillStyle = eclipseClaim ? MID : DIM
  const label = eclipseClaim ? '@ DO INSTAGRAM' : 'TRANSMISSÃO AINDA NÃO ABERTA'
  g.fillText(label, W / 2 - g.measureText(label).width / 2, y)
  y += 10
  /* the field, drawn as a real control and plainly inert */
  const fw = 150, fx = W / 2 - fw / 2
  g.strokeStyle = eclipseClaim ? MID : DIM
  g.lineWidth = 1
  g.strokeRect(fx + .5, y + .5, fw, 14)
  if (!eclipseClaim) {
    g.fillStyle = DIM
    g.font = '8px Silkscreen, monospace'
    const off = 'SEM SERVIDOR'
    g.fillText(off, W / 2 - g.measureText(off).width / 2, y + 10)
  }
  y += 22
  g.fillStyle = DIM
  /* Not `LUA · VOLTAR` any more: the wheels have no button in them. Esc is the way
     out everywhere on the object, so it is the one to name. */
  const back = 'ESC · VOLTAR'
  g.fillText(back, W / 2 - g.measureText(back).width / 2, y)
}

/**
 * LYRA says two things, and only ever two.
 *
 * `open` when the Module arrives — atmosphere, the line that belongs to *this*
 * Module. Then, after six seconds with nobody touching anything, `idle`: the
 * functional one, which names the MOON and the SUN because it is the only
 * instruction a visitor gets without going looking for it.
 *
 * **It never loops.** Once she has said the useful thing she keeps saying it, until
 * the visitor does something — at which point the clock restarts and the atmosphere
 * comes back. A bubble that alternates on a timer is a bubble nobody reads, because
 * the eye learns it will change again on its own and stops treating it as a message.
 *
 * The clock lives here rather than in `scene.js` because the bubble is drawn here
 * and this is the only place that knows when it is actually on screen. `touch()` is
 * what the hardware calls; everything the hand can do routes through it.
 */
let lyraSince = performance.now()
export function touchLyra() { lyraSince = performance.now() }
/** Which of the two lines is live right now — exposed so the tests can be about time. */
export const lyraPhase = () => (performance.now() - lyraSince >= LYRA_IDLE_MS ? 'idle' : 'open')
const lyraLines = () => lyraAt(mod)[lyraPhase()]

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
/** The power-on level, 0..1. Exposed so the opening can be *watched*, not guessed at. */
export const bootLevel = () => boot

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
/**
 * **Dark from the first byte.**
 *
 * This defaulted to 1 — a Screen already on — because the workbench page wants one
 * without an opening to wait for. That default was also a window: between this
 * module evaluating and `scene.js` calling `setBoot(0)` a few hundred lines later,
 * `boot` was 1, and anything that painted in between showed the Module before the
 * power-on. Fernando saw it twice: *"o primeiro módulo aparece brevemente antes da
 * tela de loading."*
 *
 * Closing the window by moving the call earlier only makes it smaller. Starting at
 * 0 removes it: there is no instant at which this file believes the Screen is on
 * before something has said so. `screen/screen.js` says so for itself.
 */
let boot = 0
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
  /**
   * **The panel is up from the first frame, not from `typeIn`.**
   *
   * This is the flash Fernando reported three times: *"o primeiro módulo aparece
   * brevemente antes da tela de loading."* Two guesses at it were wrong — the
   * default value of `boot`, then the order of the setter — and both were wrong in
   * the same way, because the module was never being shown *instead of* the boot.
   * It was being shown **through** it.
   *
   * `powerOn` draws over the finished Module frame, and the aperture opens on
   * `k / 0.38`. The panel used to be gated on `typeIn`, which does not start until
   * `k = 0.14` — by which point the eased aperture is already **three quarters of
   * the Screen tall**. So for the first tenth of the boot there was a widening
   * window with the live Module behind it and nothing drawn on top, and then the
   * panel faded in and covered it. Module, then loading, exactly as described.
   *
   * The panel now stands the whole time and only the *typing* is timed. Nothing
   * else changes: `typeIn` still runs the name, `typeOut` still clears it, and the
   * aperture still opens on its own curve — it just opens onto the boot rather than
   * onto the Module.
   */
  const typeIn = clamp01((k - 0.14) / 0.34)
  const typeOut = clamp01((k - 0.86) / 0.14)
  const show = 1 - typeOut
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
    g.fillText(WORDMARK, 20, 32)
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

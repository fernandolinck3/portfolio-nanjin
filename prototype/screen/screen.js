/* Screen design workbench.
   Directions for the Unit's Screen, drawn from the `display` are.na board and
   rendered at the internal resolution the real Screen would use (320x180), shown
   at 3x so the design can be judged and at 1x so it can be judged the way a
   visitor meets it — a ~300px inset on the Plate.

   Grimoire and Cracktro are the chosen register (2026-08-25). Instrument is kept
   only so the comparison can still be made; it is not being developed.

   Every Module has its own layout. Nothing on screen is allowed to sit still. */
import { MODULES, LYRA_NAME, lyraAt } from '../../src/content/modules.ts'
import { EMBLEMS, disc, ring } from './sprites.js'
import { drawWizard, drawRaven, updateRaven, flush, drawSpell, castHand,
         heldOrbs, heldBook, heldUnit, drawRobe } from './figure.js'
import { BUST, BUST_PREV, RAVEN, STAFF, ANCHOR, drawSprite, SPRITE_W, SPRITE_H } from './drawn.js'
import { REACTION_FRAMES, REACTION_W, REACTION_H } from './reaction-frames.js'
import { createKnobReaction } from './reaction.js'

const W = 320, H = 180
const buf = document.createElement('canvas'); buf.width = W; buf.height = H
const g = buf.getContext('2d')
const big = document.getElementById('big').getContext('2d')
const real = document.getElementById('real').getContext('2d')
big.imageSmoothingEnabled = real.imageSmoothingEnabled = false

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

const INK = '#E9E3D2', MID = '#8A8470', DIM = '#5E5A4C', BG = '#0A0B09', GOLD = '#C9BE96'

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
  g.fillText(slot, W - 20 - g.measureText(slot).width, 30)
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
  let wide = g.measureText(LYRA_NAME).width
  for (const l of lines) wide = Math.max(wide, g.measureText(l).width)
  const w = Math.ceil(wide) + PAD * 2
  const h = NAME_H + lines.length * LH + PAD * 2

  /* Prefer sitting above her; if the Module has pushed her high, sit beside her. */
  let x = Math.round(box.x + (28 * box.scale) / 2 - w / 2)
  let y = box.y - h - 6
  if (y < 4) y = 4
  x = Math.max(4, Math.min(W - w - 4, x))

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

  if (m.kind === 'thesis') {
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
      const yr = r[2], yw = g.measureText(yr).width
      leader(x0 + 16 + tw, y + 7, Math.max(4, bodyW - 20 - tw - yw), DIM)
      g.fillStyle = i === 0 ? GOLD : DIM
      g.fillText(yr, x0 + bodyW - yw, y + 8)
      y += 18
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
    const dimAll = []
    for (const l of (m.dim || [])) dimAll.push(...wrap(l, bodyW))
    y = flow(dimAll, x0, y, 12, DIM)
    if (y <= FLOOR && Math.floor(t * 2) % 2) { g.fillStyle = INK; g.fillRect(x0, y - 9, 5, 8) }
  }

  grimoireStatus()

  /* the raven, then the spell over everything */
  if (figure !== 'none' && hands) {
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
 * The Vigil chooses the Face. Grimoire is the day face and burns while any candle
 * is still alight; Cracktro is the night face and takes over once the last one
 * dies and the Screen's phosphor is the only source left in the room.
 *
 * 0.94 is not a taste threshold — it is where the third candle's ramp reaches zero
 * in `scene.js` (`RAMPS[2] = [.56, .94]`). If that ramp moves, this moves with it.
 * Reverses ADR-0012, which had the visitor switching Faces by hand; see ADR-0015.
 */
export const LAST_CANDLE_OUT = 0.94
const faceFor = v => (v >= LAST_CANDLE_OUT ? 'cracktro' : 'grimoire')

/** Module changes are a cut with a dithered curtain across it, not a fade. */
function curtain() {
  const p = since() / .34
  if (p >= 1) return
  const level = p < .5 ? p * 2 : (1 - p) * 2
  const night = faceFor(vigil) === 'cracktro'
  tone(0, 0, W, H, level, night ? '#08070A' : '#0A0B09')
  tone(0, 0, W, H, level * .5, night ? RED : INK)
}

let last = 0
function frame(now) {
  const t = now / 1000
  const dt = Math.min(.05, last ? t - last : 0); last = t
  if (figure !== 'none') updateRaven(dt, t, perchOf(stage()), roamOf(stage()))
  DIRS[faceFor(vigil)](MODULES[mod], t)
  curtain()
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
press('mod', v => {
  mod = +v
  /* something arrived — the raven goes to look at it */
  if (figure !== 'none') flush(performance.now() / 1000)
})
press('xf', v => { xf = +v })
press('fig', v => { figure = v })
press('bust', v => { bustRows = v === 'prev' ? BUST_PREV : BUST })

/* The Vigil slider stands in for a Deck: it fires on every input event, in small
   steps, which is exactly the signal `notify` is built to ignore until it adds up. */
const vigilEl = document.getElementById('vigil')
const faceEl = document.getElementById('face')
const showFace = () => { if (faceEl) faceEl.textContent = faceFor(vigil).toUpperCase() }
showFace()
if (vigilEl) vigilEl.addEventListener('input', () => {
  vigil = +vigilEl.value / 100
  reaction.notify(vigil)
  showFace()
})
const trigEl = document.getElementById('trigger')
if (trigEl) trigEl.addEventListener('click', () => reaction.trigger())

/* The workbench page lives as long as the tab does, but the reaction owns a
   reduced-motion listener, so it gets released with the page all the same. */
addEventListener('pagehide', () => reaction.dispose(), { once: true })

/* An unused family silently falls back, and document.fonts.ready will not load a
   face nothing has asked for. Ask for each one by name. */
Promise.all([
  document.fonts.load('8px Silkscreen'), document.fonts.load('13px VT323'),
  document.fonts.load('22px UnifrakturMaguntia'), document.fonts.load('17px UnifrakturMaguntia'),
]).then(() => requestAnimationFrame(frame))

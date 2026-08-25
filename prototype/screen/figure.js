/* The Wizard, and her Raven.

   Chibi proportions on purpose — the head is nearly half her height, which is
   what separates "cute" from "sinister" at this size. A gaunt hooded figure and
   a friendly one differ by about six pixels of skull.

   She does something different in every Module, and the Module is laid out
   around what she is doing rather than beside a panel she was pasted into. When
   the Module changes she casts, and the cast is the transition.

   Solid 1-bit, procedural (ADR-0004). */

const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]

function disc(g, cx, cy, r) {
  const r2 = r * r
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r2) g.fillRect(cx + x, cy + y, 1, 1)
}

function ring(g, cx, cy, r, w = 1) {
  const o = r * r, i = (r - w) * (r - w)
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y
    if (d <= o && d > i) g.fillRect(cx + x, cy + y, 1, 1)
  }
}

function dot(g, cx, cy, r, level) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r * r && level * 16 > BAYER[(cx + x) & 3][(cy + y) & 3])
      g.fillRect(cx + x, cy + y, 1, 1)
}

/** A four-point star — her mark, and the spark her spells throw. */
export function star(g, cx, cy, r) {
  g.fillRect(cx - r, cy, r * 2 + 1, 1)
  g.fillRect(cx, cy - r, 1, r * 2 + 1)
  if (r > 2) {
    g.fillRect(cx - 1, cy - 1, 3, 3)
  }
}

/* ---------- poses ----------
   Each is [shoulder-angle, length] per arm, in radians, 0 = straight down.
   Positive swings the arm away from her body. */
export const POSES = {
  present: { l: [-0.35, 9], r: [-2.2, 12] },   /* one arm out, palm up */
  balance: { l: [-1.75, 22], r: [1.75, 22] },  /* both arms out clear of the robe, an orb in each */
  craft:   { l: [-0.9, 10], r: [0.9, 10] },    /* both hands together in front */
  point:   { l: [-0.3, 9], r: [2.55, 14] },    /* one arm up and out, pointing */
  read:    { l: [-1.0, 9], r: [1.0, 9] },      /* holding a book open */
  send:    { l: [-0.3, 9], r: [2.9, 13] },     /* arm high, letting the raven go */
  cast:    { l: [-0.6, 10], r: [2.95, 15] },   /* the spell */
}

/** Where her casting hand is, in screen pixels. Sparks come from here. */
export function castHand(fig) {
  const H = fig.h, cx = fig.x, feet = fig.y
  const sh = feet - H * .30
  const [a, len] = POSES.cast.r
  return [Math.round(cx + Math.sin(a) * len * (H / 74)), Math.round(sh - Math.cos(a) * len * (H / 74))]
}

/**
 * @param fig   { x, y (feet), h }
 * @param pose  key of POSES
 * @param cast  0..1 — how far into a spell she is; overrides the pose
 */
export function drawWizard(g, fig, pose, t, ink, dim, bg, cast = 0) {
  const H = fig.h, s = H / 74, cx = Math.round(fig.x), feet = Math.round(fig.y)
  const sway = Math.sin(t * .8) * 1.2 * s
  const bob = Math.sin(t * 1.6) * .8 * s        /* she breathes */

  const headR = Math.round(11 * s)
  const headY = Math.round(feet - H * .58 + bob)
  const shY = Math.round(feet - H * .30)

  /* ---- robe: a soft bell, not a triangle ---- */
  const robeTop = shY - Math.round(3 * s)
  g.fillStyle = ink
  for (let y = robeTop; y <= feet; y++) {
    const p = (y - robeTop) / (feet - robeTop)
    const w = Math.round((9 + Math.pow(p, 1.5) * 14) * s)
    const drift = sway * p * p
    g.fillRect(Math.round(cx + drift - w), y, w * 2, 1)
  }
  /* hem shadow */
  g.fillStyle = dim; g.fillRect(cx - Math.round(23 * s), feet, Math.round(46 * s), 1)
  /* three little stars on the robe */
  g.fillStyle = dim
  for (const [sx, sy, sr] of [[-6, .55, 1], [5, .70, 1], [-1, .85, 2]])
    star(g, Math.round(cx + sx * s + sway * sy * sy), Math.round(robeTop + (feet - robeTop) * sy), Math.round(sr * s) || 1)

  /* ---- arms ---- */
  const P = cast > 0 ? POSES.cast : (POSES[pose] || POSES.present)
  const arm = (ang, len, isCast) => {
    const L = len * s
    const hx = cx + Math.sin(ang) * L, hy = shY - Math.cos(ang) * L
    g.fillStyle = ink
    /* sleeve: a tapering run of dots from shoulder to hand */
    for (let i = 0; i <= 10; i++) {
      const k = i / 10
      disc(g, Math.round(cx + (hx - cx) * k), Math.round(shY + (hy - shY) * k),
           Math.max(1, Math.round((3.4 - k * 1.6) * s)))
    }
    return [Math.round(hx), Math.round(hy)]
  }
  const lh = arm(P.l[0], P.l[1])
  const rh = arm(P.r[0], P.r[1], true)

  /* ---- head ---- */
  g.fillStyle = ink; disc(g, cx, headY, headR)
  /* face: a lighter field so the eyes read, then the eyes */
  g.fillStyle = bg
  disc(g, cx, headY + Math.round(2 * s), headR - Math.round(2 * s))
  g.fillStyle = ink
  const blink = Math.floor(t * .8) % 9 === 0 && (t * .8) % 1 < .18
  const ex = Math.round(4 * s) || 3, ey = headY + Math.round(2 * s)
  if (blink) {
    g.fillRect(cx - ex - 1, ey, 3, 1); g.fillRect(cx + ex - 1, ey, 3, 1)
  } else {
    disc(g, cx - ex, ey, Math.max(1, Math.round(1.8 * s)))
    disc(g, cx + ex, ey, Math.max(1, Math.round(1.8 * s)))
  }
  /* a small smile, and cheeks */
  g.fillRect(cx - 1, ey + Math.round(4 * s), 3, 1)
  g.fillStyle = dim
  dot(g, cx - ex - Math.round(3 * s), ey + Math.round(3 * s), Math.round(2 * s) || 1, .5)
  dot(g, cx + ex + Math.round(3 * s), ey + Math.round(3 * s), Math.round(2 * s) || 1, .5)

  /* ---- hat: wide brim, tall cone, and a droop at the tip ---- */
  const brimY = headY - Math.round(headR * .55)
  g.fillStyle = ink
  const brimRows = Math.max(1, Math.round(4 * s))
  for (let i = 0; i < brimRows; i++) {
    const w = Math.round((20 - i * 1.2) * s)
    g.fillRect(cx - w, brimY + i, w * 2, 1)
  }
  const tipH = Math.round(26 * s)
  let tx = cx, ty = brimY
  for (let i = 0; i < tipH; i++) {
    const k = i / tipH
    /* the droop: the tip leans, and it leans further as she sways */
    tx = cx + Math.pow(k, 2.1) * (10 * s + sway * 1.6)
    ty = brimY - i
    const w = Math.max(1, Math.round((10 - k * 9) * s))
    g.fillRect(Math.round(tx - w), ty, w * 2, 1)
  }
  /* a hatband, and the star on the point */
  g.fillStyle = dim
  g.fillRect(cx - Math.round(11 * s), brimY - Math.round(3 * s), Math.round(22 * s), Math.max(1, Math.round(2 * s)))
  g.fillStyle = ink
  star(g, Math.round(tx), ty - 2, Math.max(1, Math.round(2 * s)))

  return { leftHand: lh, rightHand: rh, shoulder: [cx - Math.round(9 * s), shY - Math.round(2 * s)], headY, headR }
}

/* ---------- held things, so a pose reads as an action ---------- */

export function heldOrbs(g, lh, rh, weight, ink, dim, t) {
  const pulse = 2 + Math.sin(t * 3) * .4
  g.fillStyle = weight < .5 ? ink : dim
  disc(g, lh[0], lh[1], Math.round(pulse + (1 - weight) * 2))
  g.fillStyle = weight >= .5 ? ink : dim
  disc(g, rh[0], rh[1], Math.round(pulse + weight * 2))
}

export function heldBook(g, lh, rh, ink, dim, bg, t) {
  const cx = Math.round((lh[0] + rh[0]) / 2), cy = Math.round((lh[1] + rh[1]) / 2)
  g.fillStyle = ink; g.fillRect(cx - 11, cy - 5, 22, 12)
  g.fillStyle = bg; g.fillRect(cx - 10, cy - 4, 9, 10); g.fillRect(cx + 2, cy - 4, 9, 10)
  g.fillStyle = dim
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx - 9, cy - 2 + i * 3, 7, 1)
    g.fillRect(cx + 3, cy - 2 + i * 3, 7, 1)
  }
  /* something rises off the page */
  g.fillStyle = ink
  star(g, cx + Math.round(Math.sin(t * 1.7) * 4), cy - 9 - Math.round((t * 6) % 5), 1)
}

export function heldUnit(g, lh, rh, ink, dim, bg, t) {
  const cx = Math.round((lh[0] + rh[0]) / 2), cy = Math.round((lh[1] + rh[1]) / 2)
  g.fillStyle = ink; g.fillRect(cx - 12, cy - 6, 24, 12)
  g.fillStyle = bg; g.fillRect(cx - 10, cy - 4, 20, 8)
  g.fillStyle = Math.floor(t * 3) % 2 ? ink : dim
  g.fillRect(cx - 4, cy - 2, 8, 4)                       /* its little screen */
  g.fillStyle = dim
  disc(g, cx - 7, cy, 1); disc(g, cx + 7, cy, 1)         /* its two decks */
}

/* ---------- the spell ---------- */

/** Sparks thrown from her hand. `p` runs 0..1 across the cast. */
export function drawSpell(g, from, p, W, H, ink, dim) {
  if (p <= 0 || p >= 1) return
  const [hx, hy] = from
  const R = p * Math.max(W, H) * 1.25

  /* the front: a dithered ring that sweeps the Screen */
  g.fillStyle = ink
  for (let a = 0; a < 6.283; a += .012) {
    const x = Math.round(hx + Math.cos(a) * R), y = Math.round(hy + Math.sin(a) * R)
    if (x < 0 || y < 0 || x >= W || y >= H) continue
    if ((x + y + Math.floor(p * 40)) % 3) continue
    g.fillRect(x, y, 1, 1)
  }
  /* sparks that outrun it */
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39, d = R * (.5 + (i % 5) * .12)
    const x = Math.round(hx + Math.cos(a) * d), y = Math.round(hy + Math.sin(a) * d * .7)
    if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue
    g.fillStyle = i % 3 ? ink : dim
    star(g, x, y, 1 + (i % 2))
  }
  /* the hand itself flares */
  if (p < .5) { g.fillStyle = ink; disc(g, hx, hy, Math.round(2 + p * 8)) }
}

/* ---------- the raven ---------- */

const bird = { mode: 'perch', p: 0, next: 4, fromX: 0, fromY: 0, toX: 0, toY: 0, facing: -1 }

export function updateRaven(dt, t, perch, roam) {
  const go = (tx, ty) => {
    bird.fromX = bird.mode === 'perch' ? perch[0] : bird.toX
    bird.fromY = bird.mode === 'perch' ? perch[1] : bird.toY
    bird.toX = tx; bird.toY = ty
    bird.facing = tx > bird.fromX ? 1 : -1
    bird.p = 0
  }
  if (bird.mode === 'perch') {
    if (t > bird.next) { go(roam.lo + Math.random() * (roam.hi - roam.lo), roam.y); bird.mode = 'fly' }
  } else if (bird.mode === 'fly') {
    bird.p += dt / 1.0
    if (bird.p >= 1) { bird.mode = 'away'; bird.next = t + 2.5 + Math.random() * 4 }
  } else if (bird.mode === 'away') {
    if (t > bird.next) { go(perch[0], perch[1]); bird.mode = 'back' }
  } else {
    bird.p += dt / 1.0
    if (bird.p >= 1) { bird.mode = 'perch'; bird.next = t + 5 + Math.random() * 7 }
  }
}

/** Send it up now — the Module changed and something wants looking at. */
export function flush(t) { if (bird.mode === 'perch' || bird.mode === 'away') bird.next = t }

export function drawRaven(g, perch, t, ink, dim) {
  let x, y
  const flying = bird.mode === 'fly' || bird.mode === 'back'
  if (bird.mode === 'perch') { [x, y] = perch }
  else if (bird.mode === 'away') { x = bird.toX; y = bird.toY }
  else {
    const e = bird.p < .5 ? 2 * bird.p * bird.p : 1 - Math.pow(-2 * bird.p + 2, 2) / 2
    x = bird.fromX + (bird.toX - bird.fromX) * e
    y = bird.fromY + (bird.toY - bird.fromY) * e - Math.sin(bird.p * Math.PI) * 18
  }
  x = Math.round(x); y = Math.round(y)
  const f = bird.facing

  g.fillStyle = ink
  g.fillRect(x - 4, y - 5, 9, 5)
  g.fillRect(x + f * 4, y - 8, 4, 4)
  g.fillRect(x + f * 7, y - 7, 3, 1)
  g.fillStyle = dim
  for (let i = 0; i < 5; i++) g.fillRect(x - 4 - i, y - 4 + ((i / 2) | 0), 1, 3)
  g.fillStyle = ink
  if (flying) {
    const up = Math.floor(t * 14) % 2
    for (let i = 0; i < 7; i++) {
      const h = Math.round(6 * (1 - i / 7))
      g.fillRect(x - 1 - i, y - 6 - (up ? h : -h), 1, h + 1)
      g.fillRect(x + 1 + i, y - 6 - (up ? h : -h), 1, h + 1)
    }
  } else {
    g.fillRect(x - 2, y - 7, 5, 2)
    g.fillRect(x - 1, y, 1, 2); g.fillRect(x + 2, y, 1, 2)
  }
  if (Math.floor(t * 1.3) % 5) { g.fillStyle = dim; g.fillRect(x + f * 5, y - 7, 1, 1) }
}

/* ---------- the generated body ----------
   The bust is drawn; everything under it is generated. That split is the one
   ADR-0013 argues for: a face is a set of decisions, a robe is a system. It also
   gives a hand-drawn character poses again — a bitmap has one frame, but the
   body beneath it can put her arms wherever the Module needs them. */

/**
 * A bell robe with arms, drawn on the sprite's own pixel grid so it does not
 * read as a different medium bolted under the drawing.
 *
 * @param px  the sprite's pixel size — everything snaps to it
 * @returns   hand positions, in screen pixels
 */
export function drawRobe(g, cx, top, bottom, px, pose, t, ink, mid, deep, bg) {
  const snap = v => Math.round(v / px) * px
  const H = bottom - top
  const sway = Math.sin(t * .8) * px

  /* shoulders out to hem, easing wide near the bottom the way a heavy robe hangs */
  for (let y = top; y < bottom; y += px) {
    const k = (y - top) / H
    const w = snap(px * 5 + Math.pow(k, 1.45) * px * 8)
    const drift = snap(sway * k * k)
    g.fillStyle = mid
    g.fillRect(snap(cx + drift - w), snap(y), w * 2, px)
    /* one side falls into shadow, which is what stops it reading as a triangle */
    g.fillStyle = deep
    g.fillRect(snap(cx + drift + w - px * 2), snap(y), px * 2, px)
  }
  g.fillStyle = ink
  g.fillRect(snap(cx - px * 13 + sway), snap(bottom - px), px * 26, px)

  /* a few stars, because she is a wizard and the robe is otherwise a shape */
  g.fillStyle = ink
  for (const [sx, sk] of [[-3, .45], [4, .62], [-1, .80]]) {
    const y = snap(top + H * sk), x = snap(cx + sx * px + sway * sk * sk)
    g.fillRect(x, y, px, px)
    g.fillRect(x - px, y, px, px); g.fillRect(x + px, y, px, px)
    g.fillRect(x, y - px, px, px); g.fillRect(x, y + px, px, px)
  }

  /* arms: chunky segments, so they sit in the same grid as the drawing */
  const P = POSES[pose] || POSES.present
  const shoulder = top + px * 2
  const arm = ([ang, len]) => {
    const L = len * px * .9
    const hx = cx + Math.sin(ang) * L, hy = shoulder - Math.cos(ang) * L
    for (let i = 0; i <= 6; i++) {
      const k = i / 6
      const w = Math.max(px, snap(px * (2.6 - k)))
      g.fillStyle = i > 4 ? ink : mid
      g.fillRect(snap(cx + (hx - cx) * k - w / 2), snap(shoulder + (hy - shoulder) * k - w / 2), w, w)
    }
    return [snap(hx), snap(hy)]
  }
  return { leftHand: arm(P.l), rightHand: arm(P.r) }
}

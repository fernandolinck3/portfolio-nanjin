/* The figure, and her raven.

   She is not a mark in the margin — she is the ground the Module is written on.
   A large hooded figure standing in the right of the Screen, dithered down so
   text reads straight over her, present in every Module and never in the way.
   The raven is the opposite: small, full contrast, the only thing on the Screen
   allowed to move across the content.

   Drawn as horizontal spans per row rather than plotted, so the silhouette stays
   editable by parameter (ADR-0004) and dithers cleanly at any level. */

const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]

/** Plot a horizontal span with an ordered-dither tone. */
function span(g, x, y, w, level) {
  for (let i = 0; i < w; i++)
    if (level * 16 > BAYER[(x + i) & 3][y & 3]) g.fillRect(x + i, y, 1, 1)
}

/* ---------- the silhouette ---------- */

/**
 * Half-width of the figure at row `r` (0 at the crown, H at the hem).
 *
 * The silhouette has to survive being dithered down to a whisper, so it is built
 * out of hard breaks — hat, brim, head, shoulder, cloak — rather than a smooth
 * taper. A smooth taper at 1-bit reads as a triangle, which is what the first
 * attempt did.
 */
function profile(r, H, kind) {
  const p = r / H
  const witch = kind === 'witch'

  /* the point */
  if (p < .03) return 0
  /* the cone: tall and straight for a witch, short and domed for a cowl */
  if (p < .20) {
    const k = (p - .03) / .17
    return witch ? Math.max(1, Math.round(k * 8)) : Math.round(Math.sin(k * 1.4) * 11)
  }
  /* the brim. Three flat rows of it, so it reads as a hat and not as a shoulder */
  if (witch && p < .25) {
    const k = (p - .20) / .05
    return k < .55 ? 23 : Math.round(23 - k * 14)
  }
  if (!witch && p < .25) return 12
  /* the head — a narrow column, which is what gives the brim something to sit on */
  if (p < .36) return witch ? 8 : 10
  /* shoulders rise fast */
  if (p < .42) return Math.round(8 + ((p - .36) / .06) * 13)
  /* the cloak falls almost straight, widening only near the hem */
  const k = (p - .42) / .58
  return Math.round(21 + k * k * 11)
}

/**
 * She is drawn SOLID, not dithered behind the text.
 *
 * The first attempt put her in the ground as a watermark and it read as a smear:
 * at 1-bit there is no such thing as a quiet grey, only a coarser dot. What the
 * references actually do — Miranda, the throne page, the character sheet — is
 * give the figure a panel of her own and fill it. So: solid silhouette, a void
 * where the face is, and dim folds so she is a shape rather than a blot.
 *
 * @param kind 'witch' (pointed hat) or 'hooded' (cowl — the liturgical read)
 */
export function drawFigure(g, kind, cx, top, H, t, ink, dim, bg) {
  const sway = Math.sin(t * .55) * 1.5
  const edge = []
  for (let r = 0; r < H; r++) {
    const hw = profile(r, H, kind)
    if (!hw) { edge.push(null); continue }
    const drift = sway * (r / H) * (r / H)
    const x = Math.round(cx + drift - hw)
    edge.push([x, hw * 2])
    g.fillStyle = ink
    g.fillRect(x, top + r, hw * 2, 1)
  }

  /* the face: a void under the brim, with two points of light in it */
  const faceTop = Math.round(H * .25), faceBot = Math.round(H * .36)
  for (let r = faceTop; r < faceBot; r++) {
    const e = edge[r]; if (!e) continue
    g.fillStyle = bg
    g.fillRect(e[0] + 2, top + r, e[1] - 4, 1)
  }
  if (Math.floor(t * .7) % 7) {
    const e = edge[Math.round(H * .29)]
    if (e) {
      g.fillStyle = ink
      g.fillRect(e[0] + 3, top + Math.round(H * .29), 2, 1)
      g.fillRect(e[0] + e[1] - 5, top + Math.round(H * .29), 2, 1)
    }
  }

  /* folds — a few lines falling from the shoulder, so the cloak has weight */
  g.fillStyle = dim
  for (let f = 0; f < 3; f++) {
    const fx = -8 + f * 8
    for (let r = Math.round(H * .46); r < H - 2; r += 1) {
      const e = edge[r]; if (!e) continue
      const wob = Math.sin(r * .18 + f * 2 + t * .4) * 1.4
      const x = Math.round(cx + fx * (r / H) * 1.5 + wob + sway * (r / H) * (r / H))
      if (x > e[0] + 2 && x < e[0] + e[1] - 3) g.fillRect(x, top + r, 1, 1)
    }
  }
  /* the hem catches the light */
  const last = edge[H - 1]
  if (last) { g.fillStyle = dim; g.fillRect(last[0] - 2, top + H - 1, last[1] + 4, 1) }
}

/* ---------- the raven ---------- */

/* Perched most of the time; now and then it crosses the Screen and comes back. */
const bird = { mode: 'perch', p: 0, next: 4, fromX: 0, toX: 0, y: 0, facing: -1 }

export function updateRaven(dt, t, perch, roam) {
  if (bird.mode === 'perch') {
    if (t > bird.next) {
      bird.mode = 'fly'; bird.p = 0
      bird.fromX = perch.x
      bird.toX = roam.lo + Math.random() * (roam.hi - roam.lo)
      bird.facing = bird.toX > bird.fromX ? 1 : -1
    }
  } else if (bird.mode === 'fly') {
    bird.p += dt / 1.1
    if (bird.p >= 1) { bird.mode = 'away'; bird.next = t + 3 + Math.random() * 5 }
  } else if (bird.mode === 'away') {
    if (t > bird.next) {
      bird.mode = 'back'; bird.p = 0
      bird.fromX = bird.toX; bird.toX = perch.x
      bird.facing = bird.toX > bird.fromX ? 1 : -1
    }
  } else {
    bird.p += dt / 1.1
    if (bird.p >= 1) { bird.mode = 'perch'; bird.next = t + 5 + Math.random() * 7 }
  }
}

/** Send it up now — the Module changed and something wants looking at. */
export function flush(t) {
  if (bird.mode === 'perch') bird.next = t
  else if (bird.mode === 'away') bird.next = t
}

export function drawRaven(g, perch, roamY, t, ink, dim) {
  let x, y, flying = bird.mode === 'fly' || bird.mode === 'back'
  if (bird.mode === 'perch') { x = perch.x; y = perch.y }
  else if (bird.mode === 'away') { x = bird.toX; y = roamY }
  else {
    const e = bird.p < .5 ? 2 * bird.p * bird.p : 1 - Math.pow(-2 * bird.p + 2, 2) / 2
    x = bird.fromX + (bird.toX - bird.fromX) * e
    /* an arc, because a bird does not travel in a straight line */
    const a = bird.mode === 'fly' ? perch.y : roamY
    const b = bird.mode === 'fly' ? roamY : perch.y
    y = a + (b - a) * e - Math.sin(bird.p * Math.PI) * 16
  }
  x = Math.round(x); y = Math.round(y)
  const f = bird.facing

  g.fillStyle = ink
  g.fillRect(x - 4, y - 5, 9, 5)                       /* body */
  g.fillRect(x + f * 4, y - 8, 4, 4)                   /* head */
  g.fillRect(x + f * 7, y - 7, 3, 1)                   /* beak */
  g.fillStyle = dim
  for (let i = 0; i < 5; i++) g.fillRect(x - 4 - i, y - 4 + ((i / 2) | 0), 1, 3)   /* tail */

  g.fillStyle = ink
  if (flying) {
    /* wings beat above and below the body, hard cut — no in-betweens at 1-bit */
    const up = Math.floor(t * 14) % 2
    for (let i = 0; i < 7; i++) {
      const h = Math.round(6 * (1 - i / 7))
      g.fillRect(x - 1 - i, y - 6 - (up ? h : -h), 1, h + 1)
      g.fillRect(x + 1 + i, y - 6 - (up ? h : -h), 1, h + 1)
    }
  } else {
    g.fillRect(x - 2, y - 7, 5, 2)                     /* folded wing */
    g.fillRect(x - 1, y, 1, 2); g.fillRect(x + 2, y, 1, 2)   /* legs */
  }
  /* the eye, when it is not blinking */
  if (Math.floor(t * 1.3) % 5) { g.fillStyle = dim; g.fillRect(x + f * 5, y - 7, 1, 1) }
}

export const ravenPerched = () => bird.mode === 'perch'

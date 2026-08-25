/* Flavor characters — one emblem per Module, drawn as 1-bit pixel art.
   Procedural rather than plotted (ADR-0004): every shape is built from discs,
   rects and scanlines at the buffer's own resolution, so it comes out blocky by
   construction instead of being a smooth drawing shrunk down.

   Each takes (g, x, y, t, ink, dim) and draws into a 32x32 box at x,y. `t` is
   seconds — every emblem moves, because a still mark on a live Screen reads as
   a logo rather than as an inhabitant. */

/** A filled pixel disc. Bresenham-ish: test each cell, no anti-aliasing. */
export function disc(g, cx, cy, r) {
  const r2 = r * r
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r2) g.fillRect(cx + x, cy + y, 1, 1)
}

/** A pixel ring. */
export function ring(g, cx, cy, r, w = 1) {
  const o = r * r, i = (r - w) * (r - w)
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y
    if (d <= o && d > i) g.fillRect(cx + x, cy + y, 1, 1)
  }
}

/** An isoceles triangle, point up or down. */
function tri(g, cx, y0, halfW, h, down) {
  for (let i = 0; i < h; i++) {
    const w = Math.round(halfW * (down ? 1 - i / h : i / h))
    g.fillRect(cx - w, y0 + i, w * 2 + 1, 1)
  }
}

/* ---------- the six ---------- */

/** IDENT — an eye. It looks around, and it blinks. */
function eye(g, x, y, t, ink, dim) {
  const cx = x + 16, cy = y + 16
  /* blink: a hard cut every few seconds, the way a cursor is hard */
  const phase = (t % 4.2) / 4.2
  const shut = phase > .96
  g.fillStyle = ink
  if (shut) { g.fillRect(cx - 11, cy, 23, 1); return }
  /* lens: two arcs meeting at the corners */
  for (let i = -11; i <= 11; i++) {
    const h = Math.round(Math.sqrt(Math.max(0, 121 - i * i)) * .62)
    g.fillRect(cx + i, cy - h, 1, 1); g.fillRect(cx + i, cy + h, 1, 1)
  }
  /* iris drifts, so it reads as watching rather than staring */
  const gx = Math.round(Math.sin(t * .7) * 3), gy = Math.round(Math.cos(t * .43) * 1.5)
  g.fillStyle = dim; disc(g, cx + gx, cy + gy, 4)
  g.fillStyle = ink; ring(g, cx + gx, cy + gy, 4, 1); disc(g, cx + gx, cy + gy, 2)
}

/** NOW / NEXT — an hourglass, with sand actually falling. */
function hourglass(g, x, y, t, ink, dim) {
  const cx = x + 16, top = y + 4, h = 24
  g.fillStyle = ink
  g.fillRect(cx - 9, top, 19, 1); g.fillRect(cx - 9, top + h, 19, 1)
  for (let i = 0; i <= h; i++) {
    const w = Math.round(9 * Math.abs(i - h / 2) / (h / 2))
    g.fillRect(cx - w, top + i, 1, 1); g.fillRect(cx + w, top + i, 1, 1)
  }
  /* the sand runs down over 6s and starts again */
  const p = (t % 6) / 6
  g.fillStyle = dim
  tri(g, cx, top + 1, Math.round(8 * (1 - p)), Math.round(10 * (1 - p)), true)
  tri(g, cx, top + h - Math.round(10 * p), Math.round(8 * p), Math.round(10 * p), false)
  /* the stream */
  g.fillStyle = ink
  if (p > .02 && p < .98) for (let i = 0; i < 8; i++)
    if ((Math.floor(t * 22) + i) % 3) g.fillRect(cx, top + 11 + i, 1, 1)
}

/** PROJECT 001 — the lancet window, with a light behind it that never sits still. */
function lancet(g, x, y, t, ink, dim) {
  const cx = x + 16, top = y + 3, sill = y + 29, r = 8
  /* the light inside: dithered, and it breathes */
  const lit = .35 + .3 * Math.sin(t * 1.9) * Math.sin(t * 1.1 + .8)
  g.fillStyle = dim
  for (let py = top + r; py < sill; py++) for (let px = cx - r + 1; px < cx + r; px++)
    if (((px * 7 + py * 3) % 11) / 11 < lit) g.fillRect(px, py, 1, 1)
  for (let i = -r + 1; i < r; i++) {
    const hh = Math.round(Math.sqrt(Math.max(0, r * r - i * i)))
    for (let py = top + r - hh; py < top + r; py++)
      if (((cx + i) * 7 + py * 3) % 11 / 11 < lit) g.fillRect(cx + i, py, 1, 1)
  }
  /* the stonework */
  g.fillStyle = ink
  for (let i = -r; i <= r; i++) {
    const hh = Math.round(Math.sqrt(Math.max(0, r * r - i * i)))
    g.fillRect(cx + i, top + r - hh, 1, 1)
  }
  g.fillRect(cx - r, top + r, 1, sill - top - r)
  g.fillRect(cx + r, top + r, 1, sill - top - r)
  g.fillRect(cx - r - 1, sill, 2 * r + 3, 1)
  g.fillRect(cx, top + 4, 1, sill - top - 4)          /* mullion */
  g.fillRect(cx - r, top + r + 8, 2 * r + 1, 1)       /* transom */
}

/** RACK — a keep, with a banner that flutters off the tower. */
function keep(g, x, y, t, ink, dim) {
  const base = y + 28, left = x + 7
  g.fillStyle = dim; g.fillRect(left + 1, base - 15, 17, 15)
  g.fillStyle = ink
  g.fillRect(left, base - 16, 19, 1); g.fillRect(left, base, 19, 1)
  g.fillRect(left, base - 16, 1, 17); g.fillRect(left + 18, base - 16, 1, 17)
  for (let i = 0; i < 5; i++) g.fillRect(left + i * 4, base - 19, 3, 3)  /* battlements */
  /* windows */
  g.fillStyle = ink; g.fillRect(left + 5, base - 11, 2, 4); g.fillRect(left + 12, base - 11, 2, 4)
  /* the banner: a mast and three cloth rows that wave out of phase */
  g.fillRect(left + 9, base - 30, 1, 11)
  for (let r = 0; r < 4; r++) {
    const w = 7 - r, off = Math.round(Math.sin(t * 4 + r * .9) * 1.4)
    g.fillRect(left + 10, base - 29 + r, w + off, 1)
  }
}

/** METHOD — a key, turning a little and back, never quite unlocking. */
function key(g, x, y, t, ink, dim) {
  const cx = x + 11, cy = y + 12
  const tilt = Math.sin(t * .9) * .12
  g.save(); g.translate(cx, cy); g.rotate(tilt); g.translate(-cx, -cy)
  g.fillStyle = dim; disc(g, cx, cy, 6)
  g.fillStyle = ink; ring(g, cx, cy, 6, 2); disc(g, cx, cy, 2)
  g.fillRect(cx + 5, cy - 1, 15, 2)                 /* shaft */
  g.fillRect(cx + 16, cy + 1, 2, 5)                 /* teeth */
  g.fillRect(cx + 12, cy + 1, 2, 4)
  g.restore()
}

/** OUT — a candle. The one emblem the Vigil would put out. */
function candle(g, x, y, t, ink, dim) {
  const cx = x + 16, base = y + 29
  g.fillStyle = dim; g.fillRect(cx - 4, base - 16, 9, 16)
  g.fillStyle = ink
  g.fillRect(cx - 5, base - 17, 11, 1); g.fillRect(cx - 5, base - 17, 1, 17)
  g.fillRect(cx + 5, base - 17, 1, 17); g.fillRect(cx - 7, base, 15, 2)
  /* drip */
  g.fillRect(cx + 4, base - 12, 1, 5)
  /* the flame: never the same shape twice */
  const f = .8 + .2 * Math.sin(t * 7.3) * Math.sin(t * 4.1)
  const fh = Math.round(7 * f)
  g.fillRect(cx, base - 19, 1, 2)                   /* wick */
  for (let i = 0; i < fh; i++) {
    const w = Math.round((1 - i / fh) * 2.4 + (i < 2 ? 1 : 0))
    g.fillRect(cx - w + Math.round(Math.sin(t * 5 + i) * .6), base - 20 - i, w * 2 + 1, 1)
  }
  g.fillStyle = dim
  disc(g, cx, base - 22, Math.round(4 + f * 2))
}

export const EMBLEMS = [eye, hourglass, lancet, keep, key, candle]

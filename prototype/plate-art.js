/**
 * The Plate's artwork, from Fernando's reference (2026-08-26).
 *
 * The reference is a whole render — Decks, pads, fader, candlesticks, table. Only
 * the *faceplate* is taken from it; the controls are their own job and are
 * deliberately not derived here.
 *
 * It divides cleanly along a distinction the Plate already had (CONTEXT.md):
 *
 *   PRINT      colour only, no relief. The warm/cool split, the landscape, the
 *              pines and water on the Moon side, the flames and rays on the Sun
 *              side, the phase and star strips along the bottom.
 *   ENGRAVING  cut into the metal and catching light. The gilt band across the
 *              top, its thorn chains and moon phases, the compass roses, and the
 *              fine scale ground under everything.
 *
 * That is not a tidy-up: it is what makes the reference buildable. The blue and
 * orange are silkscreen and stay flat; the gilt is a height field and takes the
 * Candles. Printing the gilt would kill the whole effect, and engraving the
 * landscape would turn the Plate into noise.
 *
 * The organising idea is that the Plate is split down the middle the way the Vigil
 * is — cold and waning on the Moon's side, hot and waxing on the Sun's. The
 * instrument's state is printed on it before anything is switched on.
 */

/** Deterministic, so a Plate rebuild is the same Plate. */
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

const COOL = { ink: '#5B7D8A', deep: '#2E4750', pale: '#8FAAB4' }
const WARM = { ink: '#C4491C', deep: '#7A2A10', pale: '#E0834A' }

/* ---------- motifs ---------- */

/** A row of conifers, uneven, receding. The Moon side's treeline. */
function pines(g, x0, x1, baseY, colour, seed, scale = 1) {
  const rnd = rng(seed)
  g.fillStyle = colour
  for (let x = x0; x < x1; x += 26 * scale + rnd() * 18 * scale) {
    const h = (58 + rnd() * 76) * scale, w = h * (0.26 + rnd() * 0.10)
    const tiers = 3 + Math.floor(rnd() * 3)
    for (let i = 0; i < tiers; i++) {
      const k = i / tiers
      const ty = baseY - h * (1 - k) * 0.92
      const tw = w * (0.42 + k * 0.62)
      g.beginPath()
      g.moveTo(x, ty - h * 0.30)
      g.lineTo(x - tw, ty)
      g.lineTo(x + tw, ty)
      g.closePath(); g.fill()
    }
    g.fillRect(x - 1.5 * scale, baseY, 3 * scale, 10 * scale)
  }
}

/** Layered bands of water or hill, each one flatter than the last. */
function strata(g, x0, x1, y, layers, colour, seed, amp = 26) {
  const rnd = rng(seed)
  for (let i = 0; i < layers; i++) {
    const yy = y + i * (amp * 0.62)
    g.strokeStyle = colour
    g.globalAlpha = 0.85 - i * (0.62 / layers)
    g.lineWidth = 3.2 - i * 0.25
    g.beginPath()
    g.moveTo(x0, yy)
    const step = 62 + rnd() * 40
    for (let x = x0; x <= x1; x += step)
      g.quadraticCurveTo(x + step * 0.5, yy + (rnd() - 0.5) * amp, x + step, yy)
    g.stroke()
  }
  g.globalAlpha = 1
}

/** A run of moon phases, waxing across the run. */
function phases(g, x0, x1, cy, r, colour, ground) {
  const n = Math.max(3, Math.floor((x1 - x0) / (r * 3.2)))
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i + 0.5) * ((x1 - x0) / n)
    const k = i / (n - 1)
    g.fillStyle = colour
    g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fill()
    /* the shadow, swung across as the phase advances */
    const off = (k * 2 - 1) * r * 2
    g.save()
    g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip()
    g.fillStyle = ground
    g.beginPath(); g.arc(cx + off, cy, r * 1.02, 0, 6.2832); g.fill()
    g.restore()
    g.strokeStyle = colour; g.lineWidth = 1.6
    g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.stroke()
  }
}

/** A branch with thorns on it, running horizontally. The band's connective tissue. */
function thorns(g, x0, x1, y, colour, seed) {
  const rnd = rng(seed)
  g.strokeStyle = colour
  g.lineWidth = 2.4
  g.beginPath(); g.moveTo(x0, y)
  for (let x = x0; x < x1; x += 46) g.quadraticCurveTo(x + 23, y + (rnd() - 0.5) * 9, x + 46, y)
  g.stroke()
  g.lineWidth = 1.8
  for (let x = x0 + 12; x < x1; x += 17) {
    const up = rnd() > 0.5 ? -1 : 1
    const len = 8 + rnd() * 12
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 5, y + up * len)
    g.stroke()
  }
}

/** A compass rose: long cardinals, short ordinals, two rings and a tick course. */
function rose(g, cx, cy, r, colour, points = 16) {
  g.strokeStyle = colour
  g.lineWidth = 1.6
  for (const k of [1, 0.78]) {
    g.beginPath(); g.arc(cx, cy, r * k, 0, 6.2832); g.stroke()
  }
  for (let i = 0; i < points; i++) {
    const a = (i / points) * 6.2832 - Math.PI / 2
    const long = i % 4 === 0, mid = i % 2 === 0
    const len = long ? r * 1.34 : mid ? r * 0.92 : r * 0.64
    const wide = long ? 0.055 : 0.032
    g.fillStyle = colour
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
    g.lineTo(cx + Math.cos(a + wide) * r * 0.30, cy + Math.sin(a + wide) * r * 0.30)
    g.lineTo(cx + Math.cos(a - wide) * r * 0.30, cy + Math.sin(a - wide) * r * 0.30)
    g.closePath(); g.fill()
  }
  g.lineWidth = 1
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 6.2832
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * r * 1.06, cy + Math.sin(a) * r * 1.06)
    g.lineTo(cx + Math.cos(a) * r * (i % 6 ? 1.11 : 1.17), cy + Math.sin(a) * r * (i % 6 ? 1.11 : 1.17))
    g.stroke()
  }
}

/** Rays from a point, uneven, like an engraved sun. */
function burst(g, cx, cy, r0, r1, colour, n, seed) {
  const rnd = rng(seed)
  g.strokeStyle = colour
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832
    const len = r1 * (0.55 + rnd() * 0.45)
    g.lineWidth = i % 3 === 0 ? 2.6 : 1.3
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
    g.stroke()
  }
}

/** The fine reptile-scale ground the reference carries across the whole Plate. */
function scales(g, w, h, colour, size, alpha) {
  g.save()
  g.globalAlpha = alpha
  g.strokeStyle = colour
  g.lineWidth = 1
  for (let y = 0, row = 0; y < h + size; y += size * 0.62, row++) {
    const off = (row % 2) * size * 0.5
    for (let x = -size; x < w + size; x += size) {
      g.beginPath()
      g.arc(x + off, y, size * 0.5, Math.PI * 0.08, Math.PI * 0.92)
      g.stroke()
    }
  }
  g.restore()
}

/* ---------- the two layers ---------- */

/**
 * The Print: colour, no relief.
 *
 * A cold half and a hot half, each with its own weather. Everything here is low
 * alpha — it is silkscreen on a near-black plate, and the reference reads as a
 * black instrument with colour in it rather than as a colourful one.
 */
export function printLayer(g, { TW, TH, PY }) {
  /* drawn at full strength; the caller composites it at whatever weight it wants */
  const midX = TW / 2

  /* the two temperatures, meeting at the centre line */
  const cool = g.createLinearGradient(0, 0, midX, 0)
  cool.addColorStop(0, 'rgba(91,125,138,.30)')
  cool.addColorStop(1, 'rgba(91,125,138,0)')
  g.fillStyle = cool; g.fillRect(0, 0, midX, TH)

  const warm = g.createLinearGradient(TW, 0, midX, 0)
  warm.addColorStop(0, 'rgba(196,73,28,.32)')
  warm.addColorStop(1, 'rgba(196,73,28,0)')
  g.fillStyle = warm; g.fillRect(midX, 0, midX, TH)

  /* ---- Moon side: water, then a treeline ---- */
  g.save()
  g.globalAlpha = .5
  strata(g, -40, midX * .96, PY(.30), 5, COOL.ink, 77, 30)
  g.restore()
  g.save(); g.globalAlpha = .62
  pines(g, 40, midX * .58, PY(1.02), COOL.deep, 1201, .9)
  g.restore()
  g.save(); g.globalAlpha = .40
  pines(g, midX * .30, midX * .88, PY(1.26), COOL.ink, 1202, .62)
  g.restore()

  /* ---- Sun side: heat rising, and a burnt treeline ---- */
  g.save()
  g.globalAlpha = .46
  strata(g, midX * 1.04, TW + 40, PY(.34), 5, WARM.ink, 88, 34)
  g.restore()
  g.save(); g.globalAlpha = .58
  pines(g, TW - midX * .56, TW - 40, PY(1.02), WARM.deep, 1301, .9)
  g.restore()
  g.save(); g.globalAlpha = .38
  pines(g, midX * 1.12, TW - midX * .30, PY(1.26), WARM.ink, 1302, .62)
  g.restore()

  /* the Sun's corner, throwing rays back across its half */
  g.save(); g.globalAlpha = .5
  burst(g, TW - 150, 150, 40, 520, WARM.ink, 34, 5150)
  g.fillStyle = 'rgba(196,73,28,.35)'
  g.beginPath(); g.arc(TW - 150, 150, 68, 0, 6.2832); g.fill()
  g.restore()

  /* the Moon's corner answers it, quietly — a crescent, not a blaze */
  g.save(); g.globalAlpha = .55
  g.fillStyle = COOL.pale
  g.beginPath(); g.arc(150, 150, 46, 0, 6.2832); g.fill()
  g.globalCompositeOperation = 'destination-out'
  g.beginPath(); g.arc(178, 138, 42, 0, 6.2832); g.fill()
  g.restore()

  /* ---- the strips along the bottom: phases waning left, suns rising right ---- */
  g.save(); g.globalAlpha = .62
  phases(g, 120, midX * .74, TH - 62, 13, COOL.pale, '#0B0C0E')
  g.restore()
  g.save(); g.globalAlpha = .58
  for (let i = 0; i < 9; i++) {
    const x = TW - midX * .74 + i * ((midX * .74 - 120) / 9)
    burst(g, x, TH - 62, 4, 9 + i * 1.6, WARM.pale, 8, 900 + i)
  }
  g.restore()
}

/**
 * The engraving: cut, and it catches light.
 *
 * One band across the top — roses at both corners, thorn chains running in, moon
 * phases riding them, a burst at the centre — plus the scale ground under
 * everything. `ink` is the stroke colour for whichever map is being drawn: pale
 * on the albedo, near-black on the height field.
 */
export function engravedLayer(g, ink, mass, { TW, TH }, weight = 1) {
  g.save()
  g.strokeStyle = ink; g.fillStyle = mass
  g.lineCap = 'round'; g.lineJoin = 'round'

  scales(g, TW, TH, ink, 34, .16 * weight)

  const bandY = 250
  rose(g, 190, bandY - 40, 92, ink, 16)
  rose(g, TW - 190, bandY - 40, 92, ink, 16)

  thorns(g, 320, TW / 2 - 190, bandY, ink, 4242)
  thorns(g, TW / 2 + 190, TW - 320, bandY, ink, 4243)

  phases(g, 470, TW / 2 - 250, bandY - 62, 21, ink, mass)
  phases(g, TW / 2 + 250, TW - 470, bandY - 62, 21, ink, mass)

  burst(g, TW / 2, bandY - 44, 16, 92, ink, 24, 606)

  /* a rule closing the band, broken where the burst sits */
  g.lineWidth = 2 * weight
  g.beginPath()
  g.moveTo(150, bandY + 58); g.lineTo(TW / 2 - 120, bandY + 58)
  g.moveTo(TW / 2 + 120, bandY + 58); g.lineTo(TW - 150, bandY + 58)
  g.stroke()

  g.restore()
}

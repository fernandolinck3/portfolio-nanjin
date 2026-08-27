/**
 * The Deck faces — pierced Gothic tracery, lit from behind.
 *
 * From Fernando's `circle` channel. Three things in it decided this:
 *
 *   - a plate of Gothic oculi: carved stone rings with the tracery *pierced*, so
 *     every roundel is a pattern of bars over a void
 *   - a woodcut pair — a moon swallowed in swirling cloud, a sun as a rayed star
 *   - a crescent whose lit half is built entirely out of quatrefoil piercings
 *
 * The third is the whole design. A wheel that is a stone plate with holes in it
 * answers "the jogs need some kind of light" without gluing a lamp to anything:
 * the light is *behind* the tracery and comes through the holes. Bars stay stone,
 * voids burn.
 *
 * One drawing pass makes a void mask, and three maps come off it — colour, relief
 * and emission — so the hole a bar casts a shadow into is by construction the same
 * hole the light comes out of.
 *
 * The Sun burns while the room is lit and dies as the Candles go out; the Moon is
 * dark at first light and comes up as the room does down. Turning the Sun brings
 * the light up and the Moon puts it out (CONTEXT.md), so each wheel now shows
 * whose hand is winning — the Vigil made visible on the controls that hold it.
 */

import * as THREE from 'three'

const SIZE = 1024, C = SIZE / 2, R = 470

/* ---------- tracery vocabulary ---------- */

/** A quatrefoil: four lobes around a centre, the Gothic mason's default hole. */
function quatrefoil(g, cx, cy, r, rot = 0, lobes = 4) {
  const lr = r * 0.52
  g.beginPath()
  for (let i = 0; i < lobes; i++) {
    const a = rot + (i / lobes) * Math.PI * 2
    g.moveTo(cx + Math.cos(a) * (r - lr) + lr, cy + Math.sin(a) * (r - lr))
    g.arc(cx + Math.cos(a) * (r - lr), cy + Math.sin(a) * (r - lr), lr, 0, 6.2832)
  }
  g.fill()
  /* the square of stone between the lobes reads as a star once pierced */
  g.beginPath()
  for (let i = 0; i < lobes; i++) {
    const a = rot + (i / lobes) * Math.PI * 2
    const p = [cx + Math.cos(a) * (r - lr) * 1.12, cy + Math.sin(a) * (r - lr) * 1.12]
    i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
  }
  g.closePath(); g.fill()
}

/** A lancet: the pointed-arch void, aimed outward from the hub. */
function lancet(g, cx, cy, a, r0, r1, halfWidth) {
  const ca = Math.cos(a), sa = Math.sin(a)
  const px = (r, o) => [cx + Math.cos(a + o) * r, cy + Math.sin(a + o) * r]
  g.beginPath()
  const [ax, ay] = px(r0, -halfWidth)
  g.moveTo(ax, ay)
  /* up one jamb, into the point, and back down the other */
  const [bx, by] = px(r1 * 0.82, -halfWidth)
  g.lineTo(bx, by)
  g.quadraticCurveTo(cx + ca * r1 * 0.98 - sa * 0, cy + sa * r1 * 0.98,
                     ...px(r1, 0))
  const [dx, dy] = px(r1 * 0.82, halfWidth)
  g.quadraticCurveTo(cx + ca * r1 * 0.98, cy + sa * r1 * 0.98, dx, dy)
  const [ex, ey] = px(r0, halfWidth)
  g.lineTo(ex, ey)
  /* a cusped foot, so it is masonry rather than a slot */
  g.quadraticCurveTo(cx + ca * r0 * 0.88, cy + sa * r0 * 0.88, ax, ay)
  g.closePath(); g.fill()
}

/** A plain round piercing. */
function eye(g, cx, cy, r) {
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fill()
}

/* ---------- the two faces, as voids ---------- */

/**
 * The Sun: everything points outward.
 *
 * A ring of eight lancets driving out from the hub, eight quatrefoils riding the
 * outer band between them, and a course of small eyes close in. Kept to eight and
 * eight because the wheel draws under 200px on the Plate — sixteen of anything
 * turns to mush at that size.
 */
/**
 * A petal — the shape a rose window is actually made of.
 *
 * Not a lancet and not a lobe: a pointed arch whose flanks are *cusped*, so the
 * void has little points biting into it where the stone tips inward. That cusping
 * is the whole difference between tracery and a slot, and it is what every window
 * in Fernando's reference has.
 *
 * Drawn as a closed path from the hub outward, up one cusped flank, over the head,
 * and back down the other.
 */
function petal(g, cx, cy, a, r0, r1, halfW, cusps = 2) {
  const P = (r, o) => [cx + Math.cos(a + o) * r, cy + Math.sin(a + o) * r]
  g.beginPath()
  g.moveTo(...P(r0, 0))
  /* out along one flank, biting a cusp at each step */
  for (let i = 1; i <= cusps; i++) {
    const t = i / (cusps + 1)
    const r = r0 + (r1 - r0) * t
    g.quadraticCurveTo(...P(r - (r1 - r0) * .08, -halfW * .55 * t), ...P(r, -halfW * t))
  }
  /* the head */
  g.quadraticCurveTo(...P(r1 * .99, -halfW * .78), ...P(r1, 0))
  g.quadraticCurveTo(...P(r1 * .99, halfW * .78), ...P(r1 - (r1 - r0) / (cusps + 1) * 0, halfW))
  /* and back down the other */
  for (let i = cusps; i >= 1; i--) {
    const t = i / (cusps + 1)
    const r = r0 + (r1 - r0) * t
    g.quadraticCurveTo(...P(r - (r1 - r0) * .08, halfW * .55 * t), ...P(r, halfW * t * (i === 1 ? .4 : 1)))
  }
  g.closePath()
  g.fill()
}

/**
 * The Sun: a rose window, everything driving outward from one roundel.
 *
 * Eight petals, not sixteen. The Deck draws under 200px on the Plate and the
 * handoff records the last attempt as "too fine at ~190px" — a rose window that
 * reads at that size has to be built from a few large voids, the way the top-left
 * window in the reference is, not from a lot of small ones.
 *
 * A central eye, eight cusped petals off it, and a course of small eyes riding the
 * spandrels between their heads.
 */
function sunVoids(g) {
  /* the central roundel */
  eye(g, C, C, R * 0.115)

  /* eight petals, each cusped twice a side */
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.2832 - Math.PI / 2
    petal(g, C, C, a, R * 0.22, R * 0.72, 0.30, 2)
  }

  /* the spandrel course — one eye between each pair of heads */
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * 6.2832 - Math.PI / 2
    eye(g, C + Math.cos(a) * R * 0.60, C + Math.sin(a) * R * 0.60, R * 0.072)
  }

  /* an outer ring of quatrefoils, riding the moulding the way the reference does */
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * 6.2832 - Math.PI / 2
    quatrefoil(g, C + Math.cos(a) * R * 0.855, C + Math.sin(a) * R * 0.855, R * 0.085, a)
  }
}

/**
 * The Moon: the same window, and then the phase bitten out of it.
 *
 * Six lobes rather than eight, in a rosette around a hub — the bottom-left window
 * in the reference — so the two Decks are plainly the same mason's work and just
 * as plainly not the same wheel.
 *
 * The piercings are laid across the whole disc and the terminator is applied
 * afterwards as a clip, so the dark limb is *unpierced stone*. The phase is made of
 * where the light can and cannot get through, which is a better idea than drawing
 * a crescent on a wheel.
 */
function moonVoids(g) {
  eye(g, C, C, R * 0.10)

  /* six lobes, wider and shorter than the Sun's — a rosette, not a starburst */
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.2832
    petal(g, C, C, a, R * 0.20, R * 0.66, 0.40, 2)
  }

  /* trefoil eyes in the spandrels */
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) / 6) * 6.2832
    quatrefoil(g, C + Math.cos(a) * R * 0.55, C + Math.sin(a) * R * 0.55, R * 0.075, a, 3)
  }

  /* the outer course: eyes that wax around the rim */
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 - Math.PI / 2
    const k = Math.abs(Math.cos((i / 12) * Math.PI))
    eye(g, C + Math.cos(a) * R * 0.855, C + Math.sin(a) * R * (0.855), R * (0.038 + k * 0.042))
  }
}

/* ---------- maps ---------- */

/** White where the plate is pierced, transparent where it is stone. */
function voidMask(kind) {
  const c = document.createElement('canvas'); c.width = c.height = SIZE
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  /**
   * Both wheels are cut whole.
   *
   * The Moon used to have its phase clipped out of the stone — the piercings laid
   * across the disc and then a terminator applied, so the dark limb was unpierced.
   * It is a lovely idea and it does not survive contact with a 190px wheel: the
   * clip lands mid-petal and leaves fragments, and a rose window in fragments reads
   * as damage, not as a phase.
   *
   * The phase is carried by the **light** instead, which the object already had a
   * mechanism for: `deckGlow(vigil)` decides how hard each wheel's piercings burn,
   * the Sun's holding while the room is lit and the Moon's taking over as it goes.
   * Same idea — the phase is where the light gets through — expressed in the one
   * channel that can hold it at this size.
   */
  if (kind === 'sun') sunVoids(g)
  else moonVoids(g)
  /* nothing is pierced outside the field, or the moulding would be a colander */
  g.globalCompositeOperation = 'destination-in'
  g.fillStyle = '#fff'
  g.beginPath(); g.arc(C, C, R * 0.92, 0, 6.2832); g.fill()
  g.globalCompositeOperation = 'source-over'
  return c
}

/** The moulded ring around the field, drawn onto colour and relief alike. */
function moulding(g, ink, bead) {
  g.strokeStyle = ink
  g.lineWidth = R * 0.022
  for (const k of [1, 0.955, 0.905]) {
    g.beginPath(); g.arc(C, C, R * k, 0, 6.2832); g.stroke()
  }
  g.fillStyle = bead
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 6.2832
    g.beginPath()
    g.arc(C + Math.cos(a) * R * 0.978, C + Math.sin(a) * R * 0.978, R * 0.013, 0, 6.2832)
    g.fill()
  }
}

/**
 * Colour, relief and emission for one Deck.
 *
 * `emissive` is the mask blurred a little: light spilling past the edge of a hole
 * is what makes it read as light coming *through* rather than as a hole painted a
 * bright colour.
 */
export function deckMaps(kind) {
  const mask = voidMask(kind)
  const stone = kind === 'sun' ? '#CFC7B2' : '#BFC2C8'

  /* ---- albedo ---- */
  const A = document.createElement('canvas'); A.width = A.height = SIZE
  const a = A.getContext('2d')
  a.fillStyle = stone; a.fillRect(0, 0, SIZE, SIZE)
  /* a shadow cast into each hole before the hole itself, so the bars have depth */
  a.save()
  a.filter = 'blur(9px)'
  a.globalAlpha = 0.85
  a.drawImage(mask, R * 0.018, R * 0.024)
  a.globalCompositeOperation = 'source-atop'
  a.restore()
  a.save()
  a.globalCompositeOperation = 'source-over'
  a.filter = 'blur(10px)'
  a.globalAlpha = 0.55
  a.fillStyle = '#000'
  a.drawImage(mask, R * 0.02, R * 0.026)
  a.restore()
  /* the voids themselves */
  a.save()
  a.globalCompositeOperation = 'source-over'
  const dark = document.createElement('canvas'); dark.width = dark.height = SIZE
  const dg = dark.getContext('2d')
  dg.drawImage(mask, 0, 0)
  dg.globalCompositeOperation = 'source-in'
  dg.fillStyle = kind === 'sun' ? '#140C06' : '#080A0E'
  dg.fillRect(0, 0, SIZE, SIZE)
  a.drawImage(dark, 0, 0)
  a.restore()
  moulding(a, 'rgba(22,20,16,.8)', 'rgba(30,28,22,.75)')

  /* ---- relief: stone high, voids cut away ---- */
  const H = document.createElement('canvas'); H.width = H.height = SIZE
  const h = H.getContext('2d')
  h.fillStyle = '#b4b4b4'; h.fillRect(0, 0, SIZE, SIZE)
  const cut = document.createElement('canvas'); cut.width = cut.height = SIZE
  const cg = cut.getContext('2d')
  cg.drawImage(mask, 0, 0)
  cg.globalCompositeOperation = 'source-in'
  cg.fillStyle = '#0a0a0a'; cg.fillRect(0, 0, SIZE, SIZE)
  h.drawImage(cut, 0, 0)
  moulding(h, '#e8e8e8', '#f4f4f4')

  /* ---- emission: only the holes ---- */
  const E = document.createElement('canvas'); E.width = E.height = SIZE
  const e = E.getContext('2d')
  e.fillStyle = '#000'; e.fillRect(0, 0, SIZE, SIZE)
  e.save(); e.filter = 'blur(7px)'; e.globalAlpha = 0.5
  e.drawImage(mask, 0, 0); e.restore()
  e.drawImage(mask, 0, 0)

  const tex = (canvas, srgb) => {
    const t = new THREE.CanvasTexture(canvas)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  return { albedo: tex(A, true), height: tex(H, false), emissive: tex(E, true) }
}

/**
 * How hard each Deck burns at a given Vigil.
 *
 * The Sun holds while the room is lit and is out by the time the last Candle is;
 * the Moon is dark at first light and takes over as the room goes. They cross
 * near the middle of the rite, so there is a moment where both are alight and
 * neither has won.
 */
export function deckGlow(vigil) {
  const v = Math.max(0, Math.min(1, vigil))
  return { sun: Math.pow(1 - v, 1.35), moon: Math.pow(v, 1.5) }
}

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
function sunVoids(g) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.2832 - Math.PI / 2
    lancet(g, C, C, a, R * 0.34, R * 0.74, 0.115)
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * 6.2832 - Math.PI / 2
    quatrefoil(g, C + Math.cos(a) * R * 0.80, C + Math.sin(a) * R * 0.80, R * 0.115, a)
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * 6.2832
    eye(g, C + Math.cos(a) * R * 0.255, C + Math.sin(a) * R * 0.255, R * 0.045)
  }
}

/**
 * The Moon: a field of quatrefoils, then the phase bitten out of it.
 *
 * The piercings are laid across the whole disc and the terminator is applied
 * afterwards as a clip, so the dark limb is *unpierced stone* — the phase is made
 * of where the light can and cannot get through, which is what the reference does
 * and is a better idea than drawing a crescent on a wheel.
 */
function moonVoids(g) {
  /* a hex-packed field, the way the reference tiles its lit half */
  const step = R * 0.335
  for (let ring = 0; ring < 3; ring++) {
    const n = ring === 0 ? 1 : ring * 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + ring * 0.4
      const rr = ring * step
      quatrefoil(g, C + Math.cos(a) * rr, C + Math.sin(a) * rr, R * 0.135, a * 0.5)
    }
  }
  /* the outer course: eyes that wax around the rim */
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 - Math.PI / 2
    const k = Math.abs(Math.cos((i / 12) * Math.PI))
    eye(g, C + Math.cos(a) * R * 0.855, C + Math.sin(a) * R * 0.855, R * (0.028 + k * 0.038))
  }
}

/** The lit limb. Everything outside it is solid stone. */
function terminator(g) {
  g.beginPath()
  g.arc(C, C, R * 0.90, 0, 6.2832)
  g.arc(C + R * 0.40, C - R * 0.14, R * 0.78, 0, 6.2832, true)
  g.fill('evenodd')
}

/* ---------- maps ---------- */

/** White where the plate is pierced, transparent where it is stone. */
function voidMask(kind) {
  const c = document.createElement('canvas'); c.width = c.height = SIZE
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  if (kind === 'sun') sunVoids(g)
  else {
    moonVoids(g)
    /* keep only the piercings inside the lit limb */
    g.globalCompositeOperation = 'destination-in'
    terminator(g)
    g.globalCompositeOperation = 'source-over'
  }
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

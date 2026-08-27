import * as THREE from 'three'

/**
 * The faces of the things you actually touch — Pads, and the Crossfader.
 *
 * From `cross and jogs.png`. Everything on this Plate was already the right
 * *shape*; what the reference has and the object did not is the small machined
 * detail that says a control is a made part rather than a coloured box:
 *
 *   - an **amber LED bar** let into the head of every Pad, lit or dark
 *   - **corner brackets** at each Pad's feet, the way a real one is registered
 *   - a Pad that goes **bone** when it is the one you are on, instead of merely
 *     glowing a bit harder
 *   - a Crossfader that is a **milled trough with detent beads**, not a slot
 *
 * All of it is drawn, not modelled. Six Pads and a fader are the wrong place to
 * spend geometry — the whole row is under 200px on screen — and this project has
 * already paid once for adding meshes to a frame budget it did not have.
 *
 * ## UVs
 *
 * Every one of these sits on a `slab()`, which is an `ExtrudeGeometry`, and its
 * UV generator emits **shape coordinates** — the raw x/y of the outline, in world
 * units, not a normalised 0..1. Mapped naively, a 0.23-wide Pad samples a 0.23-wide
 * sliver of the texture around the origin and comes out as one flat colour.
 *
 * `fit()` is the correction: `repeat = 1/size` and `offset = 0.5` remaps
 * `[-size/2, +size/2]` onto `[0, 1]` exactly. It has to be told the part's real
 * dimensions, which is why every export here takes them.
 */

/** Remap an ExtrudeGeometry's shape-space UVs onto the 0..1 the canvas was drawn in. */
function fit(t, w, d) {
  t.repeat.set(1 / w, 1 / d)
  t.offset.set(0.5, 0.5)
  return t
}

const tex = (c, { srgb = true, w = 1, d = 1 } = {}) => {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return fit(t, w, d)
}

const canvas = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

/** A rounded rectangle path, since the 2D context still has no honest one. */
function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/**
 * The faint milled grain every bone and metal surface on this Plate carries.
 *
 * Without it a drawn control is a flat fill, and a flat fill next to the Decks —
 * which are all texture — reads as a placeholder. Cheap: a few dozen strokes at
 * very low alpha, drawn once at build time.
 */
function grain(g, w, h, ink, n = 90, alpha = 0.05) {
  g.save()
  g.globalAlpha = alpha
  g.strokeStyle = ink
  g.lineWidth = 1
  for (let i = 0; i < n; i++) {
    const y = Math.random() * h
    g.beginPath()
    g.moveTo(Math.random() * w * 0.4, y)
    g.lineTo(Math.random() * w * 0.6 + w * 0.4, y + (Math.random() - 0.5) * h * 0.06)
    g.stroke()
  }
  g.restore()
}

/* ---------- pads ---------- */

const PAD_PX = 256
/** Where the LED sits in the Pad's head, as fractions of the face. */
const LED = { y: 0.155, w: 0.30, h: 0.052 }

/**
 * One Pad face.
 *
 * `bone` is the selected state. It is a *material* change, not a brightness one —
 * the reference's active Pad is parchment where the others are graphite — and that
 * is what makes the row readable at a glance: you are looking for the pale one,
 * not for the slightly-less-dark one. The old version moved lightness by five
 * hundredths on a near-black face, which is the same mistake the hover made.
 */
function padFace(bone) {
  const S = PAD_PX
  const c = canvas(S, S)
  const g = c.getContext('2d')

  g.fillStyle = bone ? '#D3C2A4' : '#141517'
  g.fillRect(0, 0, S, S)
  grain(g, S, S, bone ? '#8A7550' : '#5A5F68', 110, bone ? 0.10 : 0.07)

  /* the domed edge: a light top-left lip and a dark bottom-right one, which is
     the whole of what makes a flat square read as a moulded key */
  g.lineWidth = S * 0.018
  g.strokeStyle = bone ? 'rgba(255,248,232,.60)' : 'rgba(126,132,142,.13)'
  roundRect(g, S * 0.045, S * 0.045, S * 0.91, S * 0.91, S * 0.15)
  g.stroke()
  g.strokeStyle = bone ? 'rgba(90,70,40,.28)' : 'rgba(0,0,0,.50)'
  g.lineWidth = S * 0.014
  roundRect(g, S * 0.065, S * 0.072, S * 0.87, S * 0.88, S * 0.14)
  g.stroke()

  /* the LED's recess — the lamp itself is on the emissive map */
  g.fillStyle = bone ? '#6E2410' : '#2A1408'
  roundRect(g, S * (0.5 - LED.w / 2), S * (LED.y - LED.h / 2), S * LED.w, S * LED.h, S * LED.h / 2)
  g.fill()

  /**
   * The registration brackets at the feet.
   *
   * Two, not four. The reference puts them at the bottom corners only, and it is
   * the right call for a control that is *approached from below* — they read as
   * the marks a part is seated against, and a full set of four would have read as
   * a frame around a picture instead.
   */
  g.strokeStyle = bone ? 'rgba(96,74,42,.75)' : 'rgba(176,146,98,.60)'
  g.lineWidth = S * 0.012
  const m = S * 0.155, a = S * 0.075
  for (const s of [1, -1]) {
    const x = s > 0 ? m : S - m
    g.beginPath()
    g.moveTo(x, S - m - a)
    g.lineTo(x, S - m)
    g.lineTo(x + s * a, S - m)
    g.stroke()
    /* the small tick that turns a corner into a mark */
    g.beginPath()
    g.moveTo(x + s * a * 0.35, S - m - a * 0.42)
    g.lineTo(x + s * a * 0.9, S - m - a * 0.42)
    g.stroke()
  }
  return c
}

/** The lamp on its own, so it can burn without the face burning with it. */
function padLamp() {
  const S = PAD_PX
  const c = canvas(S, S)
  const g = c.getContext('2d')
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S)
  /* a little bloom around the bar — an LED behind a diffuser has an edge that
     spills, and it is the spill that stops it reading as a painted rectangle */
  g.save()
  g.filter = 'blur(6px)'
  g.fillStyle = '#B4681A'
  roundRect(g, S * (0.5 - LED.w / 2) - 6, S * (LED.y - LED.h / 2) - 6, S * LED.w + 12, S * LED.h + 12, S * LED.h)
  g.fill()
  g.restore()
  g.fillStyle = '#FFC98A'
  roundRect(g, S * (0.5 - LED.w / 2), S * (LED.y - LED.h / 2), S * LED.w, S * LED.h, S * LED.h / 2)
  g.fill()
  return c
}

/**
 * @param size the Pad's world size, so the UVs can be fitted to it
 * @returns { dark, lit, lamp } — two albedo maps and one emissive
 */
export function padMaps(size) {
  return {
    dark: tex(padFace(false), { w: size, d: size }),
    lit: tex(padFace(true), { w: size, d: size }),
    lamp: tex(padLamp(), { w: size, d: size }),
  }
}

/* ---------- crossfader ---------- */

/**
 * The trough: a milled channel with a rail and six detent beads.
 *
 * The beads are the detail worth having. A bare slot gives the cap nothing to be
 * *at* — it slides through undifferentiated space — where a course of beads turns
 * the travel into positions, which is what a crossfade between six Modules
 * actually is.
 */
export function faderSlot(len, wide) {
  const W = 1024, H = Math.round(W * wide / len)
  const c = canvas(W, H)
  const g = c.getContext('2d')

  g.fillStyle = '#0C0D0E'; g.fillRect(0, 0, W, H)
  grain(g, W, H, '#3A3F46', 60, 0.06)

  /* the brass lip around the channel */
  g.lineWidth = H * 0.075
  g.strokeStyle = 'rgba(198,166,116,.70)'
  roundRect(g, H * 0.10, H * 0.10, W - H * 0.20, H - H * 0.20, H * 0.30)
  g.stroke()
  g.lineWidth = H * 0.045
  g.strokeStyle = 'rgba(0,0,0,.55)'
  roundRect(g, H * 0.20, H * 0.20, W - H * 0.40, H - H * 0.40, H * 0.26)
  g.stroke()

  /* the rail — a dark groove with a lit lower lip, which is how a channel cut
     into metal catches a room lit from above */
  g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = H * 0.055
  g.beginPath(); g.moveTo(H * 0.42, H / 2); g.lineTo(W - H * 0.42, H / 2); g.stroke()
  g.strokeStyle = 'rgba(190,168,128,.30)'; g.lineWidth = H * 0.022
  g.beginPath(); g.moveTo(H * 0.42, H / 2 + H * 0.045); g.lineTo(W - H * 0.42, H / 2 + H * 0.045); g.stroke()

  /* six beads, evenly along the travel */
  for (let i = 0; i < 6; i++) {
    const x = W * (0.08 + (i / 5) * 0.84)
    const r = H * 0.115
    const gr = g.createRadialGradient(x - r * 0.35, H / 2 - r * 0.4, r * 0.1, x, H / 2, r)
    gr.addColorStop(0, '#F0E4CA'); gr.addColorStop(0.6, '#BFA87E'); gr.addColorStop(1, '#6B5A3C')
    g.fillStyle = gr
    g.beginPath(); g.arc(x, H / 2, r, 0, 6.2832); g.fill()
  }
  return tex(c, { w: len, d: wide })
}

/**
 * The cap: bone, chamfered, with a groove down its face.
 *
 * The groove is the only thing on it and it is doing real work — it is what gives
 * the cap a *direction*, so the eye can tell at a glance where along the travel it
 * is pointing. A plain bone block reads as a domino.
 */
export function faderCap(w, d) {
  const W = 192, H = Math.round(W * d / w)
  const c = canvas(W, H)
  const g = c.getContext('2d')

  const gr = g.createLinearGradient(0, 0, W, 0)
  gr.addColorStop(0, '#E6D9BE'); gr.addColorStop(0.45, '#CBBB99'); gr.addColorStop(1, '#8F8168')
  g.fillStyle = gr; g.fillRect(0, 0, W, H)
  grain(g, W, H, '#7A6A48', 70, 0.10)

  /* the chamfer, painted rather than modelled */
  g.strokeStyle = 'rgba(255,250,238,.75)'; g.lineWidth = W * 0.055
  g.beginPath(); g.moveTo(W * 0.06, H * 0.97); g.lineTo(W * 0.06, H * 0.03); g.stroke()
  g.strokeStyle = 'rgba(60,48,30,.45)'; g.lineWidth = W * 0.06
  g.beginPath(); g.moveTo(W * 0.95, H * 0.03); g.lineTo(W * 0.95, H * 0.97); g.stroke()

  /* the groove */
  g.strokeStyle = 'rgba(28,22,14,.85)'; g.lineWidth = W * 0.055
  g.beginPath(); g.moveTo(W / 2, H * 0.12); g.lineTo(W / 2, H * 0.88); g.stroke()
  g.strokeStyle = 'rgba(255,248,230,.35)'; g.lineWidth = W * 0.022
  g.beginPath(); g.moveTo(W / 2 + W * 0.045, H * 0.12); g.lineTo(W / 2 + W * 0.045, H * 0.88); g.stroke()

  return tex(c, { w, d })
}

/**
 * The portrait — Lyra, hanging in the chapel.
 *
 * Beatrice's portrait in the Ushiromiya mansion is never summoned and never
 * dismissed. It is simply always there, gilt-framed, with its plaque under it,
 * and the room is different because it is on the wall. That is the job here: the
 * Wizard currently exists only inside the Screen, which makes her a graphic the
 * Unit draws rather than someone whose room the visitor has walked into.
 *
 * It is deliberately NOT where Works go. A Work is called and dismissed; the
 * portrait is a fixture. Putting both on the wall would have made the wall mean
 * two different things, and the summoning would have read as "the painting
 * changed" instead of "something arrived".
 *
 * PLACEHOLDER ART. ADR-0013 says the character is drawn by hand and the real one
 * should be Fernando's. What follows is a tenebrist stand-in built from the same
 * procedural-canvas vocabulary as the room's other textures — one warm source
 * from the left, everything else swallowed — so the frame, the plaque, the
 * lighting and the placement can be judged before the real painting exists.
 */

import * as THREE from 'three'

const GILT = 0xB08D4A

/** Deterministic noise, so the canvas craquelure is the same every load. */
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/**
 * The painted surface.
 *
 * Chiaroscuro by construction: the ground is near-black, one raking light comes
 * from the upper left, and the figure is built out of what that light finds —
 * brim, cheek, collar. Nothing is outlined. The room is lit this way too, so the
 * painting and the chapel agree about where the light is.
 */
function paintTexture() {
  const c = document.createElement('canvas')
  c.width = 700; c.height = 940
  const g = c.getContext('2d')
  const rnd = rng(3141)
  const W = c.width, H = c.height

  g.fillStyle = '#0B0908'; g.fillRect(0, 0, W, H)

  /* the raking light, falling in from upper left */
  const wash = g.createRadialGradient(W * 0.24, H * 0.20, 10, W * 0.24, H * 0.20, H * 0.86)
  wash.addColorStop(0, 'rgba(150,116,72,.55)')
  wash.addColorStop(0.45, 'rgba(84,62,40,.20)')
  wash.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = wash; g.fillRect(0, 0, W, H)

  const cx = W * 0.52, headY = H * 0.36, headR = W * 0.145

  /* the robe — a dark mass that only exists where the light grazes it */
  g.fillStyle = '#161010'
  g.beginPath()
  g.moveTo(cx - W * 0.34, H)
  g.quadraticCurveTo(cx - W * 0.20, H * 0.62, cx - W * 0.11, H * 0.55)
  g.lineTo(cx + W * 0.11, H * 0.55)
  g.quadraticCurveTo(cx + W * 0.20, H * 0.62, cx + W * 0.34, H)
  g.closePath(); g.fill()

  const lit = g.createLinearGradient(cx - W * 0.3, H * 0.6, cx + W * 0.1, H)
  lit.addColorStop(0, 'rgba(146,112,68,.34)')
  lit.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = lit
  g.beginPath()
  g.moveTo(cx - W * 0.34, H)
  g.quadraticCurveTo(cx - W * 0.20, H * 0.62, cx - W * 0.11, H * 0.55)
  g.lineTo(cx + W * 0.02, H * 0.55)
  g.lineTo(cx - W * 0.06, H)
  g.closePath(); g.fill()

  /* the high collar */
  g.fillStyle = '#241A16'
  g.beginPath()
  g.moveTo(cx - W * 0.13, H * 0.575)
  g.quadraticCurveTo(cx, H * 0.50, cx + W * 0.13, H * 0.575)
  g.quadraticCurveTo(cx, H * 0.545, cx - W * 0.13, H * 0.575)
  g.closePath(); g.fill()

  /* the face: a long oval, lit hard down one side and lost on the other */
  const face = g.createLinearGradient(cx - headR, headY, cx + headR * 0.7, headY)
  face.addColorStop(0, '#C9A882')
  face.addColorStop(0.42, '#8E6E52')
  face.addColorStop(0.8, '#2A1F1A')
  face.addColorStop(1, '#140F0D')
  g.fillStyle = face
  g.beginPath()
  g.ellipse(cx, headY + headR * 0.18, headR * 0.82, headR * 1.12, 0, 0, 6.2832)
  g.fill()

  /* hair, falling well past the jaw in continuous locks */
  g.fillStyle = '#0E0A09'
  g.beginPath()
  g.moveTo(cx - headR * 1.02, headY - headR * 0.2)
  g.quadraticCurveTo(cx - headR * 1.3, headY + headR * 1.9, cx - headR * 0.72, H * 0.58)
  g.lineTo(cx - headR * 0.34, H * 0.55)
  g.quadraticCurveTo(cx - headR * 0.86, headY + headR * 0.9, cx - headR * 0.80, headY)
  g.closePath(); g.fill()
  g.beginPath()
  g.moveTo(cx + headR * 1.02, headY - headR * 0.2)
  g.quadraticCurveTo(cx + headR * 1.34, headY + headR * 2.0, cx + headR * 0.78, H * 0.58)
  g.lineTo(cx + headR * 0.30, H * 0.55)
  g.quadraticCurveTo(cx + headR * 0.90, headY + headR * 0.9, cx + headR * 0.82, headY)
  g.closePath(); g.fill()

  /* the eyes — the only cool notes on the whole canvas, which is why they hold */
  for (const s of [-1, 1]) {
    const ex = cx + s * headR * 0.34, ey = headY + headR * 0.06
    g.fillStyle = 'rgba(20,14,12,.9)'
    g.beginPath(); g.ellipse(ex, ey, headR * 0.17, headR * 0.10, 0, 0, 6.2832); g.fill()
    g.fillStyle = s < 0 ? '#7FA898' : '#3E5A52'
    g.beginPath(); g.arc(ex, ey, headR * 0.062, 0, 6.2832); g.fill()
    g.fillStyle = 'rgba(240,236,220,.85)'
    g.beginPath(); g.arc(ex - headR * 0.022, ey - headR * 0.024, headR * 0.019, 0, 6.2832); g.fill()
  }

  /* the hat: a wide brim, the widest dark shape in the picture */
  g.fillStyle = '#0A0707'
  g.beginPath()
  g.ellipse(cx - headR * 0.06, headY - headR * 0.86, headR * 1.72, headR * 0.34, -0.06, 0, 6.2832)
  g.fill()
  g.beginPath()
  g.moveTo(cx - headR * 0.62, headY - headR * 0.92)
  g.quadraticCurveTo(cx - headR * 0.30, headY - headR * 2.5, cx + headR * 0.44, headY - headR * 1.9)
  g.quadraticCurveTo(cx + headR * 0.66, headY - headR * 1.2, cx + headR * 0.62, headY - headR * 0.88)
  g.closePath(); g.fill()
  /* the one gilt note on the hat band, so the frame has an echo inside the picture */
  g.strokeStyle = 'rgba(176,141,74,.5)'; g.lineWidth = 4
  g.beginPath()
  g.moveTo(cx - headR * 0.58, headY - headR * 0.98)
  g.quadraticCurveTo(cx, headY - headR * 1.22, cx + headR * 0.60, headY - headR * 0.96)
  g.stroke()

  /* varnish, craquelure, and a century of grime in the corners */
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(${180 + rnd() * 40},${150 + rnd() * 40},${110 + rnd() * 40},${rnd() * 0.05})`
    g.lineWidth = 0.6
    const x = rnd() * W, y = rnd() * H
    g.beginPath(); g.moveTo(x, y)
    g.lineTo(x + (rnd() - 0.5) * 26, y + (rnd() - 0.5) * 26)
    g.stroke()
  }
  const vig = g.createRadialGradient(W / 2, H * 0.42, H * 0.18, W / 2, H * 0.42, H * 0.78)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,.72)')
  g.fillStyle = vig; g.fillRect(0, 0, W, H)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** The engraved plaque under it. Brass, and it says who she is. */
function plaqueTexture(name, line) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#6E5A32'; g.fillRect(0, 0, 512, 128)
  const sheen = g.createLinearGradient(0, 0, 512, 128)
  sheen.addColorStop(0, 'rgba(228,205,146,.5)')
  sheen.addColorStop(0.5, 'rgba(120,98,52,.2)')
  sheen.addColorStop(1, 'rgba(214,190,132,.42)')
  g.fillStyle = sheen; g.fillRect(0, 0, 512, 128)
  g.textAlign = 'center'
  /* cut, not printed: a dark stroke with a light one above it reads as engraved */
  g.fillStyle = 'rgba(40,30,12,.85)'
  g.font = '400 44px UnifrakturMaguntia, serif'
  g.fillText(name, 256, 60)
  g.fillStyle = 'rgba(246,232,190,.35)'
  g.fillText(name, 256, 58.5)
  g.fillStyle = 'rgba(40,30,12,.7)'
  g.font = '500 17px "Azeret Mono", monospace'
  g.fillText(line, 256, 96)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * Hang the portrait.
 *
 * `wallFace` is the z of the wall's visible surface — the wall is an extrusion,
 * so its face is not at its position.
 */
export function createPortrait(scene, { x, y, wallFace, height = 4.2, name, line }) {
  const group = new THREE.Group(); scene.add(group)
  const tex = paintTexture()
  const w = height * (700 / 940)

  const giltMat = new THREE.MeshStandardMaterial({
    color: GILT, metalness: 0.92, roughness: 0.28,
  })

  /* the canvas, set back inside its frame so the moulding casts onto it */
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(w, height),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0 }),
  )
  canvas.position.set(x, y, wallFace + 0.06)
  group.add(canvas)

  /* the moulding — four bars, mitred by overlap rather than by geometry */
  const M = 0.26, D = 0.22
  const bars = [
    [w + M * 2, M, x, y + height / 2 + M / 2],
    [w + M * 2, M, x, y - height / 2 - M / 2],
    [M, height, x - w / 2 - M / 2, y],
    [M, height, x + w / 2 + M / 2, y],
  ]
  for (const [bw, bh, bx, by] of bars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, D), giltMat)
    bar.position.set(bx, by, wallFace + D / 2)
    group.add(bar)
  }

  /* the plaque, on the wall below the frame */
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.375),
    new THREE.MeshStandardMaterial({
      map: plaqueTexture(name, line), metalness: 0.85, roughness: 0.38,
    }),
  )
  plaque.position.set(x, y - height / 2 - M - 0.42, wallFace + 0.05)
  group.add(plaque)

  /**
   * She does not go out when the room does.
   *
   * At full Vigil every Candle is dead and the painting would be a black
   * rectangle. A trace of self-illumination keeps her just legible, so the last
   * thing still in the room besides the Screen is her — which is the whole reason
   * a portrait is worth hanging.
   */
  canvas.material.emissiveMap = tex
  canvas.material.emissive = new THREE.Color(0xffffff)
  canvas.material.needsUpdate = true
  /* only the intensity moves per frame — reassigning the map would recompile the
     shader on every tick */
  function update(vigil) {
    canvas.material.emissiveIntensity = 0.05 + vigil * 0.30
  }
  update(0)

  return { update, group }
}

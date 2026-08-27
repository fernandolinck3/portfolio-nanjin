import * as THREE from 'three'

/**
 * Three styles, one corner, one camera — a throwaway.
 *
 * The question this answers is not "which is prettiest" but **"can the room stop
 * imitating a render and start being drawn?"** ADR-0021 measured the ceiling on
 * photoreal: the post chain got us more photographic and not closer to the
 * reference, because what is missing is modelling and global illumination.
 *
 * So each panel builds the *same* corner from the *same* geometry, and changes only
 * how it is surfaced and lit. If the answer is obvious at a glance, that is the
 * point — keep the answer, delete this file.
 */

const stage = document.getElementById('stage')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setScissorTest(true)
stage.appendChild(renderer.domElement)

/* ---------- palettes ---------- */
const P = {
  engraved: { paper: 0xD6CBB2, ink: 0x22201C, ember: 0x8A3A22, gilt: 0xA98A4E },
  cel:      { wall: 0x2A3330, wood: 0x5A4436, bone: 0xC9C2B0, ember: 0xB4472A,
              cold: 0x6E8493, ink: 0x14120F, flame: 0xFFD08A },
  flat:     { ground: 0xE3D8BC, mid: 0x8A3A22, dark: 0x21201E, cold: 0x4A6070 },
}

/* ---------- canvas helpers ---------- */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
function T(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4
  return t
}

/**
 * Hatching, at a chosen density and angle.
 *
 * This is the whole engraved style in one function: tone is carried by **how close
 * the lines are**, not by how dark the pixel is. It is also exactly what
 * `scene.js` already does to the Plate — `hatch()`, `diaper()`, `foliateBorder()` —
 * so this style extends the vocabulary the project already has rather than
 * inventing one.
 */
function hatched(density, angle = -0.6, ink = '#22201C', paper = '#D6CBB2', extra) {
  const [c, g] = cv(256, 256)
  g.fillStyle = paper; g.fillRect(0, 0, 256, 256)
  g.save(); g.translate(128, 128); g.rotate(angle); g.translate(-128, -128)
  g.strokeStyle = ink; g.lineWidth = 1.15
  const step = 26 - density * 20            // dense = dark
  for (let i = -256; i < 512; i += step) { g.beginPath(); g.moveTo(i, -256); g.lineTo(i, 512); g.stroke() }
  if (density > 0.62) {                      // cross-hatch only in the darks
    g.rotate(1.1)
    for (let i = -256; i < 512; i += step * 1.25) { g.beginPath(); g.moveTo(i, -256); g.lineTo(i, 512); g.stroke() }
  }
  g.restore()
  extra?.(g)
  return c
}

/** A stepped ramp for `MeshToonMaterial` — the number of bands is the whole look. */
function ramp(stops) {
  const [c, g] = cv(stops.length, 1)
  stops.forEach((s, i) => { g.fillStyle = s; g.fillRect(i, 0, 1, 1) })
  const t = new THREE.CanvasTexture(c)
  t.minFilter = t.magFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ---------- the corner, built once per style ----------
   Same numbers in all three. Only `S` (the style's material factory) changes. */
function buildCorner(S) {
  const g = new THREE.Group()
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m }

  add(new THREE.Mesh(new THREE.PlaneGeometry(16, 16), S.floor()), 0, 0, 0).rotation.x = -Math.PI / 2
  add(new THREE.Mesh(new THREE.PlaneGeometry(16, 7), S.wall()), 0, 3.5, -8)
  const side = add(new THREE.Mesh(new THREE.PlaneGeometry(16, 7), S.wall()), -8, 3.5, 0)
  side.rotation.y = Math.PI / 2

  /* an arched acoustic panel */
  const arch = new THREE.Shape()
  arch.moveTo(-.75, 0); arch.lineTo(-.75, 1.7)
  arch.absarc(0, 1.7, .75, Math.PI, 0, true)
  arch.lineTo(.75, 0); arch.closePath()
  const panel = add(new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: .12, bevelEnabled: false }), S.panel()), 2.4, 1.9, -7.9)

  /* credenza against the side wall, running away from camera */
  const cab = new THREE.Group(); cab.position.set(-6.6, 0, -2.2); cab.rotation.y = Math.PI / 2; g.add(cab)
  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 1.2), S.wood())
  body.position.y = 1.0; cab.add(body)
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .5, 8), S.wood())
    leg.position.set(sx * 2.2, .25, .4); cab.add(leg)
  }

  /* the table, forward */
  const table = new THREE.Mesh(new THREE.BoxGeometry(7.5, .45, 4.2), S.wood())
  add(table, .5, 2.1, 1.4)
  for (const [x, z] of [[-3.2, -1.6], [3.2, -1.6], [-3.2, 1.6], [3.2, 1.6]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.14, .12, 1.9, 10), S.wood())
    add(leg, .5 + x, .95, 1.4 + z)
  }

  /* a candle, and a lamp globe — the two light sources the room is built around */
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.13, .26, .5, 12), S.metal())
  add(stick, -1.5, 2.55, 1.2)
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.11, .12, .8, 12), S.wax())
  add(wax, -1.5, 3.2, 1.2)
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 12), S.flame())
  add(flame, -1.5, 3.75, 1.2).scale.y = 1.9

  const globe = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 14), S.flame())
  add(globe, -6.4, 2.1, -2.2)

  S.decorate?.(g, { panel })
  return g
}

/** An inverted-hull outline: the cheap way to draw a line round a solid. */
function outline(root, colour, thickness) {
  const mat = new THREE.MeshBasicMaterial({ color: colour, side: THREE.BackSide })
  const shells = []
  root.traverse(n => { if (n.isMesh) shells.push(n) })
  for (const m of shells) {
    const s = new THREE.Mesh(m.geometry, mat)
    s.position.copy(m.position); s.rotation.copy(m.rotation)
    s.scale.copy(m.scale).multiplyScalar(1 + thickness)
    m.parent.add(s)
  }
}

/* ---------- ornament ----------
   The Unit is not simple and it is not flat. It is near-black, metallic, and
   covered edge to edge in fine gilt engraving. The first version of this test
   read "stylised" as "reduced" and produced three pale, sparse rooms that looked
   nothing like it. Ornament *is* the style — so the room has to be as densely
   worked as the Plate, on the same dark ground, in the same gold. */

const GOLD = '#B08D4A', GOLD_D = '#7E6435', BONE = '#C9C2B0', EMBER = '#8A3A22'

/** Fine ruled ground — the Plate never leaves bare metal. */
function ground(g, w, h, step, colour) {
  g.strokeStyle = colour; g.lineWidth = 1
  for (let i = -h; i < w + h; i += step) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke()
    g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke()
  }
}

function starburst(g, cx, cy, r, points = 16) {
  g.beginPath()
  for (let k = 0; k < points * 2; k++) {
    const a = (k / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const rr = k % 2 ? r * .34 : r
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    k ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.closePath(); g.fill()
}

/** A scrolling vine — the foliate run that borders the Plate. */
function vine(g, x0, y0, x1, y1, waves, amp) {
  g.beginPath()
  const n = 90
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * waves * 6.283) * amp
    i ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.stroke()
  for (let i = 0; i < waves * 2; i++) {
    const t = (i + .5) / (waves * 2)
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * waves * 6.283) * amp
    g.beginPath(); g.ellipse(x, y, amp * .5, amp * .22, i * 1.1, 0, 6.283); g.fill()
  }
}

/**
 * An engraved surface: dark ground, ruled tone, a border, and devices.
 *
 * This is the whole proposition. Every wall, every board and every carcase in the
 * room gets one of these, the way every square inch of the Plate is worked.
 */
function engravedSurface({ size = 512, base = '#171412', density = 26, border = true,
                           devices = 'stars', gold = GOLD, tone = 'rgba(176,141,74,.10)' } = {}) {
  const [c, g] = cv(size, size)
  g.fillStyle = base; g.fillRect(0, 0, size, size)
  ground(g, size, size, density, tone)

  if (border) {
    g.strokeStyle = gold; g.lineWidth = size * .012
    g.strokeRect(size * .06, size * .06, size * .88, size * .88)
    g.lineWidth = size * .004
    g.strokeRect(size * .10, size * .10, size * .80, size * .80)
    g.fillStyle = gold
    vine(g, size * .13, size * .155, size * .87, size * .155, 5, size * .022)
    vine(g, size * .13, size * .845, size * .87, size * .845, 5, size * .022)
  }

  g.fillStyle = gold
  if (devices === 'stars') {
    const rnd = (() => { let x = 991; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296 })()
    for (let i = 0; i < 22; i++) starburst(g, rnd() * size, rnd() * size, 4 + rnd() * 11, 8)
  } else if (devices === 'sun') {
    const cx = size / 2, cy = size * .46, R = size * .17
    g.strokeStyle = gold; g.lineWidth = size * .006
    g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 6.283
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * R * 1.18, cy + Math.sin(a) * R * 1.18)
      g.lineTo(cx + Math.cos(a) * R * (i % 2 ? 1.45 : 1.75), cy + Math.sin(a) * R * (i % 2 ? 1.45 : 1.75))
      g.stroke()
    }
    starburst(g, cx, cy, R * .58, 12)
  } else if (devices === 'moon') {
    const cx = size * .52, cy = size * .46, R = size * .19
    g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.arc(cx + R * .42, cy - R * .26, R * .86, 0, 6.283, true)
    g.fill('evenodd')
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.283 + .3
      starburst(g, cx + Math.cos(a) * R * 1.9, cy + Math.sin(a) * R * 1.9, size * .012, 8)
    }
  }
  return c
}

/* ---------- the three, on the corrected axis ---------- */

/** 1 · PLATE — the room surfaced exactly as the Unit is: dark, gilt, metallic. */
function stylePlate() {
  const metal = (opts, rx = 1, ry = 1, rough = .38) => new THREE.MeshStandardMaterial({
    map: T(engravedSurface(opts), rx, ry), color: 0xFFFFFF,
    metalness: .72, roughness: rough,
  })
  const S = {
    floor: () => metal({ base: '#100E0C', density: 34, border: false, devices: 'stars' }, 5, 5, .52),
    wall:  () => metal({ base: '#15120F', density: 30, devices: 'sun' }, 3, 1.4),
    wood:  () => metal({ base: '#0E0C0A', density: 22, devices: 'stars' }, 2, 1, .34),
    metal: () => new THREE.MeshStandardMaterial({ color: 0xC9A03C, metalness: 1, roughness: .24 }),
    wax:   () => new THREE.MeshStandardMaterial({ color: 0xF3E7CE, roughness: .6 }),
    flame: () => new THREE.MeshBasicMaterial({ color: 0xFFD9A0 }),
    panel: () => metal({ base: '#2A1512', density: 20, devices: 'moon', gold: '#C9A64E' }, 1, 1, .6),
  }
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0A0908)
  scene.add(new THREE.AmbientLight(0xFFE0B8, .55))
  const key = new THREE.PointLight(0xFFB162, 60, 40, 2); key.position.set(-1.5, 4.2, 1.2); scene.add(key)
  const lamp = new THREE.PointLight(0xF3C070, 34, 26, 2); lamp.position.set(-6.4, 2.4, -2.2); scene.add(lamp)
  const moon = new THREE.DirectionalLight(0x8FA6C4, .5); moon.position.set(3, 5, -6); scene.add(moon)
  scene.add(buildCorner(S))
  return scene
}

/** 2 · RELIQUARY — the same, pushed: more gold, deeper black, jewelled accents. */
function styleReliquary() {
  const metal = (opts, rx = 1, ry = 1, rough = .3) => new THREE.MeshStandardMaterial({
    map: T(engravedSurface(opts), rx, ry), metalness: .88, roughness: rough,
  })
  const S = {
    floor: () => metal({ base: '#0B0A0A', density: 22, border: false, devices: 'stars', gold: '#C9A64E' }, 4, 4, .44),
    wall:  () => metal({ base: '#0E0D10', density: 18, devices: 'sun', gold: '#D4B15C' }, 2.4, 1.2, .28),
    wood:  () => metal({ base: '#08070A', density: 16, devices: 'stars', gold: '#C9A64E' }, 2, 1, .26),
    metal: () => new THREE.MeshStandardMaterial({ color: 0xE0BC64, metalness: 1, roughness: .16 }),
    wax:   () => new THREE.MeshStandardMaterial({ color: 0xF6EEDA, roughness: .55 }),
    flame: () => new THREE.MeshBasicMaterial({ color: 0xFFE6BC }),
    panel: () => metal({ base: '#1A2740', density: 16, devices: 'moon', gold: '#D4B15C' }, 1, 1, .34),
  }
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x07070A)
  scene.add(new THREE.AmbientLight(0xC0D0E8, .40))
  const key = new THREE.PointLight(0xFFC078, 72, 40, 2); key.position.set(-1.5, 4.2, 1.2); scene.add(key)
  const lamp = new THREE.PointLight(0xF3C070, 40, 26, 2); lamp.position.set(-6.4, 2.4, -2.2); scene.add(lamp)
  const moon = new THREE.DirectionalLight(0x93AFD6, .8); moon.position.set(3, 5, -6); scene.add(moon)
  scene.add(buildCorner(S))
  return scene
}

/** 3 · NOCTURNE — ornament held back to the borders; the dark does the work. */
function styleNocturne() {
  const metal = (opts, rx = 1, ry = 1, rough = .5) => new THREE.MeshStandardMaterial({
    map: T(engravedSurface(opts), rx, ry), metalness: .5, roughness: rough,
  })
  const S = {
    floor: () => metal({ base: '#141110', density: 44, border: false, devices: 'none' }, 6, 6, .62),
    wall:  () => metal({ base: '#12100F', density: 40, devices: 'stars' }, 3, 1.4, .58),
    wood:  () => metal({ base: '#0F0D0B', density: 30, devices: 'none' }, 2, 1, .44),
    metal: () => new THREE.MeshStandardMaterial({ color: 0xB08D4A, metalness: 1, roughness: .3 }),
    wax:   () => new THREE.MeshStandardMaterial({ color: 0xEFE3C8, roughness: .6 }),
    flame: () => new THREE.MeshBasicMaterial({ color: 0xFFD9A0 }),
    panel: () => metal({ base: '#241310', density: 26, devices: 'moon' }, 1, 1, .66),
  }
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x080807)
  scene.add(new THREE.AmbientLight(0xFFE0B8, .3))
  const key = new THREE.PointLight(0xFFB162, 55, 36, 2); key.position.set(-1.5, 4.2, 1.2); scene.add(key)
  const lamp = new THREE.PointLight(0xF3C070, 30, 24, 2); lamp.position.set(-6.4, 2.4, -2.2); scene.add(lamp)
  scene.add(buildCorner(S))
  return scene
}

/* ---------- three viewports, one camera ---------- */
const scenes = [stylePlate(), styleReliquary(), styleNocturne()]
const camera = new THREE.PerspectiveCamera(34, 1, .1, 200)
let yaw = -0.50, tilt = 0.40, dist = 30
function place() {
  camera.position.set(Math.sin(yaw) * Math.cos(tilt) * dist,
                      Math.sin(tilt) * dist + 1.2,
                      Math.cos(yaw) * Math.cos(tilt) * dist)
  camera.lookAt(-0.6, 2.0, -1.0)
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight
  renderer.setSize(w, h)
  camera.aspect = (w / 3) / h
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)

let down = false, px = 0, py = 0
renderer.domElement.addEventListener('pointerdown', e => { down = true; px = e.clientX; py = e.clientY })
addEventListener('pointerup', () => { down = false })
addEventListener('pointermove', e => {
  if (!down) return
  yaw -= (e.clientX - px) * .006
  tilt = Math.max(.08, Math.min(1.1, tilt + (e.clientY - py) * .004))
  px = e.clientX; py = e.clientY
})

function frame() {
  place()
  const w = stage.clientWidth, h = stage.clientHeight, third = Math.floor(w / 3)
  for (let i = 0; i < 3; i++) {
    renderer.setViewport(i * third, 0, third, h)
    renderer.setScissor(i * third, 0, third, h)
    renderer.render(scenes[i], camera)
  }
  requestAnimationFrame(frame)
}
resize()
frame()

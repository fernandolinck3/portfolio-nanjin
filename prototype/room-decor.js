/**
 * The room, after Fernando's `roomexample` reference.
 *
 * The chapel the Unit was standing in was carved oak and stone — correct for the
 * Vigil, wrong for the thing on the table. The reference is a *studio*: a dark
 * painted room with arched acoustic panels, monitors either side, a credenza of
 * records, guitar pedals on a cabinet, and two warm globe lamps doing most of the
 * work the candles were doing alone.
 *
 * That is a better room for this object, and it does not cost the register. It is
 * still night, still lit in warm pools against deep shadow, still celestial — the
 * panels carry suns, crescents and stars, and the whole palette is the Plate's:
 * bone, ember red, cool blue-grey, on near-black.
 *
 * What it adds is *lived-in*. A chapel is a place you visit; a studio is a place
 * someone works, and the Unit is supposed to be something Fernando made rather
 * than an artefact on display.
 *
 * Everything here is furniture and fittings. The Altar, the Candles, the window
 * and the Portrait stay where they are.
 */

import * as THREE from 'three'

const BONE = '#C9C2B0', EMBER = '#B4472A', COLD = '#6E8493'
const GILT = 0xB08D4A

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/* ---------- acoustic panels ---------- */

/**
 * A panel's face: fabric, with one celestial mark drawn on it in gilt.
 *
 * Sparse on purpose. The reference gives each panel a single motif and lets the
 * colour do the rest; a busy panel would compete with the Plate, which is the
 * thing in the room that is allowed to be busy.
 */
function panelFace(colour, motif, seed) {
  const c = document.createElement('canvas'); c.width = 420; c.height = 900
  const g = c.getContext('2d')
  const rnd = rng(seed)
  g.fillStyle = colour; g.fillRect(0, 0, 420, 900)

  /* woven fabric: fine crosshatch, low contrast */
  g.globalAlpha = .05
  for (let i = 0; i < 900; i += 3) {
    g.strokeStyle = i % 6 ? '#000' : '#fff'
    g.beginPath(); g.moveTo(0, i); g.lineTo(420, i + (rnd() - .5) * 2); g.stroke()
  }
  for (let i = 0; i < 420; i += 3) {
    g.strokeStyle = i % 6 ? '#000' : '#fff'
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + (rnd() - .5) * 2, 900); g.stroke()
  }
  g.globalAlpha = 1

  const cx = 210, cy = 300
  g.strokeStyle = 'rgba(190,158,96,.85)'
  g.fillStyle = 'rgba(190,158,96,.85)'
  g.lineWidth = 3

  if (motif === 'sun') {
    g.beginPath(); g.arc(cx, cy, 46, 0, 6.2832); g.stroke()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 6.2832
      const r0 = 56, r1 = i % 2 ? 96 : 74
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
      g.stroke()
    }
  } else if (motif === 'moon') {
    /* a big crescent, the panel's whole subject */
    g.beginPath()
    g.arc(cx, cy + 60, 120, 0, 6.2832)
    g.arc(cx + 58, cy + 20, 108, 0, 6.2832, true)
    g.fill('evenodd')
  } else {
    /* an eight-pointed star, long on the cardinals */
    g.beginPath()
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.2832 - Math.PI / 2
      const r = i % 4 === 0 ? 108 : i % 2 === 0 ? 44 : 22
      const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
      i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
    }
    g.closePath(); g.fill()
  }

  /* a few small marks lower down, so the panel is not one lonely symbol */
  for (let i = 0; i < 5; i++) {
    const x = 60 + rnd() * 300, y = 520 + rnd() * 320, r = 4 + rnd() * 7
    g.beginPath()
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.2832 - Math.PI / 2
      const rr = k % 2 ? r * .38 : r
      const p = [x + Math.cos(a) * rr, y + Math.sin(a) * rr]
      k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
    }
    g.closePath(); g.fill()
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** A round-arched panel: a rectangle with a half-round head. */
function archGeom(w, h, depth) {
  const s = new THREE.Shape()
  const r = w / 2
  s.moveTo(-r, 0)
  s.lineTo(-r, h - r)
  s.absarc(0, h - r, r, Math.PI, 0, true)
  s.lineTo(r, 0)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: .02, bevelSize: .02,
    bevelSegments: 2, curveSegments: 24,
  })
  /* the face maps 0..1 across the panel so the fabric is not stretched by the arch */
  g.computeBoundingBox()
  const bb = g.boundingBox
  const pos = g.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x)
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/* ---------- fittings ---------- */

/** A frosted globe on a brass stem. The room's warm light that is not a Candle. */
function globeLamp(parent, x, y, z) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(.05, .10, .34, 12),
    new THREE.MeshStandardMaterial({ color: GILT, metalness: .9, roughness: .32 }))
  stem.position.set(x, y + .17, z); parent.add(stem)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.29, .022, 8, 32),
    new THREE.MeshStandardMaterial({ color: GILT, metalness: .95, roughness: .28 }))
  ring.position.set(x, y + .60, z); ring.rotation.x = Math.PI / 2; parent.add(ring)

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(.27, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0xF6E3BE, emissive: 0xF3C878, emissiveIntensity: 1.5,
      roughness: .6, metalness: 0,
    }))
  globe.position.set(x, y + .60, z); parent.add(globe)

  /* With skyLight demoted to real moonlight these two are the room's daylight, so
     they carry far more than they used to — and being point lights they do it in
     pools that fall off, which is the whole point. */
  const light = new THREE.PointLight(0xF3C070, 5.2, 16, 2)
  light.position.set(x, y + .62, z); parent.add(light)
  return { globe, light }
}

/** A nearfield monitor on a stand: cabinet, woofer, tweeter, port. */
function monitor(parent, x, z, floorY, faceZ) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x141516, roughness: .68, metalness: .1 })
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.62, 2.30, .62), dark)
  stand.position.set(x, floorY + 1.15, z); parent.add(stand)
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.95, .09, .95), dark)
  foot.position.set(x, floorY + .045, z); parent.add(foot)

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.48, .92),
    new THREE.MeshStandardMaterial({ color: 0x1A1B1D, roughness: .55, metalness: .16 }))
  box.position.set(x, floorY + 3.04, z); parent.add(box)

  const cone = new THREE.MeshStandardMaterial({ color: 0x0A0A0B, roughness: .85 })
  const surround = new THREE.MeshStandardMaterial({ color: 0x2A2724, roughness: .7, metalness: .3 })
  const front = z + .47
  const woofer = new THREE.Mesh(new THREE.CylinderGeometry(.30, .30, .05, 28), cone)
  woofer.rotation.x = Math.PI / 2
  woofer.position.set(x, floorY + 2.72, front); parent.add(woofer)
  const wRing = new THREE.Mesh(new THREE.TorusGeometry(.31, .035, 8, 28), surround)
  wRing.position.set(x, floorY + 2.72, front); parent.add(wRing)

  const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .05, 20), cone)
  tweeter.rotation.x = Math.PI / 2
  tweeter.position.set(x, floorY + 3.52, front); parent.add(tweeter)

  const port = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .06, 16), cone)
  port.rotation.x = Math.PI / 2
  port.position.set(x, floorY + 3.20, front); parent.add(port)
}

/** A long low cabinet. `shelf` fills its front with whatever is passed back. */
function credenza(parent, { x, z, w, h, d, floorY }) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x3A2E26, roughness: .52, metalness: .05 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood)
  body.position.set(x, floorY + h / 2 + .16, z); parent.add(body)
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.055, .045, .34, 10), wood)
    leg.position.set(x + sx * (w / 2 - .22), floorY + .17, z + d / 2 - .18); parent.add(leg)
    const leg2 = leg.clone(); leg2.position.z = z - d / 2 + .18; parent.add(leg2)
  }
  return { top: floorY + h + .16, front: z + d / 2 }
}

/* ---------- the room ---------- */

/**
 * Furnish the room.
 *
 * `wallFace` is the z of the far wall's visible surface — it is an extrusion, so
 * its face is not at its position.
 */
export function createRoomDecor(room, { floorY, wallFace, sideX }) {
  /* Everything this builds goes in one group rather than loose into the room, so
     `__unit.perf()` can switch the whole furnishing off in a frame and price it.
     Reassigning the parameter keeps the sixty `room.add` calls below untouched. */
  const group = new THREE.Group()
  room.add(group)
  room = group

  const lamps = []
  /**
   * Staging (ADR-0020).
   *
   * Everything used to sit on the back wall, at one distance, mirrored left to
   * right: three panels each side, a credenza at x=-9.4 and a pedal cabinet at
   * x=+8.6, both facing the camera square-on. Nothing overlapped anything, so
   * there was nothing for the eye to read as depth, and the mirror symmetry read
   * as a stage set rather than a room somebody works in.
   *
   * The reference does the opposite, and it is the whole reason it reads as a
   * space: the furniture stands against the **side** walls, running away from the
   * camera, **overlapping** the panels behind it. Convergence and occlusion are
   * what depth actually is — a bevel on a card is still a card.
   *
   * So each side gets a `bay`: a group parked against its wall and rotated a
   * quarter turn, with its contents built in local coordinates. Rotating the group
   * rather than every mesh is what keeps this readable — local +x runs along the
   * wall, local +z comes out of it.
   */
  const bay = (x, z, turn) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.rotation.y = turn
    room.add(g)
    return g
  }

  /* ---- the left bay: the credenza of records, along the left wall ---- */
  const LEFT_D = 1.15
  const left = bay(-sideX + 0.30 + LEFT_D / 2, wallFace + 6.4, Math.PI / 2)
  const leftTop = credenza(left, { x: 0, z: 0, w: 6.0, h: 1.45, d: LEFT_D, floorY })

  /* Records: thin slabs leaning in a row. Their spines are the only place in the
     room with arbitrary colour, which is what makes them read as somebody's
     collection rather than as decoration. */
  const rnd = rng(8123)
  const spines = ['#5A2321', '#2E4750', '#7A6A4A', '#3A2E26', '#8A5A3C', '#243038']
  const recGeom = new THREE.BoxGeometry(1, 1.02, .96)
  for (let i = 0; i < 40; i++) {
    const rec = new THREE.Mesh(recGeom, new THREE.MeshStandardMaterial({
      color: spines[i % spines.length], roughness: .88, metalness: 0,
    }))
    rec.scale.x = .035 + rnd() * .02
    rec.position.set(-2.5 + i * .105, floorY + .78, .06)
    rec.rotation.z = (rnd() - .5) * .05
    left.add(rec)
  }

  /* a plant, because every studio has one and it is the only soft thing here */
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .38, 14),
    new THREE.MeshStandardMaterial({ color: 0x6B4A38, roughness: .9 }))
  pot.position.set(2.35, leftTop.top + .19, -.06); left.add(pot)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x35492F, roughness: .85, side: THREE.DoubleSide })
  const leafGeom = new THREE.CircleGeometry(.20, 8, 0, Math.PI)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.2832
    const l = new THREE.Mesh(leafGeom, leafMat)
    l.position.set(2.35 + Math.cos(a) * .12, leftTop.top + .52 + (i % 3) * .14, -.06 + Math.sin(a) * .12)
    l.rotation.set(-.9 + (i % 3) * .2, a, 0)
    left.add(l)
  }
  lamps.push(globeLamp(left, -2.6, leftTop.top, -.04))

  /* ---- the right bay: the pedal cabinet, along the right wall ---- */
  const RIGHT_D = 1.10
  const right = bay(sideX - 0.30 - RIGHT_D / 2, wallFace + 7.2, -Math.PI / 2)
  const rightTop = credenza(right, { x: 0, z: 0, w: 4.2, h: 1.30, d: RIGHT_D, floorY })
  const pedalCols = [0x8A2E12, 0x2E4750, 0x6B5A2A, 0x24303A, 0x5A2321]
  const pedalGeom = new THREE.BoxGeometry(.42, .16, .58)
  const knobGeom = new THREE.CylinderGeometry(.05, .05, .06, 10)
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xC9C2B0, roughness: .4, metalness: .3 })
  for (let i = 0; i < 5; i++) {
    const pd = new THREE.Mesh(pedalGeom, new THREE.MeshStandardMaterial({
      color: pedalCols[i], roughness: .5, metalness: .5 }))
    pd.position.set(-1.35 + i * .58, rightTop.top + .08, -.02); right.add(pd)
    const kn = new THREE.Mesh(knobGeom, knobMat)
    kn.position.set(-1.35 + i * .58, rightTop.top + .19, -.16); right.add(kn)
  }
  /* coiled cables on the shelf below — one warm, one cold, like the Plate */
  const coilGeom = new THREE.TorusGeometry(.30, .045, 8, 28)
  for (const [i, col] of [[0, 0x8A2E12], [1, 0x2E5A70]]) {
    const coil = new THREE.Mesh(coilGeom, new THREE.MeshStandardMaterial({ color: col, roughness: .72 }))
    coil.rotation.x = Math.PI / 2
    coil.position.set(-.55 + i * .95, floorY + .72, .10); right.add(coil)
  }
  lamps.push(globeLamp(right, 1.75, rightTop.top, -.04))

  /* ---- arched acoustic panels: two on the left, three on the right ----
     Deliberately unequal. Six panels in two mirrored threes was the single
     loudest thing saying "this was arranged, not lived in". */
  const PANEL = { w: 1.52, h: 4.20, d: .16 }
  const geom = archGeom(PANEL.w, PANEL.h, PANEL.d)
  const scheme = [[BONE, 'star'], [EMBER, 'moon'], [COLD, 'sun'], [EMBER, 'moon'], [BONE, 'star']]
  const places = [-8.15, -6.35, 4.35, 6.15, 7.95]
  places.forEach((x, n) => {
    const [colour, motif] = scheme[n % scheme.length]
    const m = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      map: panelFace(colour, motif, 4000 + n * 137), roughness: .94, metalness: 0,
    }))
    /* heights nudged apart — a row of tops at one level is another giveaway */
    m.position.set(x, floorY + 3.05 + (n % 2 ? .18 : -.12), wallFace + .02)
    room.add(m)
  })

  /* ---- monitors, forward of the wall on their stands, flanking the window ----
     Not mirrored: the left one stands closer and reads larger, which is what puts
     the two of them at different depths instead of on one line. */
  monitor(room, -3.30, wallFace + 2.10, floorY, wallFace + 2.10)
  monitor(room, 3.95, wallFace + 1.25, floorY, wallFace + 1.25)

  /**
   * The lamps go out with the room.
   *
   * `CONTEXT.md`: at Vigil 1 every lamp is out and the Screen's phosphor is the
   * only source. A studio lamp that stayed on would quietly break the one rule the
   * whole object is built around.
   *
   * They die *early* — gone by .55, before the last Candles. That is the order you
   * would actually do it in: kill the room lights, work by candle, and let the
   * Screen have the last of it.
   */
  let globeI = 5.2
  let lastK = 1
  function update(vigil) {
    const k = Math.max(0, Math.min(1, 1 - vigil / .55))
    const e = k * k * (3 - 2 * k)
    lastK = e
    for (const l of lamps) {
      l.light.intensity = e * globeI
      /* out means out of the shader, not multiplied by zero — see `dim()` */
      l.light.visible = l.light.intensity > 0.0005
      l.globe.material.emissiveIntensity = .06 + e * 1.44
    }
  }
  update(0)

  /* `__unit.setLight({ globe })` — the fitted value needs eyes on it like the rest. */
  function setGlobe(i) {
    globeI = i
    for (const l of lamps) { l.light.intensity = lastK * globeI; l.light.visible = l.light.intensity > 0.0005 }
    return globeI
  }

  /* `lamps` so scene.js can put the globes out when the room itself is hidden —
     a light that illuminates nothing invisible still costs every lit fragment. */
  return { update, setGlobe, group, lamps: lamps.map(l => l.light) }
}

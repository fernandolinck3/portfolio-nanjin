import * as THREE from 'three'

/**
 * What is lying on the Altar besides the Unit.
 *
 * The Altar is the largest surface in frame, and holding three candlesticks and
 * nothing else is most of why it read as a product shot rather than as somebody's
 * desk. The reference's table carries a closed grimoire with a gilt star, a pen
 * dropped beside it, two cards face up, a wand, headphones on their side and a
 * brass cable port sunk into the wood — that is the thing that says a person works
 * here.
 *
 * Everything here is geometry and canvas texture. No new lights, no
 * `MeshPhysicalMaterial`, no clearcoat, no transmission — ADR-0019 measured those
 * at 87%, 66% and 41% of the frame, while triangles cost nothing worth counting.
 * Clutter is the one direction this scene can afford (`docs/realism-budget.md`),
 * so the detail budget goes into *segments and bevels*, which are free, and never
 * into another light.
 *
 * Scale comes from the Unit, not from metres: the Plate is 5.94 across, so a book
 * that reads as a book is about a third of that.
 */

/* One material per finish, shared by everything wearing it. */
const MAT = {
  boardDark: new THREE.MeshStandardMaterial({ color: 0x241E19, roughness: .74, metalness: .04 }),
  boardEdge: new THREE.MeshStandardMaterial({ color: 0x161210, roughness: .82, metalness: .04 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xC4B79A, roughness: .93, metalness: 0 }),
  gilt: new THREE.MeshStandardMaterial({ color: 0xB08D4A, roughness: .26, metalness: .96 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x8A6F3C, roughness: .32, metalness: .92 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x14100E, roughness: .86, metalness: .02 }),
  cupShell: new THREE.MeshStandardMaterial({ color: 0x1A1B1D, roughness: .52, metalness: .28 }),
  pad: new THREE.MeshStandardMaterial({ color: 0x0E0F10, roughness: .95, metalness: .01 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x7A7E84, roughness: .34, metalness: .9 }),
  /* Headphone cups are dark plastic with a *hint* of metal, not chrome. A light
     steel plate across the top turned them into the two brightest objects on the
     Altar — a pair of pale coins where a pair of black cups belongs. */
  darkTrim: new THREE.MeshStandardMaterial({ color: 0x2B2D31, roughness: .44, metalness: .55 }),
  copper: new THREE.MeshStandardMaterial({ color: 0x8C5A34, roughness: .30, metalness: .92 }),
  lapis: new THREE.MeshStandardMaterial({ color: 0x223A58, roughness: .42, metalness: .18 }),
  ribbon: new THREE.MeshStandardMaterial({ color: 0x6E2018, roughness: .88, metalness: 0, side: THREE.DoubleSide }),
}

function rng(seed) { let x = seed >>> 0; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296 }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
function tex(c) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

/* ---------- the house ornament vocabulary ----------
   These are the same three shapes `deck-faces.js` pierces the Decks with. The
   cards were drawn with a plain filled circle and a plain crescent, which is why
   they read as clip art beside a Plate covered in tracery: they were not speaking
   the object's language. Sharing the vocabulary is the whole fix. */

/** A quatrefoil: four lobes and the star of ground between them. */
function quatrefoil(g, cx, cy, r, rot = 0, lobes = 4) {
  const lr = r * 0.52
  g.beginPath()
  for (let i = 0; i < lobes; i++) {
    const a = rot + (i / lobes) * Math.PI * 2
    g.moveTo(cx + Math.cos(a) * (r - lr) + lr, cy + Math.sin(a) * (r - lr))
    g.arc(cx + Math.cos(a) * (r - lr), cy + Math.sin(a) * (r - lr), lr, 0, 6.2832)
  }
  g.fill()
}

/** A lancet aimed outward from a hub — the pointed arch, not a slot. */
function lancet(g, cx, cy, a, r0, r1, halfWidth) {
  const px = (r, o) => [cx + Math.cos(a + o) * r, cy + Math.sin(a + o) * r]
  const ca = Math.cos(a), sa = Math.sin(a)
  g.beginPath()
  const [ax, ay] = px(r0, -halfWidth); g.moveTo(ax, ay)
  const [bx, by] = px(r1 * 0.82, -halfWidth); g.lineTo(bx, by)
  g.quadraticCurveTo(cx + ca * r1 * 0.98, cy + sa * r1 * 0.98, ...px(r1, 0))
  const [dx, dy] = px(r1 * 0.82, halfWidth)
  g.quadraticCurveTo(cx + ca * r1 * 0.98, cy + sa * r1 * 0.98, dx, dy)
  const [ex, ey] = px(r0, halfWidth); g.lineTo(ex, ey)
  g.quadraticCurveTo(cx + ca * r0 * 0.88, cy + sa * r0 * 0.88, ax, ay)
  g.closePath(); g.fill()
}

/** A cusped rule — the Plate's frame, at card scale. */
function cuspedFrame(g, x, y, w, h, cusp) {
  g.beginPath()
  g.moveTo(x + cusp, y)
  g.lineTo(x + w - cusp, y); g.quadraticCurveTo(x + w, y, x + w, y + cusp)
  g.lineTo(x + w, y + h - cusp); g.quadraticCurveTo(x + w, y + h, x + w - cusp, y + h)
  g.lineTo(x + cusp, y + h); g.quadraticCurveTo(x, y + h, x, y + h - cusp)
  g.lineTo(x, y + cusp); g.quadraticCurveTo(x, y, x + cusp, y)
  g.closePath(); g.stroke()
}

/** Fine ruled ground. The Plate never leaves bare metal; a card never leaves bare stock. */
function diaper(g, w, h, step, colour) {
  g.save(); g.strokeStyle = colour; g.lineWidth = 1
  for (let i = -h; i < w + h; i += step) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke()
    g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke()
  }
  g.restore()
}

/**
 * A card face, in the Unit's own hand.
 *
 * Cream stock, a diapered ground, a double cusped rule, a roundel of tracery, a
 * Roman numeral and a caption — the Sun and the Moon, which are the two things
 * this whole object is about.
 */
function cardTexture(kind, seed) {
  const W = 320, H = 528
  const [c, g] = canvas(W, H)
  const INK = '#2E271E', RED = '#8A3A22', GILT = '#9A7B3E'

  g.fillStyle = '#CCC0A2'; g.fillRect(0, 0, W, H)
  const rnd = rng(seed)
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(120,104,78,${rnd() * .13})`
    g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 4, 1 + rnd() * 2)
  }
  diaper(g, W, H, 26, 'rgba(120,104,78,.10)')

  g.strokeStyle = INK; g.lineWidth = 7; cuspedFrame(g, 17, 17, W - 34, H - 34, 22)
  g.lineWidth = 2; cuspedFrame(g, 31, 31, W - 62, H - 62, 16)
  g.strokeStyle = GILT; g.lineWidth = 1.4; cuspedFrame(g, 38, 38, W - 76, H - 76, 13)

  const CX = W / 2, CY = 236, R = 92

  /* the roundel it all sits in */
  g.strokeStyle = INK; g.lineWidth = 3
  g.beginPath(); g.arc(CX, CY, R + 20, 0, 6.2832); g.stroke()
  g.strokeStyle = GILT; g.lineWidth = 1.4
  g.beginPath(); g.arc(CX, CY, R + 27, 0, 6.2832); g.stroke()

  if (kind === 'sun') {
    /* eight lancets driving outward, quatrefoils riding between them */
    g.fillStyle = RED
    for (let i = 0; i < 8; i++) lancet(g, CX, CY, (i / 8) * 6.2832 - Math.PI / 2, R * .46, R, .13)
    g.fillStyle = INK
    for (let i = 0; i < 8; i++) {
      const a = ((i + .5) / 8) * 6.2832 - Math.PI / 2
      quatrefoil(g, CX + Math.cos(a) * R * .74, CY + Math.sin(a) * R * .74, 11, a)
    }
    g.fillStyle = RED
    g.beginPath(); g.arc(CX, CY, R * .30, 0, 6.2832); g.fill()
    g.fillStyle = '#CCC0A2'
    g.beginPath(); g.arc(CX, CY, R * .15, 0, 6.2832); g.fill()
  } else {
    /* a crescent cut the way the Plate cuts its own, in a field of eyes */
    g.fillStyle = INK
    g.beginPath()
    g.arc(CX + 8, CY, R * .78, 0, 6.2832)
    g.arc(CX + 36, CY - 20, R * .66, 0, 6.2832, true)
    g.fill('evenodd')
    g.fillStyle = GILT
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.2832 + .4
      const rr = R * (i % 2 ? 1.02 : .92)
      g.beginPath(); g.arc(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, i % 3 ? 3.4 : 5.2, 0, 6.2832); g.fill()
    }
    g.fillStyle = RED
    quatrefoil(g, CX, CY + R + 46, 13, Math.PI / 4)
  }

  /* numeral and caption — the two cards the whole Vigil turns on */
  g.fillStyle = INK
  g.textAlign = 'center'
  g.font = '600 30px Georgia, "Times New Roman", serif'
  g.fillText(kind === 'sun' ? 'XIX' : 'XVIII', CX, 92)
  g.font = '600 25px Georgia, "Times New Roman", serif'
  g.fillText(kind === 'sun' ? 'THE SUN' : 'THE MOON', CX, H - 74)
  g.strokeStyle = GILT; g.lineWidth = 1.6
  g.beginPath(); g.moveTo(CX - 62, H - 62); g.lineTo(CX + 62, H - 62); g.stroke()

  return tex(c)
}

/** The grimoire's board: dark leather, blind-tooled rules, a gilt star. */
function coverTexture() {
  const [c, g] = canvas(384, 512)
  g.fillStyle = '#1B1613'; g.fillRect(0, 0, 384, 512)
  const rnd = rng(4711)
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = `rgba(${44 + rnd() * 30},${36 + rnd() * 24},${30 + rnd() * 20},${rnd() * .55})`
    g.fillRect(rnd() * 384, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 2)
  }
  g.strokeStyle = 'rgba(176,141,74,.62)'
  g.lineWidth = 3.4; cuspedFrame(g, 26, 26, 332, 460, 20)
  g.lineWidth = 1.4; cuspedFrame(g, 40, 40, 304, 432, 14)
  g.fillStyle = 'rgba(198,166,96,.92)'
  g.beginPath()
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2
    const rr = k % 2 ? 30 : 78
    const x = 192 + Math.cos(a) * rr, y = 236 + Math.sin(a) * rr
    k ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.closePath(); g.fill()
  g.strokeStyle = 'rgba(198,166,96,.7)'; g.lineWidth = 2
  g.beginPath(); g.arc(192, 236, 104, 0, 6.2832); g.stroke()
  g.fillStyle = 'rgba(198,166,96,.55)'
  for (const [x, y] of [[74, 108], [310, 108], [74, 364], [310, 364]]) quatrefoil(g, x, y, 15)
  return tex(c)
}

/** Page edges: a stack of leaves, not a solid block of cream. */
function edgeTexture() {
  const [c, g] = canvas(256, 64)
  g.fillStyle = '#B6A886'; g.fillRect(0, 0, 256, 64)
  const rnd = rng(2027)
  for (let y = 0; y < 64; y += 1.5) {
    g.strokeStyle = `rgba(96,84,62,${.18 + rnd() * .3})`
    g.lineWidth = .8
    g.beginPath(); g.moveTo(0, y + rnd() * .6); g.lineTo(256, y + rnd() * .6); g.stroke()
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1)
  return t
}

/** A slack lead, as a tube along a curve. */
function cable(from, to, seed) {
  const rnd = rng(seed)
  const pts = []
  for (let i = 0; i <= 18; i++) {
    const t = i / 18
    const swing = Math.sin(t * Math.PI) * 1.25
    pts.push(new THREE.Vector3(
      from.x + (to.x - from.x) * t + Math.sin(t * 6.1 + rnd() * .15) * .13,
      from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * .035,
      from.z + (to.z - from.z) * t + swing * (1 - t * .5),
    ))
  }
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 52, .038, 8, false), MAT.leather)
}

/**
 * Headphones, lying flat.
 *
 * The first pass stood the cups on edge — cylinders turned a quarter about z, so
 * their radius ran in y — and parked them at y=.30 with a radius of .46. That put
 * their lowest point at **-0.16**, sixteen hundredths *below* the table top, which
 * is why they read as a dark blob half-sunk into the wood.
 *
 * Dropped headphones do not stand on edge. They lie with the cups' flat faces on
 * the desk and the band curving away across it, which is also what the reference
 * shows — so the cup axis is vertical, every part sits at a positive y, and
 * nothing has to intersect anything to stay put.
 */
function headphones() {
  const g = new THREE.Group()
  const SPAN = .76
  for (const sx of [-1, 1]) {
    const cup = new THREE.Group()
    cup.position.set(sx * SPAN, 0, 0)
    g.add(cup)
    /* shell, very slightly conical, sitting on its own pad */
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(.40, .365, .24, 28, 1, false), MAT.cupShell)
    shell.position.y = .19; cup.add(shell)
    /* the chamfer that catches the candle — free, and it is what says "object" */
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(.415, .40, .032, 28), MAT.darkTrim)
    lip.position.y = .312; cup.add(lip)
    /* the top is the cup's own shell, with one thin brass ring for the light to
       find — that ring is the whole highlight, and it is 2mm wide on purpose */
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .020, 26), MAT.cupShell)
    plate.position.y = .330; cup.add(plate)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.20, .012, 8, 24), MAT.brass)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = .341; cup.add(ring)
    /* the ear pad it rests on */
    const pad = new THREE.Mesh(new THREE.TorusGeometry(.295, .080, 10, 26), MAT.pad)
    pad.rotation.x = -Math.PI / 2
    pad.position.y = .075; cup.add(pad)
    /* the yoke, up the outside of the shell */
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(.375, .026, 8, 20, Math.PI * .8), MAT.darkTrim)
    yoke.rotation.set(0, sx > 0 ? 0 : Math.PI, Math.PI / 2)
    yoke.position.y = .21; cup.add(yoke)
  }
  /* the band, lying over across the desk rather than standing up */
  const band = new THREE.Mesh(new THREE.TorusGeometry(SPAN, .052, 10, 32, Math.PI), MAT.leather)
  band.rotation.x = -Math.PI / 2
  band.position.y = .40
  g.add(band)
  const padTop = new THREE.Mesh(new THREE.TorusGeometry(SPAN, .078, 10, 20, Math.PI * .5), MAT.pad)
  padTop.rotation.set(-Math.PI / 2, 0, Math.PI * .25)
  padTop.position.y = .40
  g.add(padTop)
  return g
}

/**
 * Lay the Altar.
 *
 * `altar`'s local origin sits at the middle of the table top, so everything is
 * placed at y ≈ 0 and rises. Positions are grouped along the front strip (z 2.2 to
 * 3.6), clear of the Unit at z ±1.7 and of the two front candlesticks at x ±3.42.
 */
export function createAltarProps(altar) {
  const group = new THREE.Group()
  group.scale.setScalar(0.86)
  altar.add(group)

  /* ---- the grimoire, closed, front-left ---- */
  const book = new THREE.Group()
  book.position.set(-4.55, 0, 2.62)
  book.rotation.y = -0.17
  group.add(book)
  const BW = 2.05, BD = 1.52, BH = 0.30
  /* the leaves, inset so the boards overhang them the way real boards do */
  const edgeMat = new THREE.MeshStandardMaterial({ map: edgeTexture(), roughness: .95, metalness: 0 })
  const block = new THREE.Mesh(new THREE.BoxGeometry(BW - .10, BH * .62, BD - .10), edgeMat)
  block.position.y = BH * .5; book.add(block)
  for (const [y, h] of [[BH - .028, .056], [.028, .056]]) {
    const brd = new THREE.Mesh(new THREE.BoxGeometry(BW, h, BD), MAT.boardDark)
    brd.position.y = y; book.add(brd)
  }
  const spine = new THREE.Mesh(new THREE.BoxGeometry(.13, BH, BD), MAT.boardEdge)
  spine.position.set(-BW / 2 + .05, BH * .5, 0); book.add(spine)
  /* raised bands across the spine — the one detail that reads "bound", not "box" */
  for (const z of [-.44, -.15, .15, .44]) {
    const bandM = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .15, 8), MAT.boardDark)
    bandM.rotation.z = Math.PI / 2
    bandM.position.set(-BW / 2 + .05, BH * .5, z); book.add(bandM)
  }
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(BW * .96, BD * .96),
    new THREE.MeshStandardMaterial({ map: coverTexture(), roughness: .72, metalness: .06 }))
  cover.rotation.x = -Math.PI / 2
  cover.position.y = BH + .003; book.add(cover)
  /* a ribbon marker, escaping the leaves */
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(.11, .95), MAT.ribbon)
  ribbon.rotation.set(-Math.PI / 2, 0, .22)
  ribbon.position.set(.42, .062, BD / 2 + .34); book.add(ribbon)

  /* ---- the pen, dropped across the corner of the book ---- */
  const pen = new THREE.Group()
  pen.position.set(-2.92, .052, 3.12)
  pen.rotation.set(0, 0.30, Math.PI / 2)
  group.add(pen)
  pen.add(new THREE.Mesh(new THREE.CylinderGeometry(.049, .043, 1.30, 14), MAT.gilt))
  const nib = new THREE.Mesh(new THREE.ConeGeometry(.049, .26, 14), MAT.brass)
  nib.position.y = -.74; pen.add(nib)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .30, 14), MAT.brass)
  cap.position.y = .52; pen.add(cap)
  const clip = new THREE.Mesh(new THREE.BoxGeometry(.018, .26, .05), MAT.brass)
  clip.position.set(0, .50, .056); pen.add(clip)

  /* ---- two cards, face up, one lapping the other ---- */
  const cardGeom = new THREE.BoxGeometry(.98, .014, 1.62)
  ;[[0, { x: -1.42, z: 3.10, rot: -.26, kind: 'sun' }],
    [1, { x: -0.44, z: 3.24, rot: .13, kind: 'moon' }]].forEach(([i, spec]) => {
    const face = new THREE.MeshStandardMaterial({
      map: cardTexture(spec.kind, 9001 + i * 37), roughness: .92, metalness: 0 })
    /* box materials run +x,-x,+y,-y,+z,-z — only the up face carries the print */
    const card = new THREE.Mesh(cardGeom, [MAT.paper, MAT.paper, face, MAT.paper, MAT.paper, MAT.paper])
    card.position.set(spec.x, .007 + i * .015, spec.z)
    card.rotation.y = spec.rot
    group.add(card)
  })

  /* ---- the wand: lapis shaft, copper ferrules ---- */
  const wand = new THREE.Group()
  wand.position.set(1.18, .062, 3.34)
  wand.rotation.set(0, -0.48, Math.PI / 2)
  group.add(wand)
  wand.add(new THREE.Mesh(new THREE.CylinderGeometry(.060, .046, 1.95, 14), MAT.lapis))
  for (const y of [-.90, .10, .92]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.069, .069, .11, 14), MAT.copper)
    ring.position.y = y; wand.add(ring)
  }
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.075, 14, 10), MAT.copper)
  tip.position.y = 1.0; wand.add(tip)

  /* ---- headphones, and the lead running to the port ---- */
  const cans = headphones()
  cans.position.set(4.85, 0, 2.45)
  cans.rotation.y = -0.72
  group.add(cans)

  const PORT = new THREE.Vector3(3.05, 0, 3.42)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.25, .05, 10, 26), MAT.brass)
  collar.rotation.x = -Math.PI / 2
  collar.position.set(PORT.x, .014, PORT.z); group.add(collar)
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.23, 26),
    new THREE.MeshStandardMaterial({ color: 0x07080A, roughness: .96, metalness: 0 }))
  hole.rotation.x = -Math.PI / 2
  hole.position.set(PORT.x, .010, PORT.z); group.add(hole)
  group.add(cable(new THREE.Vector3(4.35, .16, 2.75), PORT, 3311))

  return { group }
}

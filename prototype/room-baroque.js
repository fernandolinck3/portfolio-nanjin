import * as THREE from 'three'

/**
 * The baroque fittings of the room — cornice, ceiling rose, chandelier, sconces,
 * mirror, drapery, a bust and the books.
 *
 * Why a separate file: `scene.js` is five thousand lines and the Unit is what it is
 * about. These are furnishings, they are read once and adjusted by eye, and none of
 * them is referenced by anything else.
 *
 * **Two rules run through every piece here, and they are both measured.**
 *
 * *Geometry is free; light is not.* ADR-0019 priced fifteen lights at 87% of the
 * frame and 150 draw calls at nothing an M1 notices. So this file adds a chandelier
 * with sixteen flames, six sconces, a cornice and a bust — and **not one light**.
 * Everything that glows is emissive geometry, which is the rule
 * `docs/realism-budget.md` already states and the same answer the basement's bunker
 * scene arrives at: six meshes with a material called LIGHT and no point lights at all.
 *
 * *The register is an old baroque mansion.* Not a chapel, not a console. So the
 * vocabulary is turning, gilding, moulding and drapery — the four things a
 * nineteenth-century room is actually made of — and each is a shape a lathe or an
 * extrusion can describe, which is why none of it needs a modelling package.
 *
 * The flames are returned rather than kept, so `scene.js` can walk them down with the
 * Vigil: the room goes out with the Candles or it is not the same room.
 */

/** A turned profile, in the lathe's own coordinates: [radius, height] pairs. */
const lathe = (profile, seg = 24) =>
  new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg)

/** A rounded rectangle as a Shape, for frames and panels. */
function roundedShape(w, d, r) {
  const s = new THREE.Shape()
  const hw = w / 2, hd = d / 2
  s.moveTo(-hw + r, -hd)
  s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r)
  s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd)
  s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r)
  s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd)
  return s
}

/**
 * A moulding: a small profile swept along a straight run.
 *
 * The profile is drawn in cross-section — this is how a cornice, a plinth and a
 * chair rail are all the same object with different curves, which is also true of
 * the real thing.
 */
function moulding(profile, length, mat, flip = false) {
  const s = new THREE.Shape()
  const f = flip ? -1 : 1
  s.moveTo(profile[0][0] * f, profile[0][1])
  for (const [x, y] of profile.slice(1)) s.lineTo(x * f, y)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false })
  g.computeVertexNormals()
  return new THREE.Mesh(g, mat)
}

/**
 * A flame: two crossed billboard-ish planes with an emissive material.
 *
 * Not a light, and the room has sixteen of them. A candle at this distance is a
 * bright point and a halo; the shape of the flame is below the resolution the eye
 * gets from across a room, which is the same argument `docs/realism-budget.md` makes
 * for the Altar's own Candles at the shipped framing.
 */
function flame(mat, scale = 1) {
  const g = new THREE.Group()
  for (const rot of [0, Math.PI / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.07 * scale, .17 * scale), mat)
    p.rotation.y = rot
    p.position.y = .085 * scale
    g.add(p)
  }
  return g
}

export function createBaroque(room, {
  floorY, ceilY, sideX, wallZ, depth,
  gilt, wood,
  layout = 'cheio',
} = {}) {
  const group = new THREE.Group()
  room.add(group)
  const flames = []

  /* ---------- materials ---------- */

  const GILT = gilt || new THREE.MeshStandardMaterial({
    color: 0xC9A03C, metalness: 1, roughness: .28,
  })
  /* Darker gilt for the parts that are in shadow by design — a room where every gilt
     surface is the same brightness reads as plastic, because real gilding is a
     thousand small facets and half of them are always turned away. */
  const GILT_DARK = new THREE.MeshStandardMaterial({
    color: 0x8A6C2A, metalness: 1, roughness: .46,
  })
  /* Aged plaster, not fresh, and now aged twice. `0xBFB2A0` was the brightest thing in
     a dark room and pulled the eye off the Unit; `0x8B8175` still was, once the walls
     and the floor came down to the value the reference interiors actually hold. Cornice
     and rose run the whole perimeter, so they are a large area pretending to be a
     detail — a century of candle smoke, and then another. */
  const PLASTER = new THREE.MeshStandardMaterial({
    color: 0x4F4840, roughness: .95, metalness: 0,
  })
  /* Bronze, for the bust: a pale bust is a chess piece, and this room has enough
     light-coloured mass in it already. */
  const BRONZE = new THREE.MeshStandardMaterial({
    color: 0x4A3B28, metalness: .85, roughness: .52,
  })
  const WOOD = wood || new THREE.MeshStandardMaterial({
    color: 0x4A3A2E, roughness: .5, metalness: 0,
  })
  const WAX = new THREE.MeshStandardMaterial({
    color: 0xEFE6D2, roughness: .62, metalness: 0,
  })
  /* The flame's own colour, carried on `emissive` so it survives the room going out.
     `emissiveIntensity` is what the Vigil walks down. */
  const FLAME = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0xFFC66B, emissiveIntensity: 3.2,
    transparent: true, opacity: .92, depthWrite: false, side: THREE.DoubleSide,
  })
  /* A mirror without a reflection: dark glass that takes the environment map and
     almost nothing else. A real reflection needs a second render of the whole scene,
     which is the one thing this room cannot buy. */
  const GLASS = new THREE.MeshStandardMaterial({
    color: 0x1A1D22, metalness: .9, roughness: .12,
  })

  /* ---------- the cornice, where wall meets ceiling ---------- */

  /**
   * The single cheapest thing that stops a room being a box.
   *
   * A bare junction of wall and ceiling is what a cardboard model has. A cornice is
   * four straight runs of one profile, it costs four draw calls, and it is the first
   * thing the eye uses to date a room.
   */
  const corniceProfile = [
    [0, 0], [.42, 0], [.42, .10], [.26, .17], [.30, .27], [.16, .34], [.18, .46], [0, .52],
  ]
  /**
   * The three runs, and the rotation is the whole difficulty.
   *
   * `moulding` extrudes along **+z** with the profile standing in XY, so the default
   * orientation is already right for the left wall: profile pointing into the room,
   * length running away from the far wall. The other two are that shape turned.
   *
   * The back wall is the awkward one. Turning +90° about Y sends the extrusion along
   * +x, which is the run wanted — but it also sends the profile to -z, which is *into
   * the wall*, where a cornice is a cornice nobody can see. Hence `flip`: the profile
   * is mirrored in its own plane so that after the turn it points back into the room.
   * The first version had all three rotations wrong and laid a plaster beam diagonally
   * across the middle of the floor.
   */
  const corniceRuns = [
    { len: depth,      rot: 0,           flip: false, pos: [-sideX + .02, ceilY - .52, wallZ] },
    { len: depth,      rot: Math.PI,     flip: false, pos: [sideX - .02, ceilY - .52, wallZ + depth] },
    { len: sideX * 2,  rot: Math.PI / 2, flip: true,  pos: [-sideX, ceilY - .52, wallZ + .02] },
  ]
  for (const r of corniceRuns) {
    const m = moulding(corniceProfile, r.len, PLASTER, r.flip)
    m.rotation.y = r.rot
    m.position.set(...r.pos)
    group.add(m)
  }

  /* ---------- the ceiling rose ---------- */

  /* Smaller twice now, and the second cut was measured against the wrong thing. The
     first pass judged it in elevation — at 2.55 across it read as a white plate hanging
     in the air, so the steps went in and the radius came down a third. But this camera
     looks *down*, and from up there the rose sits between the lens and the chandelier:
     at 1.30 it was a lid, and the sixteen candles and eight gilt arms underneath it were
     a rumour. So the radius is set by the thing it hangs, not by its own proportions —
     0.72 clears the inner tier's reach of 1.05 with room to spare, which is also what a
     real medallion does: it is the collar the chain comes out of, never the crown. */
  const rose = new THREE.Mesh(lathe([
    [0, 0], [.22, 0], [.25, .04], [.40, .06], [.43, .10], [.58, .13],
    [.64, .18], [.67, .24], [.70, .27], [.72, .31], [0, .31],
  ], 48), PLASTER)
  rose.position.set(0, ceilY - .50, wallZ + depth * .52)
  group.add(rose)

  /* ---------- the chandelier ---------- */

  /**
   * Sixteen candles and no lights, hung from the rose.
   *
   * The stem is turned, the arms are quarter-circles swept as tubes, and each arm
   * ends in a cup with a candle in it. It is the object that says *mansion* louder
   * than anything else in the room, and on the frame budget it is a rounding error:
   * two dozen small meshes against a hundred and fifty draw calls that measure as free.
   */
  const chandelier = new THREE.Group()
  chandelier.position.set(0, ceilY - .5, wallZ + depth * .52)
  group.add(chandelier)

  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(.035, .035, 1.5, 6), GILT_DARK)
  chain.position.y = -.75
  chandelier.add(chain)

  const stem = new THREE.Mesh(lathe([
    [0, 0], [.22, 0], [.30, .10], [.20, .26], [.16, .48], [.34, .62], [.42, .78],
    [.30, .96], [.22, 1.20], [.34, 1.34], [.30, 1.46], [.16, 1.56], [.10, 1.80], [0, 1.86],
  ], 32), GILT)
  stem.position.y = -2.4
  chandelier.add(stem)

  const ARMS = 8
  for (let tier = 0; tier < 2; tier++) {
    const reach = tier === 0 ? 1.55 : 1.05
    const y0 = tier === 0 ? -1.55 : -1.05
    for (let i = 0; i < ARMS; i++) {
      const a = (i / ARMS) * Math.PI * 2 + (tier ? Math.PI / ARMS : 0)
      /* the arm: out, up, and a curl — a quadratic bezier read as a tube */
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, y0, 0),
        new THREE.Vector3(Math.cos(a) * reach * .75, y0 - .34, Math.sin(a) * reach * .75),
        new THREE.Vector3(Math.cos(a) * reach, y0 + .30, Math.sin(a) * reach))
      const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .045, 6, false), GILT)
      chandelier.add(arm)

      const cup = new THREE.Mesh(lathe([
        [0, 0], [.10, 0], [.16, .07], [.09, .10], [.075, .26], [0, .26],
      ], 16), GILT)
      cup.position.set(Math.cos(a) * reach, y0 + .30, Math.sin(a) * reach)
      chandelier.add(cup)

      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(.05, .055, .34, 8), WAX)
      candle.position.set(Math.cos(a) * reach, y0 + .49, Math.sin(a) * reach)
      chandelier.add(candle)

      const f = flame(FLAME, .9)
      f.position.set(Math.cos(a) * reach, y0 + .66, Math.sin(a) * reach)
      chandelier.add(f)
      flames.push(f)
    }
  }

  /* the chandelier is architecture, not furniture: it stays in every layout, because
     a room without a ceiling fitting is a room nobody finished */
  /* a drop at the bottom, because a chandelier that ends in a stump reads as broken */
  const drop = new THREE.Mesh(lathe([
    [0, 0], [.10, .10], [.16, .26], [.10, .40], [0, .48],
  ], 24), GILT)
  drop.position.y = -2.55
  chandelier.add(drop)

  /* ---------- wall sconces ---------- */

  /**
   * Three a side, at the height a person's eye finds them.
   *
   * Same vocabulary as the chandelier, one tier and two candles, so the room reads as
   * *fitted* rather than as a collection of separate objects. Repetition is what a
   * period interior is made of.
   */
  /**
   * Three a side in `cheio`, one in `sobrio`, none in `vazio`.
   *
   * The layouts are not a light switch on the same room: they are three answers to
   * *how much furniture does this object want around it*, and that is a question only
   * Fernando can settle by looking. `cheio` is a lived room; `sobrio` keeps the
   * architecture and drops the objects; `vazio` is the shell, for judging the Unit
   * against nothing.
   */
  const sconceZ = layout === 'cheio' ? [depth * .28, depth * .52, depth * .76]
    : layout === 'sobrio' ? [depth * .52]
      : []
  for (const sx of [-1, 1]) {
    for (const sz of sconceZ) {
      const s = new THREE.Group()
      s.position.set(sx * (sideX - .34), floorY + 4.1, wallZ + sz)
      s.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2
      group.add(s)

      const back = new THREE.Mesh(lathe([
        [0, 0], [.26, 0], [.30, .08], [.20, .16], [.10, .30], [0, .34],
      ], 20), GILT_DARK)
      back.rotation.x = Math.PI / 2
      s.add(back)

      for (const side of [-1, 1]) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0, .1),
          new THREE.Vector3(side * .34, -.16, .42),
          new THREE.Vector3(side * .46, .22, .52))
        s.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .035, 6, false), GILT))

        const cup = new THREE.Mesh(lathe([
          [0, 0], [.09, 0], [.14, .06], [.08, .09], [.065, .22], [0, .22],
        ], 14), GILT)
        cup.position.set(side * .46, .22, .52)
        s.add(cup)

        const c = new THREE.Mesh(new THREE.CylinderGeometry(.042, .046, .28, 8), WAX)
        c.position.set(side * .46, .38, .52)
        s.add(c)

        const f = flame(FLAME, .8)
        f.position.set(side * .46, .52, .52)
        s.add(f)
        flames.push(f)
      }
    }
  }

  /* ---------- the mirror ---------- */

  /**
   * A tall gilt mirror on the left wall, with dark glass instead of a reflection.
   *
   * A real mirror is a second render of the whole scene from a second camera, which
   * is the one expense this room genuinely cannot carry. Dark glass with a low
   * roughness takes the environment map and the chandelier's emissive, which at this
   * distance is what a mirror in a dim room actually shows.
   */
  if (layout !== 'vazio') {
    const mirror = new THREE.Group()
    mirror.position.set(-sideX + .38, floorY + 3.6, wallZ + depth * .42)
    mirror.rotation.y = Math.PI / 2
    group.add(mirror)

    const frame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(
        (() => {
          const s = roundedShape(2.9, 5.0, .5)
          s.holes.push(new THREE.Path(roundedShape(2.45, 4.55, .42).getPoints(40)))
          return s
        })(),
        { depth: .22, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2 }),
      GILT)
    mirror.add(frame)

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 4.55), GLASS)
    glass.position.z = .04
    mirror.add(glass)

    /* a crest over the frame, which is the detail that dates it */
    const crest = new THREE.Mesh(lathe([
      [0, 0], [.42, .04], [.30, .16], [.46, .26], [.22, .40], [.10, .54], [0, .58],
    ], 20), GILT)
    crest.position.set(0, 2.6, .10)
    mirror.add(crest)
  }

  /* ---------- drapery at the window ---------- */

  /**
   * Two heavy drapes and a pelmet, folded by arithmetic.
   *
   * A curtain is a plane with a sine across it: fold count and depth are the whole
   * model, and the cloth reads because the folds catch light at different angles, not
   * because the silhouette is accurate.
   */
  /**
   * The weave is measured; the colour is not.
   *
   * A photograph of grey upholstery would fight the red the room already has, so only
   * the **structure** maps are borrowed — normal and roughness — and the deep red
   * stays authored. That split is worth naming, because it is the general answer for
   * every surface in here that has to be a particular colour: a photograph is very
   * good at *how a material behaves* and has no opinion worth taking about *what
   * colour this object is in this room*.
   *
   * 256px, 65 KB the pair. A fabric normal is high-frequency and JPEG hates it — at
   * 512 the two came to 355 KB for a curtain that hangs at the back of a dark room.
   */
  const VELVET = new THREE.MeshStandardMaterial({
    color: 0x5A1E1C, roughness: .96, metalness: 0, side: THREE.DoubleSide,
  })
  {
    const load = new THREE.TextureLoader()
    const base = (import.meta.env?.BASE_URL || '/') + 'textures/'
    const weave = t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(3, 9)
      return t
    }
    Promise.all([
      load.loadAsync(base + 'veludo-nor.jpg').then(weave),
      load.loadAsync(base + 'veludo-rug.jpg').then(weave),
    ]).then(([nor, rug]) => {
      VELVET.normalMap = nor
      VELVET.normalScale.set(.6, .6)
      VELVET.roughnessMap = rug
      VELVET.needsUpdate = true
    }).catch(() => { /* the drapes were already cloth; they simply stay flat */ })
  }
  function drape(w, h, folds, deep) {
    const g = new THREE.PlaneGeometry(w, h, folds * 6, 8)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i)
      /* the fold opens toward the floor, the way weight makes it */
      const open = .55 + .45 * (1 - (y + h / 2) / h)
      p.setZ(i, Math.sin((x / w) * Math.PI * 2 * folds) * deep * open)
    }
    g.computeVertexNormals()
    return new THREE.Mesh(g, VELVET)
  }
  for (const sx of (layout === 'vazio' ? [] : [-1, 1])) {
    const d = drape(1.5, 5.4, 4, .16)
    d.position.set(sx * 3.05, floorY + 3.1, wallZ + .5)
    group.add(d)
  }
  /**
   * The pelmet, and the first one read as a circus awning.
   *
   * Nine folds across seven units puts a crease every eighty centimetres, and with the
   * window bright behind it the light caught alternate faces and turned the whole
   * thing into red and white stripes. A valance is heavy cloth gathered *few times and
   * deeply*, not pleated often and shallowly — the fold count is the difference
   * between a curtain and a beach umbrella.
   */
  /**
   * There is no pelmet, and that is the second answer rather than a missing piece.
   *
   * Two versions were built and both failed the same way: a gathered cloth strip hung
   * across the top of the window sits **against the brightest thing in the room**, so
   * its folds alternate lit and unlit and the whole valance reads as a striped awning.
   * Fewer, deeper folds made the stripes wider and no less striped.
   *
   * The window is the room's one hero — it carries the sun, the moon and the shaft.
   * Anything that competes with it loses on purpose. The two side drapes frame it
   * without crossing it, which is what they are for.
   */

  /* ---------- paintings ---------- */

  /**
   * Four dark canvases in gilt frames, and the canvases are deliberately unreadable.
   *
   * A painting on a wall in a dim room is a warm rectangle with a shape in it, and any
   * attempt at a *subject* generated by arithmetic lands somewhere between wallpaper
   * and uncanny. What carries it is the frame — which is turning and gilding, the two
   * things this file is already good at — and a canvas dark enough that the eye
   * supplies the rest.
   *
   * Lyra's portrait is the exception and stays where it is: she is a fixture with a
   * name plate, not decoration, and `portrait.js` treats her that way.
   */
  function painting(w, h, seed) {
    const g = new THREE.Group()
    const frame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(
        (() => {
          const sh = roundedShape(w, h, .10)
          sh.holes.push(new THREE.Path(roundedShape(w - .46, h - .46, .07).getPoints(24)))
          return sh
        })(),
        { depth: .16, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2 }),
      GILT_DARK)
    g.add(frame)
    /* the canvas: an old varnish gradient, drawn once, no file */
    const c = document.createElement('canvas'); c.width = c.height = 128
    const x = c.getContext('2d')
    const rnd = (n => () => (n = (n * 1664525 + 1013904223) >>> 0) / 4294967296)(seed)
    const gr = x.createRadialGradient(64, 52, 8, 64, 64, 92)
    gr.addColorStop(0, '#5A4426'); gr.addColorStop(.55, '#2E2417'); gr.addColorStop(1, '#14100B')
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 90; i++) {
      x.fillStyle = `rgba(${120 + rnd() * 90 | 0},${90 + rnd() * 70 | 0},${50 + rnd() * 50 | 0},${.05 + rnd() * .12})`
      x.beginPath(); x.ellipse(rnd() * 128, rnd() * 128, 3 + rnd() * 14, 2 + rnd() * 9, rnd() * 3, 0, 6.283); x.fill()
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - .46, h - .46),
      new THREE.MeshStandardMaterial({ map: t, roughness: .82, metalness: 0 }))
    canvasMesh.position.z = .05
    g.add(canvasMesh)
    return g
  }

  if (layout !== 'vazio') {
    const walls = layout === 'cheio' ? [
      { sx: -1, z: depth * .66, w: 2.2, h: 2.8, y: 3.4, seed: 7 },
      { sx: -1, z: depth * .82, w: 1.7, h: 2.1, y: 3.1, seed: 19 },
      { sx: 1, z: depth * .40, w: 2.5, h: 3.2, y: 3.5, seed: 33 },
      { sx: 1, z: depth * .64, w: 1.8, h: 2.3, y: 3.2, seed: 51 },
    ] : [
      { sx: 1, z: depth * .40, w: 2.5, h: 3.2, y: 3.5, seed: 33 },
    ]
    for (const p of walls) {
      const art = painting(p.w, p.h, p.seed)
      art.position.set(p.sx * (sideX - .30), floorY + p.y, wallZ + p.z)
      art.rotation.y = p.sx > 0 ? -Math.PI / 2 : Math.PI / 2
      group.add(art)
    }
  }

  /* ---------- a cartel clock ---------- */

  /**
   * On the back wall, beside the window. A clock is the one object in a room that
   * says a *time* rather than a period, and the hands are set once and never move:
   * a running clock in a scene where the light is a rite would be two clocks
   * disagreeing.
   */
  if (layout === 'cheio') {
    const clock = new THREE.Group()
    clock.position.set(sideX - 4.6, floorY + 5.0, wallZ + .55)
    group.add(clock)

    const caseG = new THREE.Mesh(lathe([
      [0, 0], [.86, 0], [.94, .10], [.86, .18], [.70, .22], [.72, .30], [0, .30],
    ], 32), GILT)
    caseG.rotation.x = Math.PI / 2
    clock.add(caseG)

    const dial = new THREE.Mesh(new THREE.CircleGeometry(.68, 32),
      new THREE.MeshStandardMaterial({ color: 0xE8E0CC, roughness: .7 }))
    dial.position.z = .24
    clock.add(dial)

    for (const [len, wide, ang] of [[.42, .035, -0.9], [.58, .022, 2.1]]) {
      const hand = new THREE.Mesh(new THREE.BoxGeometry(wide, len, .012),
        new THREE.MeshStandardMaterial({ color: 0x1A1712, roughness: .5 }))
      hand.position.set(Math.sin(ang) * len / 2, Math.cos(ang) * len / 2, .26)
      hand.rotation.z = -ang
      clock.add(hand)
    }
    /* the crest, same gesture as the mirror's — repetition is what makes a set */
    const crown = new THREE.Mesh(lathe([
      [0, 0], [.34, .04], [.24, .14], [.36, .22], [.16, .34], [0, .40],
    ], 18), GILT)
    crown.position.set(0, .92, .10)
    clock.add(crown)
  }

  /* ---------- a bust on a pedestal ---------- */

  if (layout === 'cheio') {
    const ped = new THREE.Mesh(lathe([
      [0, 0], [.62, 0], [.66, .12], [.50, .22], [.44, 2.1], [.54, 2.24],
      [.62, 2.34], [.60, 2.44], [0, 2.44],
    ], 28), PLASTER)
    ped.position.set(sideX - 1.5, floorY, wallZ + depth * .22)
    group.add(ped)

    /* O busto saiu daqui.

       Ele era um torneado, e o comentario que o acompanhava dizia por que: uma cara
       reconhecivel modelada por aritmetica fica estranha, entao a forma era abstrata
       de proposito e o que se lia era "um vulto de ombro e cabeca". Isso e uma
       descricao honesta de uma peca que nao chegou aonde queria — o mesmo diagnostico
       do ADR-0029 sobre o sofa, no lugar onde ele doi.

       Agora e `marble_bust_01` da Poly Haven, montado por `room-mobilia.js` com o
       topo deste pedestal (`floorY + 2,44`) como plano de apoio. O pedestal fica: um
       torneado de gesso e exatamente o tipo de coisa que se escreve bem. */
  }

  /* ---------- the fireplace ---------- */

  /**
   * A chimneypiece on the right wall, with a fire that is emissive and not a light.
   *
   * It earns its place three times over. It is the object a nineteenth-century room is
   * *organised around*, so having one settles what the rest of the furniture is doing.
   * It puts a warm source **low and to one side**, which is the one direction this
   * scene has never been lit from — everything else comes from above or from the
   * window. And it gives the Vigil something to do besides subtract: a fire does not
   * blow out like a candle, it sinks to embers, so it is the slowest thing in the room
   * to go and the last colour left before the moon.
   *
   * The surround is a lathe-turned jamb repeated twice under a mantel shelf, which is
   * how a real one is built and why it costs three meshes.
   */
  const fireGlow = new THREE.MeshStandardMaterial({
    color: 0x1A0A04, emissive: 0xFF7A22, emissiveIntensity: 2.4,
    roughness: 1, metalness: 0,
  })
  if (layout !== 'vazio') {
    const fp = new THREE.Group()
    fp.position.set(sideX - .18, floorY, wallZ + depth * .50)
    fp.rotation.y = -Math.PI / 2
    group.add(fp)

    const MARBLE = new THREE.MeshStandardMaterial({
      color: 0x6E6258, roughness: .38, metalness: 0,
    })
    /* jambs */
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(lathe([
        [0, 0], [.42, 0], [.46, .10], [.34, .22], [.30, 3.0], [.40, 3.16],
        [.44, 3.30], [0, 3.30],
      ], 20), MARBLE)
      jamb.position.set(side * 1.75, 0, .30)
      fp.add(jamb)
    }
    /* the lintel and the mantel shelf over it */
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.1, .62, .74), MARBLE)
    lintel.position.set(0, 3.6, .30)
    fp.add(lintel)
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.7, .22, 1.0), MARBLE)
    shelf.position.set(0, 4.0, .34)
    fp.add(shelf)

    /* the opening: a dark recess, so the fire has somewhere to be */
    const recess = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.3, .7),
      new THREE.MeshStandardMaterial({ color: 0x14100C, roughness: 1 }))
    recess.position.set(0, 1.65, -.05)
    fp.add(recess)

    /* the fire: three low emissive lumps and two flames, because a fire seen from
       across a room is a glow with movement in it and nothing more */
    for (let i = 0; i < 3; i++) {
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(.34 - i * .06, 10, 8), fireGlow)
      ember.position.set((i - 1) * .62, .30, .18)
      ember.scale.y = .58
      fp.add(ember)
    }
    for (const fx of [-.42, .38]) {
      const f = flame(FLAME, 1.9)
      f.position.set(fx, .48, .18)
      fp.add(f)
      flames.push(f)
    }

    /* the overmantel: a framed canvas, so the wall above the fire is not a blank */
    const over = painting(3.0, 3.4, 91)
    over.position.set(0, 6.0, .18)
    fp.add(over)
  }

  /* ---------- the door ---------- */

  /**
   * A panelled door on the left wall — a room with no way out is a set.
   *
   * Closed, and closed on purpose: an open door needs somewhere to lead, and the one
   * thing worse than no exit is an exit onto nothing. Six raised panels, a gilt
   * architrave, and a handle. It is furniture-grade joinery described by two boxes and
   * a moulding run, which is the whole argument of this file.
   */
  if (layout !== 'vazio') {
    const door = new THREE.Group()
    door.position.set(-sideX + .16, floorY, wallZ + depth * .78)
    door.rotation.y = Math.PI / 2
    group.add(door)

    const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 6.6, .18), WOOD)
    leaf.position.set(0, 3.3, 0)
    door.add(leaf)

    for (let r = 0; r < 3; r++) {
      for (const c of [-1, 1]) {
        const panel = new THREE.Mesh(
          new THREE.ExtrudeGeometry(roundedShape(1.3, 1.7, .10),
            { depth: .06, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 }),
          GILT_DARK)
        panel.position.set(c * .78, 1.15 + r * 2.05, .11)
        door.add(panel)
      }
    }
    const knob = new THREE.Mesh(lathe([
      [0, 0], [.10, 0], [.16, .07], [.13, .16], [.05, .20], [0, .20],
    ], 14), GILT)
    knob.rotation.x = -Math.PI / 2
    knob.position.set(1.35, 3.1, .16)
    door.add(knob)

    /* the architrave, the same profile family as the cornice */
    const arch = moulding(
      [[0, 0], [.26, 0], [.26, .12], [.14, .18], [.16, .30], [0, .34]], 7.0, PLASTER)
    arch.rotation.z = -Math.PI / 2
    arch.rotation.y = Math.PI / 2
    arch.position.set(-2.0, 0, .10)
    door.add(arch)
  }

  /* ---------- books, because a room needs something that was used ---------- */

  if (layout === 'cheio') {
    const SPINES = [0x4A2320, 0x2C3A2E, 0x3A2E44, 0x53401F, 0x24303E]
    const stack = new THREE.Group()
    stack.position.set(-sideX + 1.9, floorY, wallZ + depth * .70)
    group.add(stack)
    let y = 0
    for (let i = 0; i < 7; i++) {
      const w = .9 + (i % 3) * .12, d = 1.3 + (i % 2) * .1, h = .16 + (i % 4) * .03
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: SPINES[i % SPINES.length], roughness: .88 }))
      b.position.set((i % 2 ? .05 : -.04), y + h / 2, (i % 3 ? .03 : -.05))
      b.rotation.y = ((i * 37) % 11 - 5) * .012
      stack.add(b)
      y += h
    }
  }

  /* ---------- the chair: it left, and it left the file ----------
     A table with no chair is a display case, and that argument still holds — what
     changed is who builds the chair. This one was a lathe for the legs, an extruded
     rounded rectangle for the seat, velvet where a body touches it and gilt on the
     crest, and from the resting camera it read as a chair. From closer it read as
     four boxes agreeing to be one. `room-mobilia.js` puts a modelled chair on the
     same spot, turned the same eight degrees, for the reason written down there:
     the Unit is the craft proof, the seating is not, and hand-building the seating
     was buying the wrong thing with the session. See `docs/adr/0029`. */

  return { group, flames, materials: { FLAME, GILT: GILT_DARK, PLASTER, VELVET, fireGlow } }
}

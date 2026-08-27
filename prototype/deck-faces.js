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

/**
 * The wheel read outward, in fractions of R.
 *
 * Fernando's reference builds each Deck as three concentric jobs, not one: a
 * **reeded rim** you could grip, a **medallion band** that says which wheel this
 * is, and only then the **tracery field**. The old face had just the field — it
 * ran the rose out to 0.92 and finished it with three lines and a course of beads,
 * which is why it read as a printed disc rather than as a turned object.
 *
 * The field therefore gets *smaller*, not larger. That is the counter-intuitive
 * part and it is the whole gain: a rose window surrounded by a wide dark annulus
 * reads as set into something, and the two bands outside it are what give the
 * wheel an edge to be turned by.
 */
const FIELD = 0.62                 // the tracery ends here
const BAND = [0.705, 0.872]        // medallions ride this annulus
const REED = [0.900, 0.996]        // the milled edge

/**
 * The rose is authored to fill a 0.94 disc, so it is scaled into the field rather
 * than re-numbered. Every radius in `sunBars`/`moonBars` stays the fraction the
 * mason wrote; only the frame around them changed.
 */
const FIT = FIELD / 0.94

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
 * A symmetric cusped leaf — the shape the rose is actually built from.
 *
 * `petal()` above is kept because the Moon still wants it, but it cannot draw
 * this: its flanks are offset by a fraction of the half-width that grows with
 * radius, which shears the shape. As a *void* that sheared into something that
 * read as tracery. As a **bar** — which is what the stone is now — eight of them
 * around a hub read as a turbine, because every blade leans the same way.
 *
 * So this one is mirrored about its own axis by construction. The width follows a
 * sine so it is nothing at the base, widest around a third of the way out and
 * nothing again at the tip, and `cusps` bites small notches into each flank, which
 * is the detail that separates tracery from a petal shape cut out of paper.
 *
 * Drawn as a polyline. At 1024px a 24-segment flank is smoother than the curve
 * primitives were, and it is the only way to keep both sides provably identical.
 */
function leaf(g, cx, cy, a, r0, r1, halfW, cusps = 2) {
  const P = (r, o) => [cx + Math.cos(a + o) * r, cy + Math.sin(a + o) * r]
  const span = r1 - r0
  const N = 24
  /* half-width at t, with the cusp notches bitten out of the flank */
  /* `min(t, .9)` is what blunts the head. Run the sine all the way to t=1 and the
     width goes to zero, which gives a needle; holding it at .9 leaves the tip a
     fifth of the petal's width and the closing segment reads as a cusped head. */
  const w = t => halfW * Math.sin(Math.PI * Math.pow(Math.min(t, 0.9), 0.72)) *
    (1 - 0.20 * Math.pow(Math.sin(Math.PI * t * cusps), 2))
  g.beginPath()
  g.moveTo(...P(r0, 0))
  for (let i = 1; i <= N; i++) g.lineTo(...P(r0 + span * (i / N), w(i / N)))
  for (let i = N; i >= 1; i--) g.lineTo(...P(r0 + span * (i / N), -w(i / N)))
  g.closePath(); g.fill()
}

/**
 * The Sun, as stone: a rose window, everything driving outward from one roundel.
 *
 * Eight petals, not sixteen. The Deck draws under 200px on the Plate and the
 * handoff records the last attempt as "too fine at ~190px" — a rose window that
 * reads at that size has to be built from a few large voids, the way the top-left
 * window in the reference is, not from a lot of small ones.
 *
 * A central eye, eight cusped petals off it, and a course of small eyes riding the
 * spandrels between their heads.
 */
function sunBars(g) {
  /**
   * Eight broad petals and eight narrow lances between them.
   *
   * Both numbers come off the reference, and the alternation is the point: the
   * broad petals carry the shape and the lances fill the spandrels, so the stone
   * meets itself all the way round and the glass is left as thin wedges rather
   * than as open ground. Petals of one width, spaced apart, read as a daisy; a
   * rose window is stone that has been *pierced*, and it has to look as if it
   * barely got away with it.
   *
   * The lances reach further out than the petals — to the field edge, where the
   * petals stop short of it — which is what gives the rim its scalloped course
   * instead of a flat ring of heads.
   */
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.2832 - Math.PI / 2
    leaf(g, C, C, a, R * 0.24, R * 0.92, 0.235, 2)
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * 6.2832 - Math.PI / 2
    leaf(g, C, C, a, R * 0.20, R * 0.96, 0.075, 1)
  }
}

/**
 * The Moon: a triskelion, which is the one place the two wheels stop rhyming.
 *
 * The Sun is a rose window and the Moon used to be a smaller rose window with six
 * lobes instead of eight — the same mason, plainly, but also the same *drawing*,
 * and at 190px on the Plate the pair read as one wheel duplicated. Fernando's
 * reference resolves it by giving the Moon a different figure entirely: three
 * interlocking crescents around a node, no radial symmetry at all.
 *
 * It is drawn as **bands, not as a field with holes in it**. Taking three discs
 * out of a solid disc gives the right silhouette and the wrong material: the wheel
 * comes out as a pale clover, where the reference is dark with bone linework laid
 * over it. Three heavy hoops and an outer course leave the glass as the ground and
 * the stone as the drawing, which is the way round the Sun already works.
 */
function moonBars(g) {
  const TAU = 6.2832
  g.strokeStyle = g.fillStyle
  const hoop = (cx, cy, r, w) => {
    g.lineWidth = R * w
    g.beginPath(); g.arc(cx, cy, R * r, 0, TAU); g.stroke()
  }
  /* the outer course */
  hoop(C, C, 0.905, 0.055)
  /**
   * Three hoops, and they must overlap.
   *
   * Adjacent centres are `0.44 * sqrt(3)` = 0.762 apart, so a radius under 0.381
   * leaves them separate and the figure falls apart into three rings sitting near
   * each other. At 0.40 they cut through one another, and the crossings are the
   * whole reason a triskelion reads as *interlocking* rather than as a clover.
   */
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2
    hoop(C + Math.cos(a) * R * 0.44, C + Math.sin(a) * R * 0.44, 0.40, 0.07)
  }
  /* the node the three arms meet at, under the bead */
  g.beginPath(); g.arc(C, C, R * 0.17, 0, TAU); g.fill()
}

/* ---------- the furniture around the field ---------- */

/** A ring line, struck at a fraction of R. */
function ring(g, k, w, style) {
  g.strokeStyle = style; g.lineWidth = R * w
  g.beginPath(); g.arc(C, C, R * k, 0, 6.2832); g.stroke()
}

/**
 * The milled edge — a coin's reeding, not a moulding.
 *
 * This is the single detail that does most of the work in the reference, and it is
 * the cheapest thing here: a hundred and forty radial teeth around the rim. It
 * reads as *machined* rather than drawn, and it is the only part of the wheel that
 * says the thing is meant to be gripped and turned.
 */
function reeding(g, lo, hi, teeth = 184) {
  g.fillStyle = lo
  g.beginPath()
  g.arc(C, C, R * REED[1], 0, 6.2832)
  g.arc(C, C, R * REED[0], 6.2832, 0, true)
  g.fill()
  g.fillStyle = hi
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * 6.2832, a1 = a0 + (0.52 / teeth) * 6.2832
    g.beginPath()
    g.arc(C, C, R * REED[1], a0, a1)
    g.arc(C, C, R * REED[0], a1, a0, true)
    g.closePath(); g.fill()
  }
}

/** A four-pointed star with concave flanks — the Sun's marker on the band. */
function star4(g, cx, cy, r, rot = 0) {
  const P = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]
  g.beginPath()
  g.moveTo(...P(rot, r))
  for (let i = 0; i < 4; i++) {
    const a = rot + i * Math.PI / 2
    g.quadraticCurveTo(...P(a + Math.PI / 4, r * 0.20), ...P(a + Math.PI / 2, r))
  }
  g.closePath(); g.fill()
}

/**
 * One moon phase, as a disc that is part bone and part shadow.
 *
 * `p` runs 0 (new) → 0.5 (full) → 1 (new). The lit side is a half-disc with an
 * ellipse either added or removed at the terminator: at the quarters the ellipse
 * has no width and the disc is exactly half; past them it widens and its fill
 * flips, which is what turns a crescent into a gibbous without a second path.
 */
function phaseDisc(g, cx, cy, r, p, bone, dark) {
  g.save()
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip()
  g.fillStyle = bone; g.fillRect(cx - r, cy - r, r * 2, r * 2)
  const k = Math.cos(p * 6.2832)          // +1 new, -1 full, 0 at the quarters
  g.fillStyle = dark
  g.beginPath()
  /* the unlit half: left while waxing, right while waning */
  if (p < 0.5) g.rect(cx - r, cy - r, r, r * 2)
  else g.rect(cx, cy - r, r, r * 2)
  g.fill()
  g.beginPath()
  g.ellipse(cx, cy, r * Math.abs(k), r, 0, 0, 6.2832)
  g.fillStyle = k > 0 ? dark : bone
  g.fill()
  g.restore()
}

/**
 * Everything outside the tracery, struck onto one map.
 *
 * Same shape as the old `moulding`: the caller supplies the inks, so colour and
 * relief are drawn by the *same* code and a bead can never sit on one and not the
 * other. `dots` is optional — only the emissive map wants the amber course lit.
 */
function furniture(g, kind, P) {
  reeding(g, P.reedLo, P.reedHi)
  /* the band's dark ground */
  if (P.band) {
    g.fillStyle = P.band
    g.beginPath()
    g.arc(C, C, R * BAND[1], 0, 6.2832)
    g.arc(C, C, R * BAND[0], 6.2832, 0, true)
    g.fill()
  }
  /* the lines that separate the three jobs */
  if (P.line) {
    ring(g, REED[0], 0.008, P.line)
    ring(g, BAND[1], 0.010, P.line)
    ring(g, BAND[0], 0.010, P.line)
    ring(g, FIELD + 0.022, 0.007, P.line)
  }
  /* the fine dotted course, just inside the band */
  if (P.dot) {
    g.fillStyle = P.dot
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * 6.2832
      g.beginPath()
      g.arc(C + Math.cos(a) * R * 0.673, C + Math.sin(a) * R * 0.673, R * 0.0085, 0, 6.2832)
      g.fill()
    }
  }
  /* the medallions: the Sun counts in stars, the Moon counts in phases */
  const rb = R * (BAND[0] + BAND[1]) / 2
  if (P.medal) {
    if (kind === 'sun') {
      g.fillStyle = P.medal
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.2832 - Math.PI / 2
        star4(g, C + Math.cos(a) * rb, C + Math.sin(a) * rb, R * 0.052, a)
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.2832 - Math.PI / 2
        phaseDisc(g, C + Math.cos(a) * rb, C + Math.sin(a) * rb, R * 0.044,
          i / 12, P.medal, P.medalDark || P.band || '#000')
      }
    }
  }
}

/**
 * The boss at the hub — amber cabochon on the Sun, obsidian bead on the Moon.
 *
 * Both wheels end in a domed stone in the reference, and they are deliberately
 * opposite: the Sun's is lit from inside and the Moon's only catches the room. It
 * is the smallest element on the wheel and the one that makes it read as an object
 * rather than a pattern, because it is the only part with a specular highlight.
 */
function boss(g, kind, P) {
  const r = R * 0.115
  if (P.socket) {
    g.fillStyle = P.socket
    g.beginPath(); g.arc(C, C, r * 1.42, 0, 6.2832); g.fill()
  }
  if (P.ringInk) ring(g, 0.152, 0.014, P.ringInk)
  if (!P.stone) return
  const grd = g.createRadialGradient(C - r * 0.34, C - r * 0.38, r * 0.06, C, C, r)
  grd.addColorStop(0, P.stone[0])
  grd.addColorStop(0.55, P.stone[1])
  grd.addColorStop(1, P.stone[2])
  g.fillStyle = grd
  g.beginPath(); g.arc(C, C, r, 0, 6.2832); g.fill()
  if (P.spec) {
    g.fillStyle = P.spec
    g.beginPath()
    g.ellipse(C - r * 0.34, C - r * 0.40, r * 0.30, r * 0.20, -0.7, 0, 6.2832)
    g.fill()
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
  /**
   * The polarity, which was backwards.
   *
   * `sunBars` and `moonBars` draw the rose as a set of *shapes*, and the old code
   * took those shapes to be the holes — so the wheel came out as a pale disc with
   * petal-shaped bites out of it. The reference is the other way round and it is
   * the way a rose window actually works: the petals are the **stone**, and the
   * light comes through everything around them.
   *
   * So the mask is the field with the tracery knocked out of it. Nothing else in
   * the file changes: the bars are still stone, the voids still burn, and the three
   * maps still come off one drawing.
   */
  const bars = document.createElement('canvas'); bars.width = bars.height = SIZE
  const bg = bars.getContext('2d')
  bg.fillStyle = '#fff'
  bg.save()
  bg.translate(C, C); bg.scale(FIT, FIT); bg.translate(-C, -C)
  if (kind === 'sun') sunBars(bg)
  else moonBars(bg)
  bg.restore()

  g.beginPath(); g.arc(C, C, R * FIELD, 0, 6.2832); g.fill()
  g.globalCompositeOperation = 'destination-out'
  g.drawImage(bars, 0, 0)
  /* the hub is stone too — it is where the boss is seated */
  g.beginPath(); g.arc(C, C, R * 0.163, 0, 6.2832); g.fill()
  g.globalCompositeOperation = 'source-over'
  return c
}

/**
 * Colour, relief and emission for one Deck.
 *
 * `emissive` is the mask blurred a little: light spilling past the edge of a hole
 * is what makes it read as light coming *through* rather than as a hole painted a
 * bright colour.
 *
 * The palette moved to the reference and the change is mostly one decision: **both
 * wheels are bone.** The Moon used to be cool grey (`#BFC2C8`) on the reasoning
 * that a moon is cold, and next to the Sun it read as a different material — two
 * wheels from two machines. In the reference they are cut from the same stone and
 * the Moon is told apart by having *no light behind it*, not by being blue. Bone
 * for both; the Sun burns amber through its glass and the Moon stays dark.
 *
 * That also frees the void colour to do real work. The Sun's holes are deep amber
 * rather than near-black, so they read as lit glass even at low Vigil instead of
 * only existing once the emissive comes up.
 */
export function deckMaps(kind) {
  const mask = voidMask(kind)
  const sun = kind === 'sun'
  const stone = '#D6C6AA'

  /* ---- albedo ---- */
  const A = document.createElement('canvas'); A.width = A.height = SIZE
  const a = A.getContext('2d')
  /* the ground the whole wheel sits on — dark bronze, so the bands read as
     annuli cut into a black disc rather than as rings drawn on a pale one */
  a.fillStyle = '#171310'; a.fillRect(0, 0, SIZE, SIZE)
  a.fillStyle = stone
  a.beginPath(); a.arc(C, C, R * (FIELD + 0.02), 0, 6.2832); a.fill()
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
  /* the voids themselves — amber glass on the Sun, a cold hole on the Moon */
  a.save()
  a.globalCompositeOperation = 'source-over'
  const dark = document.createElement('canvas'); dark.width = dark.height = SIZE
  const dg = dark.getContext('2d')
  dg.drawImage(mask, 0, 0)
  dg.globalCompositeOperation = 'source-in'
  if (sun) {
    /* hotter toward the hub, the way backlit glass actually falls off */
    const gl = dg.createRadialGradient(C, C, R * 0.05, C, C, R * FIELD)
    gl.addColorStop(0, '#8A4A0C'); gl.addColorStop(0.55, '#5E2F08'); gl.addColorStop(1, '#331803')
    dg.fillStyle = gl
  } else dg.fillStyle = '#0A0B10'
  dg.fillRect(0, 0, SIZE, SIZE)
  a.drawImage(dark, 0, 0)
  a.restore()
  furniture(a, kind, {
    reedLo: '#0D0B09', reedHi: '#3A2E20',
    band: '#141110', line: 'rgba(196,166,116,.55)',
    dot: sun ? 'rgba(214,138,44,.75)' : 'rgba(190,172,140,.5)',
    medal: '#CDBB9C', medalDark: '#15120F',
  })
  boss(a, kind, {
    socket: '#0E0B09', ringInk: 'rgba(196,166,116,.5)',
    stone: sun ? ['#FFB74A', '#B45C10', '#3A1A04'] : ['#4A4A50', '#17171C', '#050508'],
    spec: 'rgba(255,244,224,.55)',
  })

  /* ---- relief: stone high, voids cut away ---- */
  const H = document.createElement('canvas'); H.width = H.height = SIZE
  const h = H.getContext('2d')
  h.fillStyle = '#6E6E6E'; h.fillRect(0, 0, SIZE, SIZE)
  h.fillStyle = '#b4b4b4'
  h.beginPath(); h.arc(C, C, R * (FIELD + 0.02), 0, 6.2832); h.fill()
  const cut = document.createElement('canvas'); cut.width = cut.height = SIZE
  const cg = cut.getContext('2d')
  cg.drawImage(mask, 0, 0)
  cg.globalCompositeOperation = 'source-in'
  cg.fillStyle = '#0a0a0a'; cg.fillRect(0, 0, SIZE, SIZE)
  h.drawImage(cut, 0, 0)
  /* the same furniture, in height: teeth stand, the band sinks, medallions stand */
  furniture(h, kind, {
    reedLo: '#585858', reedHi: '#C6C6C6',
    band: '#4E4E4E', line: '#E4E4E4',
    dot: '#D0D0D0', medal: '#F4F4F4', medalDark: '#3A3A3A',
  })
  boss(h, kind, { socket: '#2E2E2E', ringInk: '#DADADA', stone: ['#FFFFFF', '#D8D8D8', '#8C8C8C'] })

  /* ---- emission: the holes, the amber course, and the Sun's own stone ---- */
  const E = document.createElement('canvas'); E.width = E.height = SIZE
  const e = E.getContext('2d')
  e.fillStyle = '#000'; e.fillRect(0, 0, SIZE, SIZE)
  e.save(); e.filter = 'blur(7px)'; e.globalAlpha = 0.5
  e.drawImage(mask, 0, 0); e.restore()
  e.drawImage(mask, 0, 0)
  /* only the Sun's furniture is lit — the Moon's band is stone that catches the
     room, which is the whole difference between the two wheels */
  if (sun) {
    furniture(e, kind, { reedLo: '#000', reedHi: '#000', band: '#000', dot: '#C87A18' })
    boss(e, kind, { socket: '#000', stone: ['#FFC96A', '#C2660F', '#4A2205'] })
  } else {
    boss(e, kind, { socket: '#000', stone: ['#000', '#000', '#000'] })
  }

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

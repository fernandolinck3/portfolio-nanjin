/**
 * Marquetry — the gilt inlay on the Altar's top, drawn rather than modelled.
 *
 * The reference Fernando gave is a Napoleon III table, and the thing that makes it
 * that table is not its wood: it is **the ornament cut into the wood**. A central
 * cartouche, scrollwork running out of it, corner sprays, and a fine band following
 * the edge — all in brass, all worn.
 *
 * So this is not a model and not a photograph. It is the same move the Plate already
 * makes and that `CONTEXT.md` calls the **Print**: a graphic layer over a material.
 * The wood carries grain and roughness; this carries the drawing.
 *
 * **Why drawn and not a texture off the internet.** Every marquetry photograph is a
 * photograph of *someone's table*, with that table's proportions, its perspective and
 * its copyright. This top is 14.6 by 8.6 with bowed sides; ornament that does not
 * follow the outline reads as a decal, which is exactly what a stock texture would
 * be. Drawing it means the cartouche sits where the Screen is, the scrolls run along
 * the bow, and the border follows the shaped edge.
 *
 * **The vocabulary is four marks**, and every baroque surface in the world is made of
 * them: the *scroll* (a spiral that thins), the *leaf* (two arcs meeting at a point),
 * the *bellflower* (a hanging chain of them) and the *band* (a line that follows an
 * edge). Everything below composes those four, mirrored — and mirroring is what makes
 * ornament read as designed instead of as noise. It is the same reason `leaf()` in
 * `deck-faces.js` is mirrored by construction and `petal()` was not, which is a bug
 * that file paid for.
 */

/* ---------- the four marks ---------- */

/**
 * A scroll: a spiral whose stroke thins as it curls.
 *
 * Drawn as a series of short segments rather than one path, because a stroke of
 * constant width is a wire and a stroke that tapers is a carving.
 */
function scroll(g, x, y, r, turns, a0, dir, w0) {
  const steps = Math.max(24, Math.floor(turns * 40))
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps
    const rr0 = r * (1 - t0 * .82), rr1 = r * (1 - t1 * .82)
    const a = a0 + dir * t0 * turns * Math.PI * 2
    const b = a0 + dir * t1 * turns * Math.PI * 2
    g.lineWidth = Math.max(.6, w0 * (1 - t0 * .75))
    g.beginPath()
    g.moveTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0)
    g.lineTo(x + Math.cos(b) * rr1, y + Math.sin(b) * rr1)
    g.stroke()
  }
}

/** A leaf: two arcs meeting at a point, filled. The unit of every acanthus there is. */
function leaf(g, x, y, len, wide, ang) {
  g.save(); g.translate(x, y); g.rotate(ang)
  g.beginPath()
  g.moveTo(0, 0)
  g.quadraticCurveTo(len * .35, -wide, len, 0)
  g.quadraticCurveTo(len * .35, wide, 0, 0)
  g.closePath(); g.fill()
  g.restore()
}

/** A bellflower chain: the hanging ornament that fills a vertical run. */
function bellflowers(g, x, y0, y1, n, size) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1 || 1)
    const y = y0 + (y1 - y0) * t
    const s = size * (1 - t * .45)
    g.beginPath()
    g.moveTo(x - s, y)
    g.quadraticCurveTo(x, y + s * 1.7, x + s, y)
    g.quadraticCurveTo(x, y + s * .5, x - s, y)
    g.fill()
    g.beginPath(); g.arc(x, y - s * .5, s * .28, 0, 6.2832); g.fill()
  }
}

/* ---------- the composition ---------- */

/**
 * Draw the whole top, in the table's own proportions.
 *
 * `w` and `d` are world units; the canvas is sized from them so the ornament has the
 * same density everywhere regardless of what resolution it is asked for.
 *
 * `keepOut` is the Screen's footprint and the Unit's — the one place ornament must not
 * go, because the instrument sits there and marquetry under a machine is marquetry
 * nobody sees and a busy background for the thing that matters. A real table has a
 * plain centre for exactly the same reason: things get put on it.
 */
export function marquetryTexture(THREE, {
  w = 14.6, d = 8.6, px = 128, bow = .42,
  keepOut = { w: 7.4, d: 4.2 },
} = {}) {
  const W = Math.round(w * px), H = Math.round(d * px)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')

  /* transparent: this layer is only the brass */
  g.clearRect(0, 0, W, H)

  const GOLD = '#C9A24A'
  const GOLD_DIM = '#8E7331'
  const cx = W / 2, cy = H / 2
  const u = px                       /* one world unit, in pixels */

  g.lineCap = 'round'
  g.lineJoin = 'round'

  /* ---- the band that follows the edge ---- */

  /**
   * Two lines and a bead, inset from the edge and bowed with it.
   *
   * The outline is the same arithmetic `shapedTop()` uses, so the band and the bronze
   * rim agree. They have to: a border that cuts a corner the table does not cut is the
   * single most obvious way to make ornament look printed on.
   */
  function outline(inset, k = 1) {
    const hw = W / 2 - inset, hd = H / 2 - inset
    const r = 2.6 * u * k, b = bow * u * k
    g.beginPath()
    g.moveTo(cx - hw + r, cy - hd)
    g.quadraticCurveTo(cx, cy - hd - b, cx + hw - r, cy - hd)
    g.quadraticCurveTo(cx + hw, cy - hd, cx + hw, cy - hd + r)
    g.quadraticCurveTo(cx + hw + b * 1.35, cy, cx + hw, cy + hd - r)
    g.quadraticCurveTo(cx + hw, cy + hd, cx + hw - r, cy + hd)
    g.quadraticCurveTo(cx, cy + hd + b, cx - hw + r, cy + hd)
    g.quadraticCurveTo(cx - hw, cy + hd, cx - hw, cy + hd - r)
    g.quadraticCurveTo(cx - hw - b * 1.35, cy, cx - hw, cy - hd + r)
    g.quadraticCurveTo(cx - hw, cy - hd, cx - hw + r, cy - hd)
    g.closePath()
  }
  g.strokeStyle = GOLD
  g.lineWidth = .085 * u; outline(.30 * u); g.stroke()
  g.lineWidth = .028 * u; outline(.52 * u); g.stroke()
  g.strokeStyle = GOLD_DIM
  g.lineWidth = .020 * u; outline(.70 * u); g.stroke()

  /* ---- the central cartouche ---- */

  /**
   * An oval frame around the plain centre, with leaves breaking out of it at the four
   * cardinals. It **surrounds** the keep-out rather than filling it: the Unit stands
   * inside this, and the frame is what says the middle of the table was left plain on
   * purpose rather than forgotten.
   */
  const kw = keepOut.w * u / 2 + .55 * u
  const kh = keepOut.d * u / 2 + .55 * u
  g.strokeStyle = GOLD
  g.lineWidth = .055 * u
  g.beginPath(); g.ellipse(cx, cy, kw, kh, 0, 0, 6.2832); g.stroke()
  g.lineWidth = .018 * u
  g.beginPath(); g.ellipse(cx, cy, kw + .16 * u, kh + .16 * u, 0, 0, 6.2832); g.stroke()

  g.fillStyle = GOLD
  for (const [ax, ay, ang] of [
    [cx, cy - kh, -Math.PI / 2], [cx, cy + kh, Math.PI / 2],
    [cx - kw, cy, Math.PI], [cx + kw, cy, 0],
  ]) {
    leaf(g, ax, ay, .70 * u, .22 * u, ang)
    leaf(g, ax, ay, .44 * u, .14 * u, ang + .55)
    leaf(g, ax, ay, .44 * u, .14 * u, ang - .55)
    /* scrolls breaking out of the frame, which is what stops a cartouche being an
       oval: the ornament has to look like it grew through the line, not around it */
    g.strokeStyle = GOLD
    scroll(g, ax + Math.cos(ang) * .55 * u, ay + Math.sin(ang) * .55 * u,
      .40 * u, .85, ang + 1.2, 1, .042 * u)
    scroll(g, ax + Math.cos(ang) * .55 * u, ay + Math.sin(ang) * .55 * u,
      .40 * u, .85, ang - 1.2, -1, .042 * u)
    g.fillStyle = GOLD
  }

  /* ---- the four corner sprays, mirrored ---- */

  /**
   * One spray, drawn once, stamped four times through a mirror transform.
   *
   * Mirroring is not a shortcut here, it is the grammar: a hand-cut marquetry panel is
   * cut in a stack and opened out, so its corners are *exactly* each other reversed.
   * Ornament that is merely similar in the four corners reads as sloppy in a way that
   * is hard to name and impossible to miss.
   */
  function spray() {
    /* The first version had three scrolls and three leaves and read as *scattered*
       rather than as ornament. Density is not decoration here: baroque marquetry works
       because the eye cannot find where one motif ends, and a sparse version of it
       just looks like a sparse version of it. Nine scrolls, eight leaves, two chains —
       and every one of them still costs a canvas stroke, drawn once at load. */
    g.strokeStyle = GOLD
    scroll(g, -2.15 * u, -1.30 * u, 1.05 * u, 1.25, 2.5, 1, .085 * u)
    scroll(g, -1.05 * u, -1.72 * u, .62 * u, 1.05, 0.4, -1, .058 * u)
    scroll(g, -2.95 * u, -0.60 * u, .55 * u, .95, 1.6, -1, .052 * u)
    scroll(g, -1.62 * u, -0.72 * u, .48 * u, .90, 3.6, 1, .046 * u)
    scroll(g, -3.55 * u, -1.30 * u, .62 * u, 1.05, 2.1, 1, .050 * u)
    scroll(g, -0.55 * u, -2.05 * u, .40 * u, .80, 5.1, -1, .040 * u)
    g.strokeStyle = GOLD_DIM
    scroll(g, -2.55 * u, -1.95 * u, .44 * u, .85, 4.2, 1, .036 * u)
    scroll(g, -4.20 * u, -0.70 * u, .38 * u, .75, 0.9, -1, .032 * u)
    scroll(g, -1.20 * u, -1.05 * u, .30 * u, .70, 2.8, 1, .028 * u)

    g.fillStyle = GOLD
    leaf(g, -2.15 * u, -1.30 * u, 1.00 * u, .28 * u, -0.55)
    leaf(g, -1.70 * u, -1.62 * u, .64 * u, .18 * u, -1.15)
    leaf(g, -2.72 * u, -0.92 * u, .70 * u, .20 * u, 2.35)
    leaf(g, -3.30 * u, -1.55 * u, .58 * u, .17 * u, 0.35)
    leaf(g, -1.15 * u, -1.30 * u, .52 * u, .15 * u, -2.25)
    g.fillStyle = GOLD_DIM
    leaf(g, -2.30 * u, -2.05 * u, .46 * u, .13 * u, 1.05)
    leaf(g, -3.95 * u, -1.05 * u, .44 * u, .12 * u, -0.25)
    leaf(g, -0.80 * u, -1.80 * u, .40 * u, .11 * u, 2.85)

    bellflowers(g, -3.30 * u, -0.30 * u, 0.95 * u, 5, .10 * u)
    bellflowers(g, -4.55 * u, -0.15 * u, 0.60 * u, 3, .075 * u)
  }
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.save()
    g.translate(cx + sx * (W / 2 - .30 * u) - sx * (W / 2 - .30 * u), cy)
    g.translate(sx * (W / 2 - .30 * u), sy * (H / 2 - .30 * u))
    g.scale(sx, sy)
    spray()
    g.restore()
  }

  /* ---- wear ---- */

  /**
   * A century of elbows, and it is what stops this reading as a print.
   *
   * Brass inlay wears where hands go: the edge nearest the chair, the corners, the
   * places a sleeve sweeps. `destination-out` erases rather than paints, so the wear
   * removes gilt instead of covering it — which is the difference between worn brass
   * and brass with dirt on it.
   */
  g.globalCompositeOperation = 'destination-out'
  let seed = 20260903 >>> 0
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W, y = rnd() * H
    /* wear concentrates toward the long edges, where a person sits */
    const edge = 1 - Math.abs(y - cy) / (H / 2)
    if (rnd() < edge * .72) continue
    g.globalAlpha = .06 + rnd() * .3
    g.beginPath()
    g.ellipse(x, y, 1 + rnd() * 9, 1 + rnd() * 5, rnd() * 3, 0, 6.2832)
    g.fill()
  }
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

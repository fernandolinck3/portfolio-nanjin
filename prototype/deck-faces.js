import * as THREE from 'three'

/**
 * The Deck faces — **Fernando's own artwork**, cropped out of `cross and jogs.png`
 * and mapped onto the platters.
 *
 * This file used to draw both wheels procedurally: a reeded rim, a medallion band,
 * a rose window of cusped petals for the Sun and a trefoil of pierced tracery for
 * the Moon, all struck onto one void mask that three maps came off. It was several
 * hundred lines and it is gone, because it was answering the wrong question.
 *
 * The reference is not a *description* of an ornament — it is the ornament. Every
 * pass at reproducing it in circle arithmetic got a three-fold figure that was
 * plainly in the same family and just as plainly not the same drawing; each pass
 * was closer in some measurable way and no closer at all in the way that counts.
 * Fernando, after four of them: *"its not similar to the design i gave to you at
 * all."* Right about the method, not the numbers. Following a reference this
 * specific means **using** it.
 *
 * So there is one image per wheel and the other two maps are derived from it.
 *
 * ## Where the maps come from
 *
 * - **albedo** — the crop, untouched.
 * - **height** — its luminance. Bone is the brightest thing in the picture and the
 *   ground the darkest, so luminance already *is* the relief: it drives `bumpMap`,
 *   and the candles rake across the carving because of it.
 * - **emissive** — its **saturation × value**, which is the one that needed
 *   thought. The Sun's glass is deeply saturated amber and its stone is near-grey
 *   bone, so saturation separates *lit glass* from *lit stone* in a way brightness
 *   cannot: the palest pixel on the wheel is bone, which must not glow, and the
 *   amber behind the tracery must, even where it is darker than the bone beside it.
 *   The Moon has almost no saturated pixel anywhere, which is correct, and is the
 *   difference between the two wheels — the Moon is told apart by having no light
 *   behind it, not by being a different colour.
 *
 * ## The crop
 *
 * Each is square and centred on its wheel, with the half-size set to the rim
 * radius, so the image's **inscribed circle is exactly the platter**. The plate is
 * a `CylinderGeometry` cap, whose UVs inscribe the disc in the 0..1 square, so a
 * crop with margin renders the wheel undersized inside a ring of stray Plate
 * ornament, and a tight crop shaves the reeding.
 *
 * **The centre has to be found, not eyeballed.** The first cut was placed by eye
 * and the Moon's was 20px out — 8% of the radius — which is invisible in a still
 * and unmistakable the moment the platter turns: *"the arts are not centered on the
 * circle of the jogs, causing them do wobble."* Reading the edge off a screenshot
 * cannot do better than that, and edge-detection is worse — it locks onto the
 * Plate's own ornament outside the wheel.
 *
 * What works is to minimise the thing being complained about. Every ring on a wheel
 * — the reeding, the rules either side of the medallion band, the dotted course,
 * the field edge — is rotationally symmetric about the true centre, so about that
 * point the picture barely changes when you spin it, and about any other point the
 * rings sweep across each other. Searching for the centre that minimises mean
 * |I(p) − I(rot(p))| lands on it directly. Both wheels then measure r = 253, the
 * same to the pixel, which is the check: they are the same object drawn twice, and
 * any fit that returns two different radii has found something else.
 *
 * Source centres: Moon (348, 421), Sun (1420, 422), both r 253, in
 * `cross and jogs.png` at its native 1774x887.
 */

/**
 * Deck art is served from `public/`, so it has to resolve through `BASE_URL` — the
 * same trap the Works hit. A root-absolute `/decks/sun.png` works from a domain
 * root and 404s from a subdirectory, which is a bug that exists only in a deployed
 * build and never in the dev server.
 */
const url = name => `${import.meta.env?.BASE_URL ?? '/'}decks/${name}.png`.replace(/([^:])\/\//g, '$1/')

const SIZE = 512

const canvas = () => {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  return c
}

const tex = (c, srgb) => {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * How far each wheel's inner figure sits from its own rim, in pixels of the 512 map.
 *
 * **Both zero, and measured to be.** The first pair of wheels were cropped out of
 * `cross and jogs.png`, a wide plate illustration, and the Moon's triskele sat 5px
 * — 2% of the radius — above the centre its own rim wanted. The two were not
 * concentric in the drawing, so no crop could satisfy both, and this existed to
 * slide the inner content back.
 *
 * `moonjog.png` and `sunjog.png` (2026-08-28) are rendered square, flat on, one
 * wheel each, and they do not have the problem: fitting the rim band and the inner
 * figure separately puts them **1px apart on the Moon and 4px on the Sun**, out of
 * a 590px radius. The Sun's 4px is a third of a pixel at render size, and
 * correcting it would cost more in resampling softness than it buys.
 *
 * Kept rather than deleted, because it is the fix if a future wheel needs it and
 * because the numbers above are the reason it is currently doing nothing.
 */
const RECENTRE = { moon: [0, 0], sun: [0, 0] }

/**
 * Slide the inner figure onto the rim's centre, fading to nothing by the rim.
 *
 * A flat translation would fix the middle and break the edge — the rim is already
 * right, and moving it would trade a 5px error in a small figure for a 5px error in
 * the one ring that has to be perfect. So the shift decays with radius and is zero
 * from `HOLD` outward, which leaves the reeding and the medallion band exactly where
 * they were fitted and moves only what is wrong.
 *
 * Smoothstep rather than linear: a linear falloff has a corner in its derivative,
 * and a corner in a displacement field is a visible crease running round the wheel.
 */
const HOLD = 0.72
function recentre(ctx, [dx, dy]) {
  if (!dx && !dy) return
  const src = ctx.getImageData(0, 0, SIZE, SIZE)
  const out = ctx.createImageData(SIZE, SIZE)
  const C = SIZE / 2
  const at = (x, y, i) => {
    const xi = Math.min(SIZE - 1, Math.max(0, x | 0)), yi = Math.min(SIZE - 1, Math.max(0, y | 0))
    return src.data[(yi * SIZE + xi) * 4 + i]
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const r = Math.hypot(x - C, y - C) / C
      const t = Math.min(1, r / HOLD)
      const k = 1 - t * t * (3 - 2 * t)          // 1 at the hub, 0 from HOLD out
      const sx = x - dx * k, sy = y - dy * k
      const o = (y * SIZE + x) * 4
      for (let i = 0; i < 4; i++) out.data[o + i] = at(sx, sy, i)
    }
  }
  ctx.putImageData(out, 0, 0)
}

/**
 * Divide the picture's own lighting back out of it.
 *
 * **This is what was making the wheels wobble**, and it is not the crop — the crops
 * are centred to the pixel and their rims are round to about two. The reference is a
 * *rendered* illustration: it has a key light from the upper left, a highlight along
 * that side of the reeding and a cast shadow down the other. Painted into a texture
 * on a platter, that lighting **turns with the platter**. The light source sweeps
 * around the wheel once per revolution, and an object whose highlight orbits it does
 * not read as spinning — it reads as tilting. Fernando, twice: *"the jog designs are
 * still wobbly."*
 *
 * A photograph of a lit thing cannot be spun. So the smooth part of the brightness —
 * the illumination field — is estimated with a wide blur and divided out, which is
 * the flat-field correction a telescope does to its own optics. What survives is the
 * ornament at roughly even brightness; where the light falls is then decided by the
 * room, through the bump map, which is where it should have been decided all along.
 *
 * `STRENGTH` at 1 removes the gradient completely and looks like a scan. A little
 * short of that keeps some of the modelling the illustration was drawn with, which
 * still turns, but by then it is far below the level the eye tracks as a direction.
 *
 * Three box passes approximate a Gaussian closely enough and stay O(n) per pass,
 * which matters because the radius is large — a *narrow* blur would follow the
 * ornament and divide the ornament out along with the light.
 */
/**
 * Back on, and **faded out before the reeding**.
 *
 * The correction divides the picture's own baked lighting back out, because a
 * texture on a platter turns and its painted highlight turns with it — a light
 * source that orbits the wheel once per revolution reads as the wheel *wobbling*,
 * not spinning. That was diagnosed on the first pair of wheels and fixed.
 *
 * It was then switched off for the new art on a measurement that was real and
 * answered the wrong question. Correcting the whole image made the **outermost**
 * ring more lopsided — 0.257 → 0.414 on the Moon — so it looked like a net loss. But
 * that ring is the reeding: two hundred identical teeth, where a first harmonic is
 * mostly aliasing and where nothing is legible enough to read as wobble anyway. On
 * the rings the eye actually tracks, the same pass was a clear win — 0.357 → 0.245
 * on the Moon at 0.72, 0.627 → 0.526 on the Sun.
 *
 * So it applies where it helps and stops where it hurt: full strength through the
 * ornament, faded to nothing across `FADE`, and the reeding untouched. Optimising a
 * single number over the whole image is what hid this — the wheel is not one
 * surface, and the ring that measures loudest is not the ring anyone looks at.
 */
const STRENGTH = 0.75
/** Where the correction begins to fade, and where it has stopped. */
const FADE = [0.84, 0.96]
const BLUR_R = 56

function flatten(d) {
  const n = SIZE * SIZE
  /* nothing to do, and a full-image blur is not free — skip it outright */
  if (STRENGTH === 0) return new Float32Array(n).fill(1)

  const f = new Float32Array(n)
  /**
   * Outside the wheel, the disc is **extended radially** — each corner pixel takes
   * the value of the rim pixel at its own angle.
   *
   * The crop is square and the wheel is its inscribed circle, so a quarter of the
   * image is the dark Plate around it, and blurring across that drags the
   * illumination field toward black exactly where the reeding is. The reeding is
   * the one band that is perfectly symmetric, so it is where a rotating highlight
   * shows worst. Two earlier attempts both failed there and for opposite reasons:
   * leaving the corners alone made the rim's lopsidedness *worse* than uncorrected,
   * and filling them with a flat average made it **uncorrectable** — a constant
   * fill dominates a 72px blur that close to the edge, the field flattens to that
   * constant, and the gain comes out at 1.
   *
   * Clamping outward in polar keeps the real angular variation right up to the rim
   * and past it, which is what the blur there needs to see.
   */
  const C = SIZE / 2, RIM = C - 2, R2 = RIM * RIM
  const raw = new Float32Array(n)
  let sum = 0, cnt = 0
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      const l = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000
      raw[i] = l
      const dx = x - C, dy = y - C
      if (dx * dx + dy * dy <= R2) { sum += l; cnt++ }
    }
  }
  const discMean = sum / cnt
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      const dx = x - C, dy = y - C
      const d2 = dx * dx + dy * dy
      if (d2 <= R2) { f[i] = raw[i]; continue }
      const k = RIM / Math.sqrt(d2)
      const sx = Math.round(C + dx * k), sy = Math.round(C + dy * k)
      f[i] = raw[Math.min(SIZE - 1, Math.max(0, sy)) * SIZE + Math.min(SIZE - 1, Math.max(0, sx))]
    }
  }
  const tmp = new Float32Array(n)
  const boxH = (src, dst) => {
    for (let y = 0; y < SIZE; y++) {
      const o = y * SIZE
      let acc = 0
      for (let x = -BLUR_R; x <= BLUR_R; x++) acc += src[o + Math.min(SIZE - 1, Math.max(0, x))]
      const w = BLUR_R * 2 + 1
      for (let x = 0; x < SIZE; x++) {
        dst[o + x] = acc / w
        acc -= src[o + Math.min(SIZE - 1, Math.max(0, x - BLUR_R))]
        acc += src[o + Math.min(SIZE - 1, Math.max(0, x + BLUR_R + 1))]
      }
    }
  }
  const transpose = (src, dst) => {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) dst[x * SIZE + y] = src[y * SIZE + x]
  }
  for (let pass = 0; pass < 3; pass++) {
    boxH(f, tmp); transpose(tmp, f)
    boxH(f, tmp); transpose(tmp, f)
  }
  /* the gain that takes each pixel back to the picture's own average brightness */
  const gain = new Float32Array(n)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      const r = Math.hypot(x - C, y - C) / C
      /* smoothstep from full correction to none, so the reeding keeps its own
         contrast and there is no ring where the treatment stops */
      const t = Math.min(1, Math.max(0, (r - FADE[0]) / (FADE[1] - FADE[0])))
      const w = STRENGTH * (1 - t * t * (3 - 2 * t))
      const k = discMean / Math.max(8, f[i])
      /* clamped: an unbounded gain turns the darkest corner of the ornament into
         noise, and noise that rotates is the very thing being removed */
      gain[i] = Math.min(2.6, Math.max(0.42, 1 + (k - 1) * w))
    }
  }
  return gain
}

/**
 * Colour, relief and emission for one Deck.
 *
 * Returns the three textures **immediately**, backed by empty canvases, and fills
 * them when the image arrives. `deckMaps` is called while the module is still
 * evaluating and the whole scene is built around whatever it hands back, so it
 * cannot wait; and a texture whose canvas changes later is exactly what
 * `needsUpdate` is for. Until the image lands the wheels are black, which is a
 * frame or two in practice and is also what they look like once the Vigil has put
 * them out.
 */
/**
 * Turn the height field into a real tangent-space normal map.
 *
 * `bumpMap` was doing this job and doing it softly: three derives a perturbation
 * per-pixel from screen-space derivatives of the height texture, which is cheap,
 * resolution-dependent, and gets vaguer the further away the surface is — so the
 * carving flattened out at exactly the distance the wheel is normally seen from.
 * A normal map is computed once, at texture resolution, and holds its detail.
 *
 * The height is blurred by one pixel before differencing. Without it, the source
 * being a *photograph* means every bit of sensor grain becomes a facet, and the
 * wheel comes out looking hammered rather than carved — the same failure as driving
 * `bumpScale` too hard, arriving by a different road.
 *
 * `strength` halved to 1.7 on Fernando's *"two much bevel and depth"*. The
 * temptation with a normal map is to set it by whether the relief is *visible*,
 * which lands far too high: these wheels are photographs of carved stone and the
 * carving is **already in the albedo**. The normal map's job is only to make that
 * carving answer to the room's light as the platter turns — not to restate depth
 * the picture has already drawn. Doubling up reads as wax.
 */
function normalFrom(h, strength) {
  const n = SIZE * SIZE
  const blur = new Float32Array(n)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let s = 0
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const xx = Math.min(SIZE - 1, Math.max(0, x + i)), yy = Math.min(SIZE - 1, Math.max(0, y + j))
        s += h[yy * SIZE + xx]
      }
      blur[y * SIZE + x] = s / 9
    }
  }
  const out = new ImageData(SIZE, SIZE)
  const at = (x, y) => blur[Math.min(SIZE - 1, Math.max(0, y)) * SIZE + Math.min(SIZE - 1, Math.max(0, x))]
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      /* Sobel, so the slope comes from a 3x3 neighbourhood rather than two pixels —
         less noise, and a wider, softer wall on each cut, which is what a bevel is */
      const gx = (at(x+1,y-1) + 2*at(x+1,y) + at(x+1,y+1)) - (at(x-1,y-1) + 2*at(x-1,y) + at(x-1,y+1))
      const gy = (at(x-1,y+1) + 2*at(x,y+1) + at(x+1,y+1)) - (at(x-1,y-1) + 2*at(x,y-1) + at(x+1,y-1))
      const nx = -gx / 255 * strength, ny = -gy / 255 * strength
      const len = Math.hypot(nx, ny, 1)
      const o = (y * SIZE + x) * 4
      out.data[o]     = (nx / len * .5 + .5) * 255
      out.data[o + 1] = (ny / len * .5 + .5) * 255
      out.data[o + 2] = (1 / len * .5 + .5) * 255
      out.data[o + 3] = 255
    }
  }
  return out
}

export function deckMaps(kind) {
  const A = canvas(), H = canvas(), E = canvas(), N = canvas()
  const albedo = tex(A, true), height = tex(H, false), emissive = tex(E, true)
  const normal = tex(N, false)

  const img = new Image()
  img.onload = () => {
    const a = A.getContext('2d')
    a.drawImage(img, 0, 0, SIZE, SIZE)
    recentre(a, RECENTRE[kind])
    const src = a.getImageData(0, 0, SIZE, SIZE)
    const d = src.data
    const field = flatten(d)

    const hd = new ImageData(SIZE, SIZE)
    const ed = new ImageData(SIZE, SIZE)
    for (let i = 0; i < d.length; i += 4) {
      /* flat-fielded: the picture's own baked light divided back out */
      const k0 = field[i >> 2]
      const r = Math.min(255, d[i] * k0)
      const g = Math.min(255, d[i + 1] * k0)
      const b = Math.min(255, d[i + 2] * k0)
      d[i] = r; d[i + 1] = g; d[i + 2] = b
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b)

      const lum = (r * 299 + g * 587 + b * 114) / 1000
      /* relief: luminance straight through */
      hd.data[i] = hd.data[i + 1] = hd.data[i + 2] = lum
      hd.data[i + 3] = 255

      /**
       * Emission, and the two wheels do not derive it the same way, because they
       * are not lit by the same thing.
       *
       * **Sun — saturation gates it, value scales it.** Its glass is deeply
       * saturated amber and its stone is near-grey bone, so saturation separates
       * *lit glass* from *lit stone* where brightness cannot: the palest pixel on
       * the wheel is bone, which must not glow, and the amber behind the tracery
       * must, even where it is darker than the bone beside it. Squaring keeps the
       * bone out — bone carries a warm cast, being lit by the same amber, and a
       * linear gate brought the whole wheel up as a glowing cream disc with the
       * tracery invisible against it.
       *
       * **Moon — luminance, cubed.** The same gate on the Moon returns almost
       * nothing, because nothing on it is saturated. That is *correct* for the
       * picture and wrong for the object: `deckGlow` exists so the Moon comes up
       * as the room goes down, and a Moon with an empty emissive map would simply
       * have gone out with everything else. Nothing burns behind the Moon — there
       * is no glass — so what lights is the **stone**, catching what little is
       * left. Cubing keeps that to the highlights on the carving rather than
       * washing the whole disc, and the material tints it cold.
       */
      let k
      if (kind === 'sun') {
        const sat = mx === 0 ? 0 : (mx - mn) / mx
        k = sat * sat * (mx / 255)
        ed.data[i] = r * k
        ed.data[i + 1] = g * k
        ed.data[i + 2] = b * k
      } else {
        k = Math.pow(lum / 255, 3)
        ed.data[i] = ed.data[i + 1] = ed.data[i + 2] = 255 * k
      }
      ed.data[i + 3] = 255
    }
    a.putImageData(src, 0, 0)
    H.getContext('2d').putImageData(hd, 0, 0)
    E.getContext('2d').putImageData(ed, 0, 0)
    const hf = new Float32Array(SIZE * SIZE)
    for (let i = 0; i < hf.length; i++) hf[i] = hd.data[i * 4]
    N.getContext('2d').putImageData(normalFrom(hf, 1.7), 0, 0)
    albedo.needsUpdate = height.needsUpdate = emissive.needsUpdate = normal.needsUpdate = true
  }
  img.src = url(kind)

  return { albedo, height, emissive, normal }
}

/**
 * How hard each Deck burns at a given Vigil.
 *
 * The Sun holds while the room is lit and is out by the time the last Candle is;
 * the Moon is dark at first light and takes over as the room goes. They cross near
 * the middle of the rite, so there is a moment where both are alight and neither
 * has won.
 */
export function deckGlow(vigil) {
  const v = Math.max(0, Math.min(1, vigil))
  return { sun: Math.pow(1 - v, 1.35), moon: Math.pow(v, 1.5) }
}

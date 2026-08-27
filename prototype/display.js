/**
 * The Screen as a physical display rather than as a texture of some pixels.
 *
 * `screen/render.js` draws the *content* at 320x180. That buffer is correct and
 * says nothing about what it is being shown on — dropped straight onto a plane it
 * reads as an image pasted into the Plate, because a real panel is never just its
 * signal. It has structure (the pixels have gaps between them), it blooms (lit
 * phosphor bleeds into its neighbours), it falls off at the edges, and it is
 * behind glass that the room lands on.
 *
 * All four are added here, at 3x, into the canvas the Unit actually uploads. The
 * room's own contribution — real specular from the Candles — is not faked here;
 * that comes from the material in `scene.js`, which is lit.
 *
 * Kept soft on purpose. The Screen draws around 590px wide on the Plate, so a
 * 960px canvas is being *down*-sampled: hard one-pixel scanlines would land near
 * Nyquist and shimmer as the camera moves. Soft ones average into a gentle
 * darkening at distance, which is what a real panel does anyway.
 */

const SCALE = 3

/**
 * How hard the treatment is laid on.
 *
 * These are low by default and they are meant to stay low. The panel has to be
 * *read* — it is the only place Module content appears, and a display you cannot
 * read is a worse display than a flat rectangle, however convincing its phosphor.
 * Structure is a suggestion of a panel, not a simulation of one.
 */
export const DEFAULTS = {
  scan: .10,    // horizontal line darkening
  comb: .035,   // vertical grille
  bloom: .17,   // phosphor bleed
  vignette: .18, // corner fall-off
  sheen: .045,  // the room on the glass
}

/**
 * Build the display surface for a 320x180 source buffer.
 *
 * Returns the canvas to upload, a `paint()` to call once a frame, and a `set()`
 * for tuning the treatment live — see `__unit.setDisplay` in `scene.js`.
 */
export function createDisplay(source, opts = {}) {
  const W = source.width * SCALE, H = source.height * SCALE
  const out = document.createElement('canvas')
  out.width = W; out.height = H
  const g = out.getContext('2d')
  g.imageSmoothingEnabled = false

  /* The blur pass needs its own copy — `filter` applies to what is being drawn,
     so blooming in place would blur the sharp layer too. */
  const soft = document.createElement('canvas')
  soft.width = W; soft.height = H
  const sg = soft.getContext('2d')
  sg.imageSmoothingEnabled = false

  let cfg = { ...DEFAULTS, ...opts }

  /* ---------- the fixed layers, rebuilt when the treatment changes ---------- */
  const grille = document.createElement('canvas')
  grille.width = W; grille.height = H
  const glass = document.createElement('canvas')
  glass.width = W; glass.height = H

  function build() {

  /**
   * The grille: the gaps between pixels.
   *
   * Horizontal scanlines carry most of it, with a much fainter vertical comb —
   * enough to suggest a triad structure without turning into a screen door.
   */
    const q = grille.getContext('2d')
    q.clearRect(0, 0, W, H)
    for (let y = 0; y < H; y += SCALE) {
      const grad = q.createLinearGradient(0, y, 0, y + SCALE)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, 'rgba(0,0,0,' + cfg.scan + ')')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      q.fillStyle = grad
      q.fillRect(0, y, W, SCALE)
    }
    q.fillStyle = 'rgba(0,0,0,' + cfg.comb + ')'
    for (let x = 0; x < W; x += SCALE) q.fillRect(x, 0, 1, H)

  /**
   * The glass: what the room leaves on it.
   *
   * One soft diagonal band from the upper left, which is where the chapel's light
   * comes from, plus a darkening at the edges where a panel is always dimmest.
   * Faint enough to read as glass rather than as a graphic.
   */
    const r = glass.getContext('2d')
    r.clearRect(0, 0, W, H)
    const sheen = r.createLinearGradient(0, 0, W * 0.85, H)
    sheen.addColorStop(0, 'rgba(214,226,222,' + cfg.sheen * 2 + ')')
    sheen.addColorStop(0.18, 'rgba(214,226,222,' + cfg.sheen * 0.7 + ')')
    sheen.addColorStop(0.34, 'rgba(255,255,255,0)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    r.fillStyle = sheen; r.fillRect(0, 0, W, H)

    /* The corner fall-off starts well out, so it never reaches the body copy —
       a vignette that touches text is a vignette that has become a legibility bug. */
    const vig = r.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.46,
                                       W / 2, H / 2, Math.max(W, H) * 0.72)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,' + cfg.vignette + ')')
    r.fillStyle = vig; r.fillRect(0, 0, W, H)
  }
  build()

  /* ---------- per frame ---------- */

  function paint() {
    /* the signal, hard-edged: these are pixels and they should look like pixels */
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
    g.clearRect(0, 0, W, H)
    g.drawImage(source, 0, 0, W, H)

    /* bloom — lit phosphor bleeding into what is next to it. Additive, so only
       the lit parts spread and the black stays black. */
    sg.globalCompositeOperation = 'source-over'
    sg.filter = 'none'
    sg.clearRect(0, 0, W, H)
    sg.filter = 'blur(' + (SCALE * 1.6) + 'px)'
    sg.drawImage(source, 0, 0, W, H)
    sg.filter = 'none'

    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = cfg.bloom
    g.drawImage(soft, 0, 0)

    /* structure, then glass */
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
    g.drawImage(grille, 0, 0)
    g.drawImage(glass, 0, 0)
  }

  paint()

  /** Retune the treatment live. Partial — anything omitted keeps its value. */
  function set(next) { cfg = { ...cfg, ...next }; build(); paint(); return cfg }

  return { canvas: out, paint, set, width: W, height: H, get cfg() { return cfg } }
}

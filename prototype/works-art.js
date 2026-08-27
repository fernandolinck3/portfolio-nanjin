/**
 * Placeholder sheets for the Works.
 *
 * A Work is an image — a poster, a screenshot of a site — and Fernando's are not
 * in the repo yet (`WORKS` in `src/content/modules.ts`). These are stand-ins so
 * the summoning can be built and judged before the real art lands.
 *
 * They are drawn, not sourced, for two reasons. ADR-0004 forbids adding a
 * dependency to decode an asset, and PRODUCT.md forbids anything that could be
 * mistaken for real work: every stand-in is stamped PLACEHOLDER across its face,
 * so a screenshot of this prototype cannot be misread as a portfolio piece. Only
 * 001 comes back clean, because only 001 is real.
 *
 * Palette is the room's — bone, gold, ember on near-black — so the projection
 * reads as belonging to the chapel rather than as a foreign image pasted into it.
 */

const BONE = '#DCD6C6', GOLD = '#C9BE96', EMBER = '#F87A5E', RED = '#C4281C', INK = '#0C0A0B'

/** Deterministic noise, so a sheet looks the same every load. */
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/**
 * The stamp that keeps a stand-in honest.
 *
 * Only stand-ins get it. 001 is a real thing the visitor is standing inside, and
 * stamping it PLACEHOLDER would be as dishonest in the other direction.
 */
function stamp(g, w, h, label, placeholder) {
  if (!placeholder) {
    g.fillStyle = EMBER
    g.font = `500 ${Math.round(w * 0.026)}px "Azeret Mono", ui-monospace, monospace`
    g.textAlign = 'left'
    g.fillText(label, w * 0.06, h - h * 0.035)
    return
  }
  g.save()
  g.translate(w / 2, h / 2)
  g.rotate(-Math.atan2(h, w))
  g.globalAlpha = 0.5
  g.strokeStyle = RED
  g.lineWidth = Math.max(3, w * 0.012)
  g.font = `700 ${Math.round(w * 0.11)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'center'
  const t = 'PLACEHOLDER'
  const tw = g.measureText(t).width
  g.strokeText(t, 0, 0)
  g.strokeRect(-tw / 2 - w * 0.04, -w * 0.09, tw + w * 0.08, w * 0.15)
  g.restore()
  g.globalAlpha = 1

  g.fillStyle = EMBER
  g.font = `500 ${Math.round(w * 0.026)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'left'
  g.fillText(label, w * 0.06, h - h * 0.035)
}

/** A poster: one bold shape, a type block, halftone ground. Portrait. */
function poster(work, seed) {
  const c = document.createElement('canvas')
  c.width = 560; c.height = 800
  const g = c.getContext('2d')
  const rnd = rng(seed)
  const W = c.width, H = c.height

  g.fillStyle = INK; g.fillRect(0, 0, W, H)

  /* halftone ground — the same ordered-dot logic the Screen uses, at print scale */
  for (let y = 0; y < H; y += 8) {
    for (let x = 0; x < W; x += 8) {
      const k = 1 - y / H
      if (rnd() > k * 0.55) continue
      g.fillStyle = `rgba(201,190,150,${0.05 + rnd() * 0.12})`
      g.beginPath(); g.arc(x, y, 1 + rnd() * 2.2, 0, 6.2832); g.fill()
    }
  }

  /* one bold shape, because a poster is one idea seen from across a room */
  g.fillStyle = RED
  g.beginPath()
  g.arc(W * 0.5, H * 0.36, W * 0.28, 0, 6.2832)
  g.fill()
  g.globalCompositeOperation = 'destination-out'
  g.beginPath(); g.arc(W * 0.62, H * 0.30, W * 0.22, 0, 6.2832); g.fill()
  g.globalCompositeOperation = 'source-over'

  g.strokeStyle = GOLD; g.lineWidth = 2
  for (let i = 0; i < 5; i++) {
    const yy = H * 0.60 + i * 7
    g.beginPath(); g.moveTo(W * 0.08, yy); g.lineTo(W * 0.92, yy); g.stroke()
  }

  g.fillStyle = BONE
  g.font = `700 ${Math.round(W * 0.13)}px "Archivo", system-ui, sans-serif`
  g.textAlign = 'left'
  g.fillText(work.no, W * 0.08, H * 0.78)
  g.font = `400 ${Math.round(W * 0.052)}px "Azeret Mono", ui-monospace, monospace`
  g.fillStyle = GOLD
  g.fillText(work.title.toUpperCase(), W * 0.08, H * 0.845)

  stamp(g, W, H, work.kind.toUpperCase() + ' · ' + work.no, work.placeholder)
  return c
}

/** A site: chrome, a hero, a column grid. Landscape. */
function site(work, seed) {
  const c = document.createElement('canvas')
  c.width = 900; c.height = 620
  const g = c.getContext('2d')
  const rnd = rng(seed)
  const W = c.width, H = c.height

  g.fillStyle = INK; g.fillRect(0, 0, W, H)

  /* browser chrome, so the sheet reads as a site rather than as a picture */
  g.fillStyle = '#1A1618'; g.fillRect(0, 0, W, 46)
  for (let i = 0; i < 3; i++) {
    g.fillStyle = ['#4A3A38', '#4A443A', '#3A4438'][i]
    g.beginPath(); g.arc(26 + i * 22, 23, 6, 0, 6.2832); g.fill()
  }
  g.fillStyle = '#0F0D0E'; g.fillRect(110, 12, W - 140, 22)

  /* hero */
  g.fillStyle = RED; g.fillRect(0, 46, W, 4)
  g.fillStyle = BONE
  g.font = `700 ${Math.round(W * 0.055)}px "Archivo", system-ui, sans-serif`
  g.fillText(work.title, 48, 150)
  g.fillStyle = GOLD
  g.font = `400 ${Math.round(W * 0.021)}px "Azeret Mono", ui-monospace, monospace`
  g.fillText('— ' + work.kind + ' · ' + work.year, 48, 190)

  /* a column grid of blocked-out content */
  const cols = 3, gut = 30, cw = (W - 96 - gut * (cols - 1)) / cols
  for (let i = 0; i < cols; i++) {
    const x = 48 + i * (cw + gut)
    g.fillStyle = 'rgba(220,214,198,.10)'
    g.fillRect(x, 250, cw, 150)
    g.fillStyle = 'rgba(220,214,198,.28)'
    for (let r = 0; r < 5; r++)
      g.fillRect(x, 424 + r * 18, cw * (0.55 + rnd() * 0.45), 6)
  }

  stamp(g, W, H, work.kind.toUpperCase() + ' · ' + work.no, work.placeholder)
  return c
}

/**
 * The sheet for a Work, as a canvas ready to become a texture.
 *
 * `Unit` gets the poster treatment — 001 is a real thing and deserves the bolder
 * of the two layouts, and it is the one sheet that is not a stand-in, so it is
 * also the only one that comes back unstamped.
 */
export function sheetFor(work, index) {
  return work.kind === 'Site' ? site(work, 9001 + index * 77) : poster(work, 4200 + index * 131)
}

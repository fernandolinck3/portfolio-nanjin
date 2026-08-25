/**
 * Original constructed letterforms for the FER BITTENCOURT monument.
 *
 * Drawn for this project — no licensed display face is involved.
 *
 * Construction system, in glyph units:
 *   cap height   100   (y = 0 at cap line, y = 100 at baseline)
 *   stem width    24
 *   chamfer       ~18  (45-degree cuts on every free terminal)
 *
 * Rules: no curves anywhere, every arm terminal cut back on the diagonal,
 * counters angular and cut at the same angle as the outer form. Gothic in
 * weight and rhythm, digital in construction.
 */

export const CAP_HEIGHT = 100

/** Space between adjacent glyphs, in glyph units. */
export const LETTER_GAP = 10

/** Advance for the word space, in glyph units. */
export const WORD_SPACE = 44

export type Glyph = {
  /** Ink width of the form. Advance is this plus LETTER_GAP. */
  width: number
  /** SVG path data. Counters rely on the evenodd fill rule. */
  path: string
}

export const GLYPHS: Record<string, Glyph> = {
  F: {
    width: 66,
    path: 'M0 0 L66 0 L40 22 L24 22 L24 40 L58 40 L36 60 L24 60 L24 100 L0 100 Z',
  },
  E: {
    width: 66,
    path:
      'M0 0 L66 0 L40 22 L24 22 L24 40 L56 40 L34 60 L24 60 L24 78 L66 78 ' +
      'L40 100 L0 100 Z',
  },
  R: {
    width: 70,
    path:
      'M0 0 L70 0 L70 48 L46 64 L70 100 L42 100 L24 68 L24 100 L0 100 Z ' +
      'M24 18 L48 18 L48 36 L36 48 L24 48 Z',
  },
  B: {
    width: 70,
    path:
      'M0 0 L56 0 L70 16 L70 40 L60 50 L70 60 L70 84 L56 100 L0 100 Z ' +
      'M24 16 L48 16 L48 32 L38 44 L24 44 Z ' +
      'M24 56 L48 56 L48 72 L38 84 L24 84 Z',
  },
  I: {
    width: 24,
    path: 'M0 0 L24 0 L24 100 L0 100 Z',
  },
  T: {
    width: 66,
    path: 'M0 0 L66 0 L66 22 L45 22 L45 100 L21 100 L21 22 L0 22 Z',
  },
  N: {
    width: 74,
    path: 'M0 0 L24 0 L50 52 L50 0 L74 0 L74 100 L50 100 L24 48 L24 100 L0 100 Z',
  },
  C: {
    width: 70,
    path: 'M0 0 L70 0 L44 22 L24 22 L24 78 L44 78 L70 100 L0 100 Z',
  },
  O: {
    width: 74,
    path:
      'M14 0 L60 0 L74 14 L74 86 L60 100 L14 100 L0 86 L0 14 Z ' +
      'M24 24 L50 24 L50 76 L24 76 Z',
  },
  U: {
    width: 74,
    path: 'M0 0 L24 0 L24 78 L50 78 L50 0 L74 0 L74 86 L60 100 L14 100 L0 86 Z',
  },
}

export function glyphAdvance(char: string): number {
  if (char === ' ') return WORD_SPACE
  const glyph = GLYPHS[char]
  return glyph ? glyph.width + LETTER_GAP : 0
}

export type PlacedGlyph = {
  char: string
  x: number
  glyph: Glyph
}

export type WordmarkLine = {
  text: string
  glyphs: PlacedGlyph[]
  width: number
}

/**
 * Lays out one line of text, returning each glyph's x offset and the total ink
 * width (which excludes the trailing gap after the final glyph).
 */
export function layoutLine(text: string): WordmarkLine {
  const glyphs: PlacedGlyph[] = []
  let x = 0

  for (const char of text) {
    const glyph = GLYPHS[char]
    if (glyph) {
      glyphs.push({ char, x, glyph })
    }
    x += glyphAdvance(char)
  }

  const last = glyphs[glyphs.length - 1]
  const width = last ? last.x + last.glyph.width : 0

  return { text, glyphs, width }
}

export function layoutLines(lines: string[]): {
  lines: WordmarkLine[]
  width: number
  height: number
} {
  const laidOut = lines.map(layoutLine)
  const width = Math.max(...laidOut.map((line) => line.width), 0)
  /** Lines sit on a baseline grid of 1.18 cap heights. */
  const height = CAP_HEIGHT * (1 + 1.18 * (laidOut.length - 1))

  return { lines: laidOut, width, height }
}

/** Vertical offset of a line within the laid-out block, in glyph units. */
export function lineOffsetY(index: number): number {
  return index * CAP_HEIGHT * 1.18
}

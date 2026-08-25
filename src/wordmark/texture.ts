import { layoutLines, lineOffsetY } from './glyphs'

/**
 * Rasterises the constructed wordmark into a canvas so the shader can treat it
 * as a field of light. The same path data drives this and the inline SVG, so
 * the enhancement can never drift from the fallback.
 */
export function drawWordmark(lines: string[], targetWidth: number): HTMLCanvasElement {
  const layout = layoutLines(lines)
  const scale = targetWidth / layout.width
  /** A little vertical headroom so bloom is not clipped at the edges. */
  const padding = Math.round(layout.height * scale * 0.08)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(targetWidth) + padding * 2
  canvas.height = Math.round(layout.height * scale) + padding * 2

  const context = canvas.getContext('2d')
  if (!context) return canvas

  context.setTransform(scale, 0, 0, scale, padding, padding)
  context.fillStyle = '#ffffff'

  for (const [index, line] of layout.lines.entries()) {
    for (const placed of line.glyphs) {
      const path = new Path2D()
      path.addPath(
        new Path2D(placed.glyph.path),
        new DOMMatrix().translate(placed.x, lineOffsetY(index)),
      )
      context.fill(path, 'evenodd')
    }
  }

  return canvas
}

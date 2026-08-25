import { useMemo } from 'react'
import { CAP_HEIGHT, layoutLines, lineOffsetY } from '../wordmark/glyphs'

type WordmarkProps = {
  lines: string[]
  className?: string
}

/**
 * The static monument. This is the baseline that always renders — the WebGL
 * enhancement layers over it and never replaces it.
 */
export function Wordmark({ lines, className }: WordmarkProps) {
  const layout = useMemo(() => layoutLines(lines), [lines])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {layout.lines.map((line, index) => (
        <g key={line.text} transform={`translate(0 ${lineOffsetY(index)})`}>
          {line.glyphs.map((placed, glyphIndex) => (
            <path
              key={`${placed.char}-${glyphIndex}`}
              d={placed.glyph.path}
              transform={`translate(${placed.x} 0)`}
              fillRule="evenodd"
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

export { CAP_HEIGHT }

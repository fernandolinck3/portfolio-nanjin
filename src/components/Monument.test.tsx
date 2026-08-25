import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Monument, canUseWebGL } from './Monument'
import { Wordmark } from './Wordmark'
import { GLYPHS, layoutLine, layoutLines } from '../wordmark/glyphs'

describe('wordmark geometry', () => {
  it('has a glyph for every letter in the name', () => {
    for (const char of 'FERBITTENCOURT') {
      expect(GLYPHS[char], `missing glyph: ${char}`).toBeDefined()
    }
  })

  it('advances each glyph past the previous one', () => {
    const line = layoutLine('FER')
    expect(line.glyphs.map((placed) => placed.char)).toEqual(['F', 'E', 'R'])
    expect(line.glyphs[1].x).toBeGreaterThan(line.glyphs[0].x)
    expect(line.glyphs[2].x).toBeGreaterThan(line.glyphs[1].x)
  })

  it('excludes the trailing gap from the measured ink width', () => {
    const line = layoutLine('FER')
    const last = line.glyphs[2]
    expect(line.width).toBe(last.x + last.glyph.width)
  })

  it('reserves horizontal room for the word space', () => {
    expect(layoutLine('FER BITTENCOURT').width).toBeGreaterThan(
      layoutLine('FERBITTENCOURT').width,
    )
  })

  it('sizes a stacked block to the widest line', () => {
    const layout = layoutLines(['FER', 'BITTENCOURT'])
    expect(layout.width).toBe(layoutLine('BITTENCOURT').width)
    expect(layout.lines).toHaveLength(2)
  })
})

describe('Wordmark', () => {
  it('renders one path per letter and hides itself from assistive tech', () => {
    const { container } = render(<Wordmark lines={['FER']} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('path')).toHaveLength(3)
  })
})

describe('Monument', () => {
  const decayRef = createRef<number>() as { current: number }
  decayRef.current = 0

  it('exposes the name as text even though the glyphs are vector art', () => {
    render(
      <Monument lines={['FER', 'BITTENCOURT']} label="Fer Bittencourt" reducedMotion={false} decayRef={decayRef} />,
    )

    expect(screen.getByText('Fer Bittencourt')).toBeInTheDocument()
  })

  it('keeps the SVG baseline when WebGL is unavailable', () => {
    const { container } = render(
      <Monument lines={['FER']} label="Fer Bittencourt" reducedMotion={false} decayRef={decayRef} />,
    )

    /** jsdom has no WebGL, so the enhancement must never claim to be ready. */
    expect(container.querySelector('.monument')).toHaveAttribute(
      'data-enhanced',
      'false',
    )
    expect(container.querySelector('.monument__svg')).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('reports WebGL as unavailable when the context cannot be created', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    expect(canUseWebGL(canvas)).toBe(false)
  })

  it('reports WebGL as unavailable when getContext throws', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(canUseWebGL(canvas)).toBe(false)
  })
})

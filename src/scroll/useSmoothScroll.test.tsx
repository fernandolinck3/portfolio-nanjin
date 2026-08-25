import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion, useSmoothScroll } from './useSmoothScroll'

const lenisInstances: Array<{ destroyed: boolean }> = []

vi.mock('lenis', () => ({
  default: class {
    destroyed = false
    constructor() {
      lenisInstances.push(this)
    }
    raf() {}
    scrollTo() {}
    destroy() {
      this.destroyed = true
    }
  },
}))

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

afterEach(() => {
  lenisInstances.length = 0
  vi.unstubAllGlobals()
})

describe('useReducedMotion', () => {
  it('reports the preference from matchMedia', () => {
    mockReducedMotion(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reports false when the visitor has no preference', () => {
    mockReducedMotion(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })
})

describe('useSmoothScroll', () => {
  it('never starts the virtual scroller when disabled', () => {
    renderHook(() => useSmoothScroll(false))
    expect(lenisInstances).toHaveLength(0)
  })

  it('starts the virtual scroller when enabled', () => {
    renderHook(() => useSmoothScroll(true))
    expect(lenisInstances).toHaveLength(1)
  })

  it('tears the scroller down on unmount so native scrolling returns', () => {
    const { unmount } = renderHook(() => useSmoothScroll(true))
    unmount()
    expect(lenisInstances[0].destroyed).toBe(true)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { canvasPoint, observeNotices } from './viewport-ui.js'

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; document.documentElement.removeAttribute('style') })

describe('canvas coordinates', () => {
  it('maps an ordinary canvas hit', () => {
    expect(canvasPoint({ clientX: 110, clientY: 65 }, { left: 10, top: 20, width: 400, height: 180 }, 320, 180)).toEqual([80, 45])
  })
  it('inverts the clockwise frame transform, including off-center hits', () => {
    expect(canvasPoint({ clientX: 145, clientY: 120 }, { left: 10, top: 20, width: 180, height: 400 }, 320, 180, true)).toEqual([80, 45])
    expect(canvasPoint({ clientX: 190, clientY: 20 }, { left: 10, top: 20, width: 180, height: 400 }, 320, 180, true)).toEqual([0, 0])
  })
  it('ignores an unlaid-out canvas', () => {
    expect(canvasPoint({}, { width: 0, height: 0 }, 320, 180, true)).toBeNull()
  })
})

it('updates reserved space when notice content or touch layout changes', () => {
  let resize
  const disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { resize = callback }
    observe() {}
    disconnect = disconnect
  })
  document.body.innerHTML = '<div id="avisos"></div><nav class="touch"></nav>'
  const notices = document.getElementById('avisos')
  notices.getBoundingClientRect = () => ({ height: 153.375 })
  Object.defineProperty(document.querySelector('.touch'), 'offsetHeight', { get: () => 62 })
  const stop = observeNotices()
  expect(document.documentElement.style.getPropertyValue('--notice-height')).toBe('153.375px')
  expect(document.documentElement.style.getPropertyValue('--touch-height')).toBe('62px')
  notices.getBoundingClientRect = () => ({ height: 44 })
  resize()
  expect(document.documentElement.style.getPropertyValue('--notice-height')).toBe('44px')
  stop()
  expect(disconnect).toHaveBeenCalledOnce()
})

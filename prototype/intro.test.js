/**
 * The opening, on a clock we control.
 *
 * `rAF` fires zero times in an automated tab, so the one thing that cannot be checked
 * in a browser here is *timing* — which is the entire subject of T-21. `createIntro`
 * takes `dt` and calls back, so it can be driven a step at a time in node and asked
 * the only question that matters: when is there something to read.
 *
 * The assertions are on `HOLD + BOOT` as a sum, never on either constant, because the
 * budget is the sum. Retuning the pair is allowed; spending more than the budget is
 * what this is here to catch.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createIntro } from './intro.js'

/** Runs the opening at 60fps and reports when each thing finished, in seconds. */
function play(intro, onBoot, limit = 12) {
  const dt = 1 / 60
  let t = 0, legibleAt = null
  while (t < limit) {
    const alive = intro.update(dt)
    t += dt
    if (legibleAt === null && onBoot.mock.calls.at(-1)?.[0] >= 1) legibleAt = t
    if (!alive) break
  }
  return { legibleAt, endedAt: t }
}

const store = new Map()
beforeEach(() => {
  store.clear()
  vi.stubGlobal('sessionStorage', {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
  })
})

const make = onBoot => createIntro({ apply() {}, onBoot })

describe('the opening costs what it is allowed to cost', () => {
  it('puts something legible on the Screen in under 2.5s on a cold load', () => {
    const onBoot = vi.fn()
    const { legibleAt } = play(make(onBoot), onBoot)
    expect(legibleAt).not.toBeNull()
    expect(legibleAt).toBeLessThan(2.5)
  })

  /** The regression this ticket exists to prevent: it was 5.9s for several sessions. */
  it('is nowhere near the 5.9s it used to be', () => {
    const onBoot = vi.fn()
    const { legibleAt } = play(make(onBoot), onBoot)
    expect(legibleAt).toBeLessThan(3)
  })

  it('is faster still on a second load in the same session', () => {
    const first = vi.fn()
    const a = play(make(first), first)
    const second = vi.fn()
    const b = play(make(second), second)
    expect(b.legibleAt).toBeLessThan(a.legibleAt)
    /* and still an opening, not a jump cut */
    expect(b.legibleAt).toBeGreaterThan(0.3)
  })

  it('still plays in full when storage refuses to answer', () => {
    vi.stubGlobal('sessionStorage', {
      getItem() { throw new Error('blocked') },
      setItem() { throw new Error('blocked') },
    })
    const onBoot = vi.fn()
    const { legibleAt } = play(make(onBoot), onBoot)
    expect(legibleAt).toBeGreaterThan(1)
    expect(legibleAt).toBeLessThan(2.5)
  })

  it('ends the moment it is skipped, and reports itself finished', () => {
    const onBoot = vi.fn()
    const intro = make(onBoot)
    intro.update(1 / 60)
    intro.skip()
    expect(intro.running).toBe(false)
    expect(onBoot.mock.calls.at(-1)?.[0]).toBe(1)
  })

  /** Asking to see it again means seeing it, not seeing it hurried. */
  it('replays at full length even on a repeat visit', () => {
    const first = vi.fn()
    play(make(first), first)
    const again = vi.fn()
    const intro = make(again)
    play(intro, again)
    intro.replay()
    const third = play(intro, again)
    expect(third.legibleAt).toBeGreaterThan(2)
  })
})

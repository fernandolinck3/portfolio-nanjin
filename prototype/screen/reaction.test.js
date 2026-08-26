/**
 * @vitest-environment node
 *
 * Nothing here touches the DOM, and jsdom is expensive to stand up in this repo —
 * 624s of a 833s run, because every file it loads out of node_modules is an
 * iCloud fault-in. Declaring the environment per-file keeps this suite at ~13s
 * without changing the default for the tests that do need a document.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  FRAME_COUNT, FRAME_MS, IDLE_EVERY_MS, IDLE_FRAME, TRIGGER_THRESHOLD, createKnobReaction,
} from './reaction.js'
import { REACTION_FRAMES, REACTION_H, REACTION_W } from './reaction-frames.js'

/**
 * The reason these exist: the control driving this animation is continuous.
 * Dragging a Deck calls `setVigil` on every pointermove with a delta of a
 * thousandth, so "does it play once" and "does it survive being poked sixty
 * times a second" are different questions, and only the second one is where the
 * bugs live.
 */

/** A clock and a media query we own, so nothing here depends on wall time. */
function harness(opts = {}) {
  let t = 1000
  const media = {
    matches: opts.reduced ?? false,
    handlers: new Set(),
    addEventListener(_, h) { this.handlers.add(h) },
    removeEventListener(_, h) { this.handlers.delete(h) },
    emit(matches) { this.matches = matches; for (const h of this.handlers) h({ matches }) },
  }
  const r = createKnobReaction({ now: () => t, media, ...opts })
  return { r, media, advance: ms => { t += ms }, at: () => t }
}

/** Turn the control far enough, in one go, to spend the threshold. */
const turn = (r, from = 0) => r.notify(from + TRIGGER_THRESHOLD * 2)

describe('the frames themselves', () => {
  it('is ten frames at the Screen resolution', () => {
    expect(REACTION_FRAMES).toHaveLength(FRAME_COUNT)
    for (const f of REACTION_FRAMES) {
      expect(f).toHaveLength(REACTION_H)
      for (const row of f) expect(row).toHaveLength(REACTION_W)
    }
  })

  it('preserves the 28x40 logical resolution', () => {
    expect([REACTION_W, REACTION_H]).toEqual([28, 40])
  })

  it('uses only the four tones and transparency', () => {
    const seen = new Set()
    for (const f of REACTION_FRAMES) for (const row of f) for (const ch of row) seen.add(ch)
    /* sorted by code point: '#' 35, '-' 45, '.' 46, '=' 61, 'o' 111 */
    expect([...seen].sort().join('')).toBe('#-.=o')
  })

  it('actually moves — every frame after idle differs from it', () => {
    const idle = REACTION_FRAMES[IDLE_FRAME]
    for (let i = 1; i < FRAME_COUNT; i++) {
      const diff = REACTION_FRAMES[i].reduce(
        (n, row, y) => n + [...row].filter((c, x) => c !== idle[y][x]).length, 0)
      expect(diff, `frame ${i} is identical to idle`).toBeGreaterThan(0)
    }
  })
})

describe('resting state', () => {
  it('sits on frame 0 before anything happens', () => {
    const { r } = harness()
    expect(r.frameAt()).toBe(IDLE_FRAME)
    expect(r.isPlaying()).toBe(false)
  })

  it('does not react to the first value it is told about', () => {
    const { r } = harness()
    expect(r.notify(0.5)).toBe(false)
    expect(r.isPlaying()).toBe(false)
  })
})

describe('playback completion', () => {
  it('plays every frame in order, once, then returns to idle', () => {
    const { r, advance } = harness()
    r.notify(0)
    expect(turn(r)).toBe(true)

    const seen = []
    for (let i = 0; i < FRAME_COUNT; i++) { seen.push(r.frameAt()); advance(FRAME_MS) }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    /* one frame past the end */
    expect(r.frameAt()).toBe(IDLE_FRAME)
    expect(r.isPlaying()).toBe(false)
  })

  it('never reports a frame outside the sheet', () => {
    const { r, advance } = harness()
    r.notify(0); turn(r)
    for (let i = 0; i < FRAME_COUNT * 3; i++) {
      const f = r.frameAt()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(FRAME_COUNT)
      advance(FRAME_MS / 2)
    }
  })

  it('can play again once it has finished', () => {
    const { r, advance } = harness()
    r.notify(0); expect(turn(r)).toBe(true)
    advance(FRAME_MS * FRAME_COUNT)
    expect(r.isPlaying()).toBe(false)
    expect(r.notify(1)).toBe(true)
  })
})

describe('rapid retriggering', () => {
  it('ignores the tiny deltas a pointer drag produces', () => {
    const { r } = harness()
    let v = 0
    r.notify(v)
    for (let i = 0; i < 20; i++) { v += 0.0005; expect(r.notify(v)).toBe(false) }
    expect(r.isPlaying()).toBe(false)
  })

  it('triggers once travel accumulates, not once per event', () => {
    const { r } = harness()
    let v = 0, fired = 0
    r.notify(v)
    /* a steady drag: 200 events, each a fifth of the threshold */
    for (let i = 0; i < 200; i++) { v += TRIGGER_THRESHOLD / 5; if (r.notify(v)) fired++ }
    expect(fired).toBe(1)
  })

  it('does not restart while already playing', () => {
    const { r, advance } = harness()
    r.notify(0)
    expect(turn(r)).toBe(true)
    advance(FRAME_MS * 3)
    expect(r.frameAt()).toBe(3)

    for (let i = 0; i < 50; i++) expect(r.notify(1 + i)).toBe(false)
    expect(r.frameAt()).toBe(3)              /* did not jump back to 0 */

    advance(FRAME_MS * (FRAME_COUNT - 3))
    expect(r.isPlaying()).toBe(false)
  })

  it('does not queue a second run for movement made during the first', () => {
    const { r, advance } = harness()
    r.notify(0); turn(r)
    let v = 1
    for (let i = 0; i < 30; i++) { v += TRIGGER_THRESHOLD; r.notify(v) }
    advance(FRAME_MS * FRAME_COUNT)
    expect(r.isPlaying()).toBe(false)
    expect(r.frameAt()).toBe(IDLE_FRAME)     /* rests, rather than immediately replaying */
  })

  it('an explicit trigger is also refused mid-run', () => {
    const { r, advance } = harness()
    expect(r.trigger()).toBe(true)
    advance(FRAME_MS * 2)
    expect(r.trigger()).toBe(false)
  })
})

describe('prefers-reduced-motion', () => {
  it('shows the idle frame and never plays', () => {
    const { r, advance } = harness({ reduced: true })
    r.notify(0)
    expect(turn(r)).toBe(false)
    expect(r.trigger()).toBe(false)
    advance(FRAME_MS * 4)
    expect(r.frameAt()).toBe(IDLE_FRAME)
    expect(r.isPlaying()).toBe(false)
  })

  it('drops to idle if the preference turns on mid-run', () => {
    const { r, media, advance } = harness()
    r.notify(0); turn(r)
    advance(FRAME_MS * 4)
    expect(r.frameAt()).toBe(4)

    media.emit(true)
    expect(r.reducedMotion).toBe(true)
    expect(r.frameAt()).toBe(IDLE_FRAME)
  })

  it('starts reacting again if the preference turns back off', () => {
    const { r, media } = harness({ reduced: true })
    r.notify(0)
    expect(turn(r)).toBe(false)
    media.emit(false)
    expect(r.notify(5)).toBe(true)
  })
})

describe('the idle breath', () => {
  /* Sample a long stretch of clock and ask what she was doing. */
  const survey = (r, span, step = 20) => {
    const seen = {}
    for (let t = 0; t < span; t += step) { const f = r.frameAt(t); seen[f] = (seen[f] || 0) + 1 }
    return seen
  }

  it('is off unless asked for, so a plain reaction stays a plain reaction', () => {
    const { r } = harness()
    const seen = survey(r, IDLE_EVERY_MS * 8)
    expect(Object.keys(seen)).toEqual([String(IDLE_FRAME)])
  })

  it('moves her occasionally when enabled', () => {
    const { r } = harness({ idle: true })
    const seen = survey(r, IDLE_EVERY_MS * 8)
    expect(Object.keys(seen).length).toBeGreaterThan(1)
  })

  it('leaves her at rest for most of the time', () => {
    const { r } = harness({ idle: true })
    const seen = survey(r, IDLE_EVERY_MS * 20)
    const total = Object.values(seen).reduce((a, b) => a + b, 0)
    expect(seen[IDLE_FRAME] / total).toBeGreaterThan(0.9)
  })

  it('breathes on the settle frame, not a dramatic one', () => {
    const { r } = harness({ idle: true })
    const seen = survey(r, IDLE_EVERY_MS * 8)
    for (const f of Object.keys(seen))
      expect(Number(f) === IDLE_FRAME || Number(f) === FRAME_COUNT - 1).toBe(true)
  })

  it('yields to a reaction — a run is never interrupted by a breath', () => {
    const { r, advance } = harness({ idle: true })
    r.notify(0); turn(r)
    const seen = []
    for (let i = 0; i < FRAME_COUNT; i++) { seen.push(r.frameAt()); advance(FRAME_MS) }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('does not breathe under reduced motion', () => {
    const { r } = harness({ idle: true, reduced: true })
    const seen = survey(r, IDLE_EVERY_MS * 8)
    expect(Object.keys(seen)).toEqual([String(IDLE_FRAME)])
  })

  it('stops breathing after dispose', () => {
    const { r } = harness({ idle: true })
    r.dispose()
    const seen = survey(r, IDLE_EVERY_MS * 8)
    expect(Object.keys(seen)).toEqual([String(IDLE_FRAME)])
  })
})

describe('cleanup', () => {
  it('releases the reduced-motion listener on dispose', () => {
    const { r, media } = harness()
    expect(media.handlers.size).toBe(1)
    r.dispose()
    expect(media.handlers.size).toBe(0)
  })

  it('cancels the frame callback on dispose', () => {
    const raf = vi.fn(() => 42)
    const caf = vi.fn()
    const { r } = harness({ raf, caf })
    r.subscribe(() => {})
    expect(raf).toHaveBeenCalled()
    r.dispose()
    expect(caf).toHaveBeenCalledWith(42)
  })

  it('cancels the frame callback when the last subscriber leaves', () => {
    const raf = vi.fn(() => 7)
    const caf = vi.fn()
    const { r } = harness({ raf, caf })
    const off1 = r.subscribe(() => {})
    const off2 = r.subscribe(() => {})
    off1()
    expect(caf).not.toHaveBeenCalled()      /* one subscriber left */
    off2()
    expect(caf).toHaveBeenCalledWith(7)
  })

  it('goes quiet after dispose', () => {
    const { r, advance } = harness()
    r.notify(0); turn(r)
    advance(FRAME_MS * 2)
    r.dispose()
    expect(r.frameAt()).toBe(IDLE_FRAME)
    expect(r.isPlaying()).toBe(false)
    expect(r.notify(99)).toBe(false)
    expect(r.trigger()).toBe(false)
  })

  it('is safe to dispose twice, and to subscribe after', () => {
    const caf = vi.fn()
    const { r } = harness({ raf: () => 1, caf })
    r.dispose()
    r.dispose()
    expect(caf).not.toHaveBeenCalled()      /* nothing was scheduled */
    expect(r.subscribe(() => {})).toBeInstanceOf(Function)
  })
})

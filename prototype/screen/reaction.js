/* When a Deck is turned, the Wizard reacts — once.
 *
 * The hard part is not playing ten frames. It is deciding *when*, because the
 * control that drives this is continuous: dragging a Deck calls `setVigil` on
 * every `pointermove`, dozens of times a second, each with a delta of a
 * thousandth. Reacting to each one would strobe. Reacting to none would make her
 * inert. So movement is accumulated and spent: turn far enough and she reacts,
 * and while she is reacting nothing can interrupt her.
 *
 * Nothing here draws, and nothing here owns a clock unless you ask it to —
 * `frameAt(now)` is a pure function of elapsed time, which is what lets the
 * Screen's existing rAF loop drive it for free and what makes it testable
 * without fake timers. `subscribe()` exists for a host that has no loop of its
 * own, and it is the only thing `dispose()` has to clean up besides the
 * reduced-motion listener.
 *
 * No dependency: the Screen already runs a frame loop and already draws with
 * whole `fillRect` blocks (ADR-0004).
 */

/** Milliseconds per frame. 90ms × 10 ≈ 0.9s — near the Cast's 0.85s, deliberately. */
export const FRAME_MS = 90
export const FRAME_COUNT = 10
export const IDLE_FRAME = 0

/**
 * How far a 0..1 control must travel, in total, before she notices. A Deck drag
 * crosses this in a fraction of a turn; a stray pointer jitter or a one-step
 * keyboard nudge on the slider never does.
 */
export const TRIGGER_THRESHOLD = 0.04

/* ---- the idle breath ----
   At rest she is not a still image. Every few seconds she moves once, briefly,
   and settles — so the Screen reads as inhabited rather than paused.

   The breath borrows the *settle* frame, not a dramatic one. That frame is the
   end of the reaction, where she has almost returned to rest, so it differs from
   the idle by the smallest amount any frame does. Using a mid-run frame would
   make her pull the full face every four seconds for no reason. */
export const IDLE_EVERY_MS = 4200
export const IDLE_HOLD_MS = 220
export const IDLE_JITTER_MS = 2600

/** Deterministic per-cycle scatter, so the breath is irregular but not random —
    the same clock always produces the same frame, which is what keeps it testable. */
const scatter = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; return (h >>> 0) }

const noMedia = { matches: false, addEventListener() {}, removeEventListener() {} }

function defaultMedia() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return noMedia
  try { return window.matchMedia('(prefers-reduced-motion: reduce)') } catch { return noMedia }
}

/**
 * @param {object} [o]
 * @param {number} [o.frameMs]      ms per frame
 * @param {number} [o.frameCount]   frames in the run
 * @param {number} [o.threshold]    accumulated travel needed to trigger
 * @param {() => number} [o.now]    clock, ms
 * @param {MediaQueryList} [o.media] reduced-motion query — injected in tests
 * @param {(cb: FrameRequestCallback) => number} [o.raf]
 * @param {(id: number) => void} [o.caf]
 * @param {boolean} [o.idle]        breathe at rest. Off by default: a host that
 *                                  asked for a reaction gets only a reaction.
 * @param {number} [o.idleFrame]    which frame the breath borrows
 * @param {number} [o.idleEveryMs]
 * @param {number} [o.idleHoldMs]
 * @param {number} [o.idleJitterMs]
 */
export function createKnobReaction(o = {}) {
  const frameMs = o.frameMs ?? FRAME_MS
  const frameCount = o.frameCount ?? FRAME_COUNT
  const threshold = o.threshold ?? TRIGGER_THRESHOLD
  const now = o.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()))
  const media = o.media ?? defaultMedia()
  const raf = o.raf ?? (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null)
  const caf = o.caf ?? (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : null)

  const idle = o.idle ?? false
  const idleFrame = o.idleFrame ?? (frameCount - 1)
  const idleEveryMs = o.idleEveryMs ?? IDLE_EVERY_MS
  const idleHoldMs = o.idleHoldMs ?? IDLE_HOLD_MS
  const idleJitterMs = o.idleJitterMs ?? IDLE_JITTER_MS

  const runMs = frameMs * frameCount
  let startedAt = -Infinity          /* -Infinity reads as "finished long ago" */
  let last = null                    /* last observed value; null until first notify */
  let travel = 0
  let disposed = false
  let rafId = null
  const listeners = new Set()

  let reduced = !!media.matches
  const onMediaChange = e => {
    reduced = !!e.matches
    if (reduced) startedAt = -Infinity   /* stop mid-run rather than freeze on frame 5 */
  }
  media.addEventListener?.('change', onMediaChange)

  const playing = t => t - startedAt < runMs

  const api = {
    /** True while a run is in progress. Always false under reduced motion. */
    isPlaying(t = now()) {
      return !disposed && !reduced && playing(t)
    },

    /**
     * The frame to draw. Idle unless a run is in progress — so a host can call
     * this every frame forever and get 0 for free.
     */
    frameAt(t = now()) {
      if (disposed || reduced) return IDLE_FRAME
      if (playing(t)) {
        const i = Math.floor((t - startedAt) / frameMs)
        return i < 0 ? IDLE_FRAME : Math.min(i, frameCount - 1)
      }
      /* At rest. A reaction always outranks the breath, so this is only reached
         when nothing is playing. */
      if (!idle) return IDLE_FRAME
      const cycle = Math.floor(t / idleEveryMs)
      const phase = t - cycle * idleEveryMs
      const offset = scatter(cycle) % idleJitterMs
      return phase >= offset && phase < offset + idleHoldMs ? idleFrame : IDLE_FRAME
    },

    /** True while the breath is showing — distinct from a reaction. */
    isBreathing(t = now()) {
      return !disposed && !reduced && idle && !playing(t) && api.frameAt(t) !== IDLE_FRAME
    },

    /**
     * Report the control's current value. Returns true only when this call is
     * what started a run.
     *
     * The first call sets the baseline and never triggers: a host that reports
     * its initial value on mount should not make her react to having been born.
     */
    notify(value, t = now()) {
      if (disposed || typeof value !== 'number' || Number.isNaN(value)) return false
      if (last === null) { last = value; return false }

      const delta = Math.abs(value - last)
      last = value

      /* Mid-run she is unavailable, and the travel spent getting here is spent —
         otherwise a long drag queues a second reaction the moment the first ends. */
      if (reduced || playing(t)) { travel = 0; return false }

      travel += delta
      if (travel < threshold) return false
      travel = 0
      startedAt = t
      return true
    },

    /** Start a run regardless of travel — for an explicit, discrete trigger. */
    trigger(t = now()) {
      if (disposed || reduced || playing(t)) return false
      travel = 0
      startedAt = t
      return true
    },

    /** Abandon the current run and return to idle. */
    reset() {
      startedAt = -Infinity
      travel = 0
    },

    get reducedMotion() { return reduced },

    /**
     * Drive `cb(frame)` from rAF, for a host without its own loop. The returned
     * function unsubscribes; `dispose()` also stops it.
     */
    subscribe(cb) {
      if (disposed || !raf) return () => {}
      listeners.add(cb)
      if (rafId === null) {
        const tick = () => {
          rafId = raf(tick)
          const f = api.frameAt()
          for (const l of listeners) l(f)
        }
        rafId = raf(tick)
      }
      return () => {
        listeners.delete(cb)
        if (listeners.size === 0 && rafId !== null && caf) { caf(rafId); rafId = null }
      }
    },

    /** Release the reduced-motion listener and any frame callback. Idempotent. */
    dispose() {
      if (disposed) return
      disposed = true
      media.removeEventListener?.('change', onMediaChange)
      if (rafId !== null && caf) caf(rafId)
      rafId = null
      listeners.clear()
      startedAt = -Infinity
    },

    get disposed() { return disposed },
  }
  return api
}

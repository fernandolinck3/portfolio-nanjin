/**
 * The opening: the Unit is found, then it is read.
 *
 * The visitor arrives on a raked three-quarter view — the angle at which the thing
 * reads as an *object*, with the candlesticks in profile and the Chassis showing
 * its depth — and then the camera settles to straight down, which is the angle at
 * which the Plate reads as a *panel* you can operate.
 *
 * That is the whole argument for the move. Top-down is the working view and it is
 * where this version stays; but arriving there directly gives away that the Plate
 * is flat, and never shows that any of it has thickness. Two seconds of travel
 * buys the object before the interface takes over.
 *
 * The Screen boots underneath it. The camera lands a beat *after* the display has
 * settled, so the last thing that happens is the Unit becoming legible rather than
 * the camera stopping.
 */

/** Where the visitor arrives, and where they end up. */
/**
 * Where the visitor arrives, and where they end up.
 *
 * **Straight on, not from the corner.** The yaw was -9, so the move swung sideways
 * as well as down and the Unit appeared to rotate under the camera. Squared up,
 * the whole opening is a single axis — the view tips forward onto the Plate and
 * nothing else changes, which reads as a machine being leaned over rather than a
 * camera being flown.
 *
 * Both distances pulled in. At 8.4 and 7.4 the Plate was about two thirds of the
 * frame and the rest was table, candlesticks and floor; the Unit is the subject, so
 * it now fills closer to four fifths and the Altar is an edge rather than a stage.
 */
/**
 * Opening tilt is 18, and both numbers were found by projection rather than by eye.
 *
 * At 38 the top of the frame landed at z = -4.46 while the desk's back edge is at
 * -4.3 — the arrival looked *past* the wood into the emptiness where the room used
 * to be. Dropping to 26 fixed the void and still caught the back candlestick,
 * whose top projected to ndc.y 0.97 with the frame edge at 1.0: inside by three
 * hundredths, which is exactly the kind of miss that eyeballing an angle produces.
 *
 * The candle clears at 22 and has margin by 18. The top of frame lands at z=-2.78,
 * comfortably on the desk.
 *
 * 18 off vertical is still a raked view — the Chassis shows its depth and the
 * Plate is seen at an angle — it simply contains nothing but the object.
 */
export const OPEN = { tilt: 18, dist: 6.4, yaw: 0 }
export const REST = { tilt: 6, dist: 5.6, yaw: 0 }

/**
 * Seconds. The Screen's own boot is timed against this, not the other way round.
 *
 * 2.5 was quick enough to read as a transition rather than an arrival — the name
 * had barely finished typing before the camera had landed. Four seconds lets the
 * self-test actually count itself, and the hold at the top gives the visitor a
 * moment to see the object before anything moves.
 */
/**
 * The camera and the boot no longer share a clock.
 *
 * They were locked together — the Screen's power-on was driven off the camera's
 * own progress — so every request to change one changed the other. Slowing the
 * move to let the self-test count itself also made the flight ponderous, and
 * speeding the flight up would have thrown the boot away with it.
 *
 * Two durations now. The camera settles in `TRAVEL`; the Screen takes `BOOT`,
 * which is longer, so the machine is still finishing as the view comes to rest.
 * That is the right way round anyway: the camera stops, and then the last of the
 * self-test runs in front of you.
 */
const TRAVEL = 3.0
/**
 * 1.7, not 5.2.
 *
 * `HOLD + BOOT` is the whole of the wait: nothing on the Screen is legible until the
 * boot clears. It was 5.9 seconds on every load, against an audience `PRODUCT.md`
 * describes as recruiters with ten to thirty. Between a fifth and three fifths of the
 * attention this object gets was spent watching a percentage count itself.
 *
 * The four beats are unchanged and keep their proportions — they are all cut from `k`,
 * so the tube still snaps, opens, names itself and settles, at speed. What goes is the
 * dwell, which was never the part anyone was reading.
 *
 * `TRAVEL` is deliberately not cut (T-21 says so, and it is right): the flight is the
 * part that reads as craft, the boot is the part that reads as waiting. The
 * consequence is that the machine now finishes *before* the camera lands rather than
 * after — the Screen is readable at 2.5s while the object is still settling around it,
 * which is a better order for someone in a hurry and no worse for anyone else.
 *
 * 1.7 and not the 1.8 the ticket suggested, for one boring reason: `HOLD + BOOT` is
 * the number the ticket actually measures, it asks for *under* 2.5, and 0.7 + 1.8 is
 * exactly 2.5. `intro.test.js` asserts the sum rather than either part, so whoever
 * retunes these two next is told immediately if the pair stops clearing the bar.
 */
const BOOT = 1.7
const HOLD = 0.7

/**
 * A second load in the same session plays the opening at speed, rather than not at all.
 *
 * The once-per-session skip existed, was removed, and the reasoning written down for
 * removing it was that "the boot *is* the arrival, it is under three seconds". It was
 * 5.9. The other half of that argument still holds and is why this is not a skip:
 * whoever is building this reloads constantly, and a hard skip means they never see
 * the thing they are working on again.
 *
 * So a repeat gets the same four beats at 0.42x — about a second, still recognisably
 * the object switching on. `sessionStorage`, not `localStorage`: someone coming back
 * tomorrow is arriving, not returning.
 */
const REPEAT = 0.42
const SEEN_KEY = 'tenebrae.opened'

/* Slow in, slow out, and longer on the tail — a camera that stops abruptly reads
   as a cut. `easeInOutCubic` weighted toward the end. */
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a, b, t) => a + (b - a) * t

/**
 * @param apply  called with {tilt, dist, yaw} every frame of the move
 * @param onBoot 0 → 1 across the Screen's power-on, which leads the camera
 */
export function createIntro({ apply, onBoot, waitFor }) {
  /* The opening will not begin travelling until this settles — see `waitFor` in
     scene.js. Until then it holds on the arrival pose, which is exactly what the
     hold is for anyway. */
  let ready = !waitFor
  waitFor?.then(() => { ready = true })
  let t = 0
  let done = false

  /* Private mode and blocked storage both throw rather than return null, and neither
     is a reason to refuse someone the opening. */
  let repeat = false
  try {
    repeat = sessionStorage.getItem(SEEN_KEY) === '1'
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch { /* no storage, every load is a first load */ }

  /* Held on the instance so `replay()` can put them back: asking to see it again
     means asking to see it, not to see it hurried. */
  let hold = repeat ? HOLD * REPEAT : HOLD
  let travel = repeat ? TRAVEL * REPEAT : TRAVEL
  let boot = repeat ? BOOT * REPEAT : BOOT
  /**
   * It plays every load.
   *
   * It used to skip after the first time in a session, on the reasoning that a
   * visitor reloading mid-thought does not want the film again. That is true of a
   * film and wrong here: the boot *is* the arrival, it is under three seconds, and
   * a click skips it. It also meant that anyone reloading to look at their own
   * changes — which is everyone building this — never saw it again.
   */
  apply(OPEN)
  onBoot?.(0)

  function finish() {
    done = true
    apply(REST)
    onBoot?.(1)
  }

  return {
    get running() { return !done },

    /** Called once a frame until it reports it is finished. */
    update(dt) {
      if (done) return false
      /* hold, and keep holding while the Plate is still assembling itself */
      if (!ready) { apply(OPEN); onBoot?.(0); return true }
      t += dt
      if (t < hold) { apply(OPEN); onBoot?.(0); return true }

      const since = t - hold

      /* the flight */
      const k = Math.min(1, since / travel)
      const e = ease(k)
      apply({
        tilt: lerp(OPEN.tilt, REST.tilt, e),
        dist: lerp(OPEN.dist, REST.dist, e),
        yaw: lerp(OPEN.yaw, REST.yaw, e),
      })

      /* the machine, on its own clock */
      const b = Math.min(1, since / boot)
      onBoot?.(b)

      /* not done until both are */
      if (k >= 1 && b >= 1) finish()
      return true
    },

    /** Any deliberate input ends it — nobody should have to sit through this. */
    skip() { if (!done) finish() },

    /**
     * Run it again from the top, in place.
     *
     * Clearing the session flag and asking for a reload would work and is worse to
     * develop against: a reload rebuilds every texture in the scene, which is the
     * seven seconds this project already knows about. This just rewinds.
     */
    replay() {
      t = 0
      done = false
      hold = HOLD; travel = TRAVEL; boot = BOOT
      apply(OPEN)
      onBoot?.(0)
    },
  }
}

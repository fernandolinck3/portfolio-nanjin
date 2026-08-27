/**
 * The room's light, as one number, owned in one place.
 *
 * Three Candles go out one at a time as the Vigil rises. Their ramps used to be
 * written in `scene.js` (which dims the rig) and their last frame in `screen.js`
 * (which chose the Face) — two files agreeing by hand about the same three pairs
 * of numbers. They now both read this.
 *
 * That matters because the Screen no longer switches at a threshold. It travels:
 * the palette, the celestial gauge and Lyra's own tones are all driven by how
 * much candlelight is actually left in the room, so the Screen darkens on exactly
 * the schedule the Altar darkens on. If a ramp moves, everything moves together.
 */

/**
 * When each Candle dies, as a span of the Vigil. Ordered — `RAMPS[0]` is the
 * first to go out, `RAMPS[2]` the last. They overlap on purpose: the room never
 * drops in three visible steps, it slides.
 */
export const RAMPS = [[0.0, 0.34], [0.28, 0.62], [0.56, 0.94]]

/** 1 while the Candle burns, 0 once it is out. */
export const candle = (v, from, to) => 1 - Math.min(1, Math.max(0, (v - from) / (to - from)))

/**
 * The Vigil at which the last Candle dies and the Screen's phosphor is the only
 * source left in the room. Derived, never typed twice.
 */
export const LAST_CANDLE_OUT = RAMPS[2][1]

/** How much of the three Candles' light is still burning, 1 → 0. */
export const candlelight = v =>
  (candle(v, ...RAMPS[0]) + candle(v, ...RAMPS[1]) + candle(v, ...RAMPS[2])) / 3

/**
 * How far into the night the room has travelled, 0 → 1.
 *
 * 0 at full light, 1 exactly when the last Candle dies. This is the Screen's
 * master dial: it reaches its end at `LAST_CANDLE_OUT` rather than at Vigil 1,
 * so the Screen finishes becoming night at the same instant the room does.
 */
export const dusk = v => 1 - candlelight(v)

/* The familiar.

   A creature that lives on the Screen and is present in every Module — it walks
   the bottom rule the way a hare or a hound walks the margin of a manuscript.
   It is not a widget in a corner: it shares the page with the content, notices
   when the Module changes, and goes to look at what arrived.

   Deliberately NOT a tamagotchi with needs. It has moods, not demands: nothing
   it does can be neglected, nothing it does asks the visitor for anything. A
   creature that needs feeding would compete with the Module for attention, and
   the Module is the thing that has to get Fernando hired.

   Procedural like every other mark on the Unit (ADR-0004). */

import { disc } from './sprites.js'

/* ---------- the three candidates ---------- */

/** A moth. Drawn to the flame, which is the one thing this Unit has plenty of. */
function moth(g, x, y, t, s, ink, dim) {
  const flap = s.moving ? Math.sin(t * 22) : Math.sin(t * 3) * .25
  const span = Math.round(4 + Math.abs(flap) * 4)
  const f = s.facing
  g.fillStyle = dim
  /* wings: two wedges that beat out of phase with the body */
  for (let i = 0; i < span; i++) {
    const h = Math.round(4 * (1 - i / span)) + 1
    g.fillRect(x - 2 - i, y - h, 1, h * 2)
    g.fillRect(x + 2 + i, y - h, 1, h * 2)
  }
  g.fillStyle = ink
  g.fillRect(x - 1, y - 4, 3, 8)                    /* furry body */
  disc(g, x, y - 5, 2)                              /* head */
  g.fillRect(x + f, y - 8, 1, 2)                    /* antennae */
  g.fillRect(x - f, y - 8, 1, 2)
  if (!s.blink) { g.fillStyle = dim; g.fillRect(x + f, y - 6, 1, 1) }
}

/** A hare. Every medieval margin has one, usually doing something it should not. */
function hare(g, x, y, t, s, ink, dim) {
  const f = s.facing
  const hop = s.moving ? Math.abs(Math.sin(t * 9)) * 4 : 0
  const yy = y - hop
  const ear = s.alert ? 0 : Math.round(Math.sin(t * 2.2) * 1)
  g.fillStyle = dim; disc(g, x - f * 2, yy - 4, 4)                  /* haunch */
  g.fillStyle = ink
  g.fillRect(x - 4, yy - 6, 9, 5)                                   /* body */
  disc(g, x + f * 4, yy - 8, 3)                                     /* head */
  g.fillRect(x + f * 3, yy - 14 + ear, 1, 5)                        /* ears */
  g.fillRect(x + f * 5, yy - 13, 1, 4)
  g.fillRect(x - f * 5, yy - 5, 2, 2)                               /* scut */
  if (!s.moving) { g.fillRect(x + f * 2, yy - 2, 1, 2); g.fillRect(x - f, yy - 2, 1, 2) }
  else { g.fillRect(x + f * 3, yy - 2, 1, 2); g.fillRect(x - f * 2, yy - 2, 1, 2) }
  if (!s.blink) { g.fillStyle = dim; g.fillRect(x + f * 5, yy - 9, 1, 1) }
}

/** A raven. Tilts its head at whatever you just pressed. */
function raven(g, x, y, t, s, ink, dim) {
  const f = s.facing
  const hop = s.moving ? Math.abs(Math.sin(t * 8)) * 3 : 0
  const yy = y - hop
  const tilt = s.alert ? Math.round(Math.sin(t * 4) * 1) : 0
  g.fillStyle = ink
  g.fillRect(x - 5, yy - 7, 10, 6)                                  /* body */
  disc(g, x + f * 5, yy - 9 + tilt, 3)                              /* head */
  g.fillRect(x + f * 8, yy - 9 + tilt, 3, 1)                        /* beak */
  g.fillStyle = dim
  for (let i = 0; i < 6; i++) g.fillRect(x - 5 - i, yy - 6 + Math.round(i / 2), 1, 3)  /* tail */
  if (s.moving) { g.fillStyle = ink; g.fillRect(x - 2, yy - 9, 5, 2) }                 /* wing lift */
  g.fillStyle = ink
  g.fillRect(x - 1, yy - 1, 1, 2); g.fillRect(x + 2, yy - 1, 1, 2)  /* legs */
  if (!s.blink) { g.fillStyle = dim; g.fillRect(x + f * 6, yy - 10 + tilt, 1, 1) }
}

export const PETS = { moth, hare, raven }

/* ---------- behaviour ---------- */

/* One creature, one state. It wanders, it stops, it notices. */
const state = {
  x: 60, target: 60, facing: 1, moving: false, alert: 0, blink: false,
  nextMove: 0, nextBlink: 0,
}

/** Called when the Module changes: the familiar goes and looks at what arrived. */
export function startle(bounds) {
  state.alert = 1.6
  state.target = bounds.lo + Math.random() * (bounds.hi - bounds.lo)
  state.nextMove = 3 + Math.random() * 4
}

export function updatePet(dt, t, bounds) {
  state.alert = Math.max(0, state.alert - dt)

  /* blink: brief, irregular, never on a beat */
  if (t > state.nextBlink) { state.blink = true; state.nextBlink = t + .12 }
  else if (state.blink && t > state.nextBlink) state.blink = false
  if (state.blink && t > state.nextBlink - .06) { state.blink = false; state.nextBlink = t + 2 + Math.random() * 4 }

  /* wander */
  if (t > state.nextMove && !state.moving) {
    state.target = bounds.lo + Math.random() * (bounds.hi - bounds.lo)
    state.nextMove = t + 3 + Math.random() * 5
  }
  const d = state.target - state.x
  state.moving = Math.abs(d) > 1.5
  if (state.moving) {
    state.facing = d > 0 ? 1 : -1
    state.x += Math.sign(d) * Math.min(Math.abs(d), dt * (state.alert > 0 ? 46 : 20))
  }
  state.x = Math.max(bounds.lo, Math.min(bounds.hi, state.x))
  return state
}

export function drawPet(g, kind, y, t, ink, dim) {
  PETS[kind](g, Math.round(state.x), y, t, state, ink, dim)
  /* when it has just noticed something, it looks up at the content */
  if (state.alert > .9 && Math.floor(t * 6) % 2) {
    g.fillStyle = ink
    g.fillRect(Math.round(state.x) + state.facing * 4, y - 20, 1, 1)
    g.fillRect(Math.round(state.x) + state.facing * 5, y - 22, 1, 1)
  }
}

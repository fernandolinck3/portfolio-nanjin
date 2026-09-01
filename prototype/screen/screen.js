/* Screen design workbench.
   The Screen itself lives in `render.js` — this file is only the bench it sits
   on: two canvases, the buttons, and a clock. It exists so the Screen can be
   judged at 1x, which is roughly how wide it draws on the Plate, without having
   to find it inside the 3D room first.

   Whatever this shows, the Unit shows. That is the point of the split: there is
   one Screen renderer now, not two that drift. */
import {
  buffer, render, SCREEN_W, SCREEN_H, setBoot,
  setModule, setVigil, setCrossfade, setFigure, setBust, triggerReaction,
  disposeReaction, currentFace,
} from './render.js'

/* This page is the Screen on a bench, with no opening to wait for. `render.js` now
   starts dark so the Unit cannot flash a Module before its power-on; the bench says
   otherwise for itself. */
setBoot(1)
import { BUST, BUST_PREV } from './drawn.js'

const big = document.getElementById('big').getContext('2d')
const real = document.getElementById('real').getContext('2d')
big.imageSmoothingEnabled = real.imageSmoothingEnabled = false

let last = 0
function frame(now) {
  const t = now / 1000
  const dt = Math.min(.05, last ? t - last : 0); last = t
  render(t, dt)
  big.clearRect(0, 0, 960, 540); big.drawImage(buffer, 0, 0, 960, 540)
  real.clearRect(0, 0, SCREEN_W, SCREEN_H); real.drawImage(buffer, 0, 0)
  requestAnimationFrame(frame)
}

function press(attr, apply) {
  document.querySelectorAll('[data-' + attr + ']').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-' + attr + ']').forEach(o =>
        o.setAttribute('aria-pressed', String(o === b)))
      apply(b.dataset[attr])
    })
  })
}
press('mod', v => setModule(+v))
press('xf', v => setCrossfade(+v))
press('fig', v => setFigure(v))
press('bust', v => setBust(v === 'prev' ? BUST_PREV : BUST))

/* The Vigil slider stands in for a Deck: it fires on every input event, in small
   steps, which is exactly the signal the reaction is built to ignore until it
   adds up. */
const vigilEl = document.getElementById('vigil')
const faceEl = document.getElementById('face')
const showFace = () => { if (faceEl) faceEl.textContent = currentFace().toUpperCase() }
showFace()
if (vigilEl) vigilEl.addEventListener('input', () => {
  setVigil(+vigilEl.value / 100)
  showFace()
})
const trigEl = document.getElementById('trigger')
if (trigEl) trigEl.addEventListener('click', () => triggerReaction())

/* The page lives as long as the tab does, but the reaction owns a reduced-motion
   listener, so it gets released with the page all the same. */
addEventListener('pagehide', () => disposeReaction(), { once: true })

/* An unused family silently falls back, and document.fonts.ready will not load a
   face nothing has asked for. Ask for each one by name. */
Promise.all([
  document.fonts.load('8px Silkscreen'), document.fonts.load('13px VT323'),
  document.fonts.load('22px UnifrakturMaguntia'), document.fonts.load('17px UnifrakturMaguntia'),
  /* the boot screen borrows this face for the single `k` in the surname */
  document.fonts.load('19px "Grenze Gotisch"'),
]).then(() => requestAnimationFrame(frame))

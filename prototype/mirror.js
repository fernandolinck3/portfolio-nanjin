/**
 * The mirror, as a thing in a page.
 *
 * `src/content/mirror.ts` writes the markup and knows nothing about a browser.
 * This file owns the half that needs one: the node, the clip that hides it from the
 * eye without hiding it from anything else, the state that follows the Screen, and
 * the one polite live region that reports what changed.
 *
 * The split is the point. The text can then be checked in `node`, in the same suite
 * that already guards the content, and this file can be checked in jsdom without
 * standing up three, a canvas and a WebGL context first.
 *
 * ## The markup usually arrives before this file does
 *
 * Since `T-26` the build calls the very same renderer and writes the mirror into
 * `dist-site/index.html` — a screen reader ran the JS and saw the content, but an
 * ATS does not run JS and saw 469 characters of dial readouts. So the first thing
 * `createMirror` does is **look for a mirror that is already there and adopt it**.
 * It renders only when it finds none. There is no second copy of the markup on
 * either path; both call `mirrorElementHTML()`.
 *
 * ## What "hidden" is allowed to mean here
 *
 * **Not `display:none`, not `visibility:hidden`, not the `hidden` attribute** — each
 * of the three removes text from find-in-page, and find-in-page is half of why this
 * exists. The mirror is a 1px box with `overflow:hidden`: laid out, measured,
 * searchable, read by every screen reader, and invisible.
 *
 * The one exception is ECLIPSE, which uses `hidden` deliberately, because a secret
 * that Ctrl+F hands over on arrival is not a secret. See `mirror.ts`.
 *
 * ## Why a focused control comes back into view
 *
 * A tab stop nobody can see is a trap for a sighted keyboard user, and this page
 * already solved that one landmark over: `.sr button` in `index.html` is clipped
 * until it takes focus. The same courtesy here, by a different mechanism —
 * `position:fixed` escapes an ancestor's `overflow:hidden`, which is exactly why the
 * mirror is mounted on `<body>` and **not inside `#frame`**: `#frame` carries a
 * transform on a phone, and a transformed ancestor is a containing block for fixed
 * descendants, which would put the clip back.
 */
import {
  HOOK, MIRROR_CSS, MIRROR_ID, MIRROR_STYLE_ID, itemKey, mirrorElementHTML,
} from '../src/content/mirror.ts'
import { MODULES } from '../src/content/modules.ts'

/**
 * How long an announcement waits for the hand to stop moving.
 *
 * The same instinct as `trackSettled` in `track.js`, for the same reason: a wheel
 * crossing a five-item list fires five times, and a live region that reads each one
 * produces a paragraph where the visitor asked for a position. Only where the hand
 * came to rest is worth saying.
 */
const SETTLE_MS = 400

/**
 * Build the mirror and hand back the two things a caller needs: where it is, and
 * how to tell it what the instrument is doing.
 *
 * `onItem(m, i)` is the only callback that carries an address, because it is the
 * only control that can point at something outside the live Module — a screen
 * reader can reach the eleventh item of a Module nobody has opened, and clicking it
 * has to mean "go there", not "select an index in whatever happens to be up".
 */
export function createMirror({
  doc = document, onItem, onBack, onReopen, onClaim,
} = {}) {
  /**
   * Adopt what the build already wrote, and only build it when nobody did.
   *
   * `vite.site.config.ts` runs `mirrorIntoPage` over `index.html`, so on the
   * shipped page the sheet and the `<main>` are already in the document before this
   * module is even fetched — which is the whole of `T-26`, because an applicant
   * tracking system reads that HTML and never runs this file. Re-rendering here
   * would replace a live node with an identical one for nothing, and appending
   * would put **two copies** of the portfolio in the page.
   *
   * So: find them, and fall back to writing them. The fallback is not dead code —
   * it is the path every jsdom test takes, and the path any page that embeds the
   * mirror without the build takes.
   */
  if (!doc.getElementById(MIRROR_STYLE_ID)) {
    const style = doc.createElement('style')
    style.id = MIRROR_STYLE_ID
    style.textContent = MIRROR_CSS
    doc.head.appendChild(style)
  }

  let el = doc.getElementById(MIRROR_ID)
  if (!el) {
    /* through a template so the `<main id=…>` wrapper is written in exactly one
       place — `mirrorElementHTML` — rather than here and again in the build */
    const t = doc.createElement('template')
    t.innerHTML = mirrorElementHTML()
    el = t.content.firstElementChild
    doc.body.appendChild(el)
  }

  const one = sel => el.querySelector(sel)
  const live = one(`[${HOOK.live}]`)
  const statusEl = one(`[${HOOK.status}]`)
  const posEl = one(`[${HOOK.position}]`)
  const lightEl = one(`[${HOOK.light}]`)
  const lyraEl = one(`[${HOOK.lyra}]`)
  const backEl = one(`[${HOOK.back}]`)
  const reopenEl = one(`[${HOOK.reopen}]`)
  const claimEl = one(`[${HOOK.claim}]`)
  const eclipseEl = one(`[${HOOK.eclipse}]`)
  const sections = [...el.querySelectorAll(`[${HOOK.module}]`)]
  const buttons = [...el.querySelectorAll(`[${HOOK.item}]`)]

  for (const b of buttons) {
    b.addEventListener('click', () => {
      const [m, i] = b.getAttribute(HOOK.item).split('.').map(Number)
      onItem?.(m, i)
    })
  }
  backEl?.addEventListener('click', () => onBack?.())
  reopenEl?.addEventListener('click', () => onReopen?.())
  /* the claim is a real link and navigates by itself; the callback is only so the
     one event worth counting is counted — see `track.js` */
  claimEl?.addEventListener('click', () => onClaim?.())

  /** Writing the same string back costs a style invalidation for nothing. */
  const setText = (node, s) => { if (node && node.textContent !== s) node.textContent = s }
  const setHidden = (node, on) => { if (node && node.hidden !== on) node.hidden = on }

  let prev = null
  let pending = 0

  /**
   * Say one thing, once.
   *
   * Every call cancels the one before it, so a hand crossing a list leaves exactly
   * one announcement — the row it stopped on. `ms = 0` is for a Pad press, which is
   * a single deliberate act and has nothing to settle.
   */
  function say(text, ms) {
    clearTimeout(pending)
    if (!ms) { setText(live, text); return }
    pending = setTimeout(() => setText(live, text), ms)
  }

  /** The line the position readout carries — and nothing when there is no position. */
  function positionOf(s) {
    const m = MODULES[s.page]
    const n = m.items?.length || 0
    if (!n) return ''
    const where = `${m.unit} ${s.sel + 1} de ${n}`
    /* `pages` is written by the last draw and is 0 before the first paint, so the
       page half of the line appears only once there is a page to report */
    if (s.sec > 0 && s.pages) return `${where} · página ${s.sec} de ${s.pages}`
    return `${where} · índice`
  }

  /**
   * Follow the instrument.
   *
   * Cheap to call from anywhere, including every frame: the signature short-circuits
   * a state that has not moved, so the callers do not have to know whether they
   * changed anything.
   */
  function sync(s) {
    const sig = JSON.stringify(s)
    if (sig === prev?.sig) return
    const was = prev?.s
    prev = { sig, s }

    for (const [i, sec] of sections.entries()) {
      if (i === s.page) sec.setAttribute('aria-current', 'true')
      else sec.removeAttribute('aria-current')
    }
    for (const b of buttons) {
      const key = b.getAttribute(HOOK.item)
      const live_ = key.startsWith(`${s.page}.`)
      /* the other Modules' items stay in the document and stay reachable by a
         screen reader; they simply stop being Tab stops for an eye that cannot see
         where Tab went */
      b.tabIndex = live_ ? 0 : -1
      if (key === itemKey(s.page, s.sel)) b.setAttribute('aria-current', 'true')
      else b.removeAttribute('aria-current')
    }

    setText(statusEl, s.status || '')
    setText(posEl, positionOf(s))
    setText(lightEl, s.light || '')
    setText(lyraEl, s.lyra || '')

    setHidden(backEl, !s.back)
    setHidden(reopenEl, !s.reopen)
    setHidden(eclipseEl, !s.eclipseOpen)
    /* the prize appears with the screen that awards it, and sits with the other two
       controls rather than at the end of the document — see `stateHTML` */
    setHidden(claimEl, !s.eclipseOpen)

    if (!was) return
    /**
     * One announcement, for the one thing that changed.
     *
     * The order is the order of magnitude: a new Module makes the item and the page
     * underneath it new as well, and reading all three is reading the screen out
     * loud — which is the failure this whole region is shaped to avoid.
     */
    const m = MODULES[s.page]
    const it = m.items?.[s.sel]
    if (s.page !== was.page) say(m.title, 0)
    else if (s.eclipseOpen !== was.eclipseOpen) say(s.eclipseOpen ? 'Eclipse' : m.title, 0)
    else if (s.sel !== was.sel && it) {
      say(`${it.label}, ${m.unit} ${s.sel + 1} de ${m.items.length}`, SETTLE_MS)
    } else if (s.sec !== was.sec) {
      say(s.sec > 0 && s.pages ? `Página ${s.sec} de ${s.pages}` : 'Índice', SETTLE_MS)
    }
  }

  return { el, sync }
}

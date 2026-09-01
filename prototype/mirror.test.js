/**
 * @vitest-environment jsdom
 *
 * The mirror's browser half. The *text* is asserted in `src/content/modules.test.ts`,
 * in node, against a string — this is only the part that needs a document: which
 * element is current, which controls are Tab stops, and what the live region says.
 *
 * jsdom costs about 400ms to stand up here, which is why the content suite does not
 * pay it and this one does. Everything below drives `sync()` directly rather than
 * through `scene.js`, for the reason the ticket gives: `rAF` fires zero times in an
 * automated tab, so anything that can only be seen by watching an animation cannot
 * be verified at all. State in, DOM out.
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMirror } from './mirror.js'
import { HOOK, MIRROR_ID, MIRROR_STYLE_ID, mirrorIntoPage } from '../src/content/mirror.ts'
import { MODULES } from '../src/content/modules.ts'

/** A whole state, so a test only has to say the part it is about. */
const S = o => ({
  page: 0, sel: 0, sec: 0, pages: 0, focus: false, eclipseOpen: false,
  back: false, reopen: false, status: '', lyra: '', light: '', ...o,
})

let mirror
beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  mirror = createMirror({})
})

const el = () => mirror.el
const section = i => el().querySelector(`[${HOOK.module}="${i}"]`)
const button = (m, i) => el().querySelector(`[${HOOK.item}="${m}.${i}"]`)
const live = () => el().querySelector(`[${HOOK.live}]`).textContent
const current = () => el().querySelector(`[${HOOK.module}][aria-current]`)

describe('the mirror in a document', () => {
  it('mounts on the body, outside the frame that a phone rotates', () => {
    /* `#frame` carries a transform in portrait, and a transformed ancestor is a
       containing block for fixed descendants — which would put the clip back over a
       focused control. See the note at the top of `mirror.js`. */
    expect(el().parentElement).toBe(document.body)
    expect(el().tagName).toBe('MAIN')
  })

  it('keeps all six Modules in the document at all times', () => {
    mirror.sync(S({ page: 1 }))
    for (const [i, m] of MODULES.entries()) {
      const sec = section(i)
      expect(sec).not.toBeNull()
      expect(sec.hidden).toBe(false)
      expect(sec.textContent).toContain(m.title)
    }
  })

  /**
   * The assertion the ticket asks for by name: the mirror's title has to match what
   * `__unit.nav()` reports after a Pad press. `sync` is fed exactly the object that
   * function returns, so this is that check with the scene lifted out of it.
   */
  it('names the Module the navigation says is live', () => {
    for (const [i, m] of MODULES.entries()) {
      mirror.sync(S({ page: i }))
      expect(current()).toBe(section(i))
      expect(current().querySelector('h2').textContent).toBe(m.title)
    }
  })

  it('follows the selection with aria-current', () => {
    mirror.sync(S({ page: 3, sel: 2 }))
    expect(button(3, 2).getAttribute('aria-current')).toBe('true')
    expect(button(3, 1).hasAttribute('aria-current')).toBe(false)

    mirror.sync(S({ page: 3, sel: 4 }))
    expect(button(3, 4).getAttribute('aria-current')).toBe('true')
    expect(button(3, 2).hasAttribute('aria-current')).toBe(false)
  })

  /**
   * Present for a screen reader, absent from the Tab order.
   *
   * Seventeen items live in the document so find-in-page can reach them. Making all
   * seventeen Tab stops would strand a sighted keyboard user in controls they cannot
   * see, so only the live Module's are focusable.
   */
  it('makes only the live Module tabbable', () => {
    mirror.sync(S({ page: 1 }))
    expect(button(1, 0).tabIndex).toBe(0)
    expect(button(3, 0).tabIndex).toBe(-1)
    mirror.sync(S({ page: 3 }))
    expect(button(1, 0).tabIndex).toBe(-1)
    expect(button(3, 0).tabIndex).toBe(0)
  })

  it('reports the page position as text, and says nothing before the first draw', () => {
    const pos = () => el().querySelector(`[${HOOK.position}]`).textContent
    mirror.sync(S({ page: 1, sel: 1 }))
    expect(pos()).toBe('PROJETO 2 de 3 · índice')
    /* `pages` is written by the draw and is 0 until it has run — a position of
       "página 1 de 0" is worse than no position */
    mirror.sync(S({ page: 1, sel: 1, sec: 1, pages: 0 }))
    expect(pos()).toBe('PROJETO 2 de 3 · índice')
    mirror.sync(S({ page: 1, sel: 1, sec: 2, pages: 6 }))
    expect(pos()).toBe('PROJETO 2 de 3 · página 2 de 6')
    /* QUEM has no list, and the honest report of no position is no position */
    mirror.sync(S({ page: 0 }))
    expect(pos()).toBe('')
  })

  it('carries the Screen’s own lines rather than composing its own', () => {
    mirror.sync(S({ status: 'PROJETO 02/03 · GRAECUS', lyra: 'Mande o corvo.', light: 'NOITE · 0%' }))
    expect(el().querySelector(`[${HOOK.status}]`).textContent).toBe('PROJETO 02/03 · GRAECUS')
    expect(el().querySelector(`[${HOOK.lyra}]`).textContent).toBe('Mande o corvo.')
    expect(el().querySelector(`[${HOOK.light}]`).textContent).toBe('NOITE · 0%')
  })

  it('shows the three controls that had no twin only when the Screen paints them', () => {
    const back = el().querySelector(`[${HOOK.back}]`)
    const reopen = el().querySelector(`[${HOOK.reopen}]`)
    const eclipse = el().querySelector(`[${HOOK.eclipse}]`)
    mirror.sync(S({}))
    expect(back.hidden).toBe(true)
    expect(reopen.hidden).toBe(true)
    expect(eclipse.hidden).toBe(true)

    mirror.sync(S({ back: true, reopen: true, eclipseOpen: true }))
    expect(back.hidden).toBe(false)
    expect(reopen.hidden).toBe(false)
    expect(eclipse.hidden).toBe(false)
    /* the prize for finding the secret, and the whole of T-15: a real link */
    expect(el().querySelector(`[${HOOK.claim}]`).getAttribute('href'))
      .toBe('https://instagram.com/nan._.jin')
  })

  it('hands a row press the address of the row, not of the live Module', () => {
    const seen = []
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    const m = createMirror({ onItem: (a, b) => seen.push([a, b]) })
    m.sync(S({ page: 1 }))
    /* a screen reader can reach the fourth criterion while PROJETOS is live */
    m.el.querySelector(`[${HOOK.item}="3.3"]`).click()
    expect(seen).toEqual([[3, 3]])
  })
})

describe('the announcements', () => {
  beforeEach(() => vi.useFakeTimers())

  it('says nothing on the first sync', () => {
    mirror.sync(S({ page: 2, sel: 1 }))
    vi.runAllTimers()
    expect(live()).toBe('')
  })

  it('announces a Module change at once', () => {
    mirror.sync(S({ page: 0 }))
    mirror.sync(S({ page: 1 }))
    expect(live()).toBe('PROJETOS')
  })

  /**
   * The reason the settle guard exists. A hand dragging the MOON across a list calls
   * `sync` once per detent; a live region that reads each one turns a five-item list
   * into a paragraph. Only where the wheel came to rest is worth saying — the same
   * instinct `trackSettled` applies to the analytics.
   */
  it('announces only where a wheel came to rest', () => {
    mirror.sync(S({ page: 3, sel: 0 }))
    mirror.sync(S({ page: 3, sel: 1 }))
    mirror.sync(S({ page: 3, sel: 2 }))
    mirror.sync(S({ page: 3, sel: 3 }))
    expect(live()).toBe('')
    vi.runAllTimers()
    expect(live()).toBe('REDUZIR INCERTEZA, CRITÉRIO 4 de 5')
  })

  it('announces a page turn as a position, not as the page', () => {
    mirror.sync(S({ page: 3, sel: 0, sec: 0, pages: 4 }))
    mirror.sync(S({ page: 3, sel: 0, sec: 2, pages: 4 }))
    vi.runAllTimers()
    expect(live()).toBe('Página 2 de 4')
  })

  /**
   * One announcement, for the one thing that changed. A new Module makes the item
   * and the page under it new as well, and reading all three is reading the screen
   * out loud — which is the failure the whole region is shaped around.
   */
  it('announces the Module alone when the Module changed', () => {
    mirror.sync(S({ page: 1, sel: 0 }))
    mirror.sync(S({ page: 3, sel: 4, sec: 1, pages: 2 }))
    vi.runAllTimers()
    expect(live()).toBe('CRITÉRIOS')
  })
})

/**
 * T-26 — the half of the mirror a machine can read without running anything.
 *
 * `T-18` built the mirror at runtime, which reaches a screen reader, find-in-page
 * and Google, because all three execute JavaScript. An applicant tracking system
 * does not: the built page carried 469 characters of control labels and dial
 * readouts, no top-level heading, and not one word of a Module.
 *
 * The fix is the *same* renderer run at build time — `mirrorIntoPage`, wired into
 * `vite.site.config.ts`. So the assertions below run that function over the real
 * `prototype/index.html`, which is the file the build transforms, and read the
 * result as a document. `verify:site` makes the same claims about `dist-site/` after
 * an actual build; this suite is what fails in a second, on a laptop, before anyone
 * gets there.
 */
describe('the mirror, written into the page before any script runs', () => {
  /* from the repo root, which is vitest's cwd — `import.meta.url` is an http URL
     under the jsdom environment and `readFileSync` will not take one */
  const source = () => readFileSync(PAGE, 'utf8')
  const built = () => new DOMParser().parseFromString(mirrorIntoPage(source()), 'text/html')

  it('is absent from the source and present in the build', () => {
    expect(source()).not.toContain(`id="${MIRROR_ID}"`)
    expect(built().getElementById(MIRROR_ID)).not.toBeNull()
  })

  it('carries every Module\u2019s content as text, with no script executed', () => {
    const text = built().getElementById(MIRROR_ID).textContent
    for (const m of MODULES) {
      expect(text).toContain(m.title)
      for (const it of m.items || []) expect(text).toContain(it.label)
    }
    /* the number that made the ticket: 469 characters before, thousands after */
    expect(text.replace(/\s+/g, ' ').trim().length).toBeGreaterThan(3000)
  })

  it('gives the page exactly one top-level heading, and it is his name', () => {
    const h1s = built().querySelectorAll('h1')
    expect(h1s.length).toBe(1)
    /* the name is read from the identity Module, never typed here */
    expect(h1s[0].textContent).toBe(MODULES.find(m => m.layout === 'identity').name)
  })

  it('ships the clip with the markup, so the mirror is never a wall of text', () => {
    /* the sheet used to be created by this file's own JS, which arrives ~900kB of
       bundle later — without it the pre-rendered mirror paints in full first */
    const style = built().getElementById(MIRROR_STYLE_ID)
    expect(style).not.toBeNull()
    expect(style.textContent).toContain(`#${MIRROR_ID}`)
  })

  /**
   * The workbench is not the portfolio.
   *
   * `.ctl{display:none}` took the dials away from the eye and from nothing else, so
   * `BEVEL 10`, `TILE 1.00` and `SEED 25` were the built page's content. They cannot
   * be deleted — `scene.js` binds every one by id and throws on the first missing
   * element — so the row is hidden from the document instead.
   */
  it('hides the workbench dials from the document without removing them', () => {
    const doc = built()
    const hud = doc.querySelector('.hud')
    expect(hud.hasAttribute('hidden')).toBe(true)
    expect(hud.getAttribute('aria-hidden')).toBe('true')
    /* still there, because scene.js binds each one by id */
    for (const id of ['bevel', 'tile', 'seed', 'fps']) expect(doc.getElementById(id)).not.toBeNull()
  })

  it('refuses to write a second mirror into a page that has one', () => {
    expect(() => mirrorIntoPage(mirrorIntoPage(source()))).toThrow()
  })
})

/**
 * The other half of T-26: pre-rendering must not freeze the mirror.
 *
 * Every test above this point exercises the *create* path, because `beforeEach`
 * empties the document. The shipped page is the other one — the markup is already
 * there when `scene.js` imports this module — and the failure it invites is a
 * second copy of the portfolio appended under the first.
 */
describe('adopting a mirror the build already wrote', () => {
  let adopted
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    const pre = new DOMParser().parseFromString(
      mirrorIntoPage(readFileSync(PAGE, 'utf8')), 'text/html')
    document.head.append(pre.getElementById(MIRROR_STYLE_ID))
    document.body.append(pre.getElementById(MIRROR_ID))
    adopted = createMirror({})
  })

  it('adopts the node instead of adding one', () => {
    expect(document.querySelectorAll(`#${MIRROR_ID}`).length).toBe(1)
    expect(adopted.el).toBe(document.getElementById(MIRROR_ID))
    expect(document.querySelectorAll(`#${MIRROR_STYLE_ID}`).length).toBe(1)
  })

  it('still follows the instrument — the ticket\u2019s "must not freeze it"', () => {
    adopted.sync(S({ page: 1, sel: 2 }))
    expect(el2(1).getAttribute('aria-current')).toBe('true')
    expect(btn2(1, 2).getAttribute('aria-current')).toBe('true')
    expect(btn2(1, 2).tabIndex).toBe(0)
    expect(btn2(3, 0).tabIndex).toBe(-1)

    adopted.sync(S({ page: 3, sel: 0 }))
    expect(el2(1).hasAttribute('aria-current')).toBe(false)
    expect(el2(3).getAttribute('aria-current')).toBe('true')
    expect(btn2(1, 2).hasAttribute('aria-current')).toBe(false)
  })

  it('wires the adopted rows to the callback', () => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    const pre = new DOMParser().parseFromString(
      mirrorIntoPage(readFileSync(PAGE, 'utf8')), 'text/html')
    document.body.append(pre.getElementById(MIRROR_ID))
    const seen = []
    const m = createMirror({ onItem: (a, b) => seen.push([a, b]) })
    m.el.querySelector(`[${HOOK.item}="3.3"]`).click()
    expect(seen).toEqual([[3, 3]])
  })
})

/** The page the build transforms, from vitest's cwd. */
const PAGE = 'prototype/index.html'

const el2 = i => document.querySelector(`[${HOOK.module}="${i}"]`)
const btn2 = (m, i) => document.querySelector(`[${HOOK.item}="${m}.${i}"]`)

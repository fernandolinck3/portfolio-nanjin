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
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMirror } from './mirror.js'
import { HOOK } from '../src/content/mirror.ts'
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

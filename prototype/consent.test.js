/**
 * @vitest-environment jsdom
 *
 * The gate, not the banner.
 *
 * What matters here is not that a bar appears — it is that **nothing is fetched
 * before someone says yes**. A consent banner that shows up after the cookie was
 * already written is theatre, and it is the most common way this is got wrong, so it
 * is the first thing asserted.
 *
 * Driven directly rather than through a browser: `rAF` fires zero times in an
 * automated tab, and the decision has no animation worth watching anyway.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createConsent } from './consent.js'

const store = new Map()

beforeEach(() => {
  store.clear()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  vi.stubGlobal('localStorage', {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
  })
  window.loadGTM = vi.fn()
  window.__gtmUp = false
})

const bar = () => document.querySelector('.cs-bar')
const press = which => bar().querySelector('[data-' + which + ']').dispatchEvent(
  new window.MouseEvent('click', { bubbles: true }))

describe('nothing is measured before someone agrees to it', () => {
  it('asks, and loads nothing while it is asking', () => {
    expect(createConsent()).toBe(true)
    expect(bar()).not.toBeNull()
    expect(window.loadGTM).not.toHaveBeenCalled()
    expect(store.has('tenebrae.consent')).toBe(false)
  })

  it('loads the tag only once the visitor says yes', () => {
    createConsent()
    press('yes')
    expect(window.loadGTM).toHaveBeenCalledTimes(1)
    expect(store.get('tenebrae.consent')).toBe('granted')
  })

  it('loads nothing at all when the visitor says no', () => {
    createConsent()
    press('no')
    expect(window.loadGTM).not.toHaveBeenCalled()
    expect(store.get('tenebrae.consent')).toBe('denied')
  })

  it('does not ask a second time once answered', () => {
    store.set('tenebrae.consent', 'denied')
    expect(createConsent()).toBe(false)
    expect(bar()).toBeNull()
    expect(window.loadGTM).not.toHaveBeenCalled()
  })

  it('reports a remembered yes without asking again', () => {
    store.set('tenebrae.consent', 'granted')
    const told = vi.fn()
    expect(createConsent(told)).toBe(false)
    expect(told).toHaveBeenCalledWith(true)
  })

  /** Blocked storage must not be read as agreement. */
  it('asks again rather than assuming, when storage refuses to answer', () => {
    vi.stubGlobal('localStorage', {
      getItem() { throw new Error('blocked') },
      setItem() { throw new Error('blocked') },
    })
    expect(createConsent()).toBe(true)
    expect(window.loadGTM).not.toHaveBeenCalled()
    /* and the answer still works for this visit, even unremembered */
    press('yes')
    expect(window.loadGTM).toHaveBeenCalledTimes(1)
  })

  /**
   * Refusing must cost what accepting costs. A "no" that is smaller, greyer or
   * further away is a dark pattern, and this object does not lie to people anywhere
   * else.
   */
  it('offers refusal as the same control as acceptance', () => {
    createConsent()
    const [yes, no] = bar().querySelectorAll('.cs-acts button')
    expect(yes.tagName).toBe(no.tagName)
    expect(yes.parentElement).toBe(no.parentElement)
    expect(yes.className).toBe(no.className)
  })

  it('tells whoever asked, either way', () => {
    const told = vi.fn()
    createConsent(told)
    press('no')
    expect(told).toHaveBeenCalledWith(false)
  })
})

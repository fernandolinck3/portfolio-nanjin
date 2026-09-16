import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContact } from './contact.js'
import { UI } from '../src/content/strings.ts'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const success = () => ({ ok: true, status: 200, json: async () => ({ success: true }) })

let contact, panel, form, opener, fetchMock, track
const field = name => form.elements.namedItem(name)
const submit = () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
const message = () => panel.querySelector('.ct-status').textContent
const key = (target, value, shiftKey = false) => target.dispatchEvent(new KeyboardEvent('keydown', {
  key: value, shiftKey, bubbles: true, cancelable: true,
}))

beforeEach(() => {
  vi.useFakeTimers()
  document.body.innerHTML = '<button id="opener">Contact</button><button id="consent">Accept</button><a href="/en/" id="language">English</a>'
  opener = document.querySelector('#opener')
  opener.focus()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  track = vi.fn()
  contact = createContact({ mount: document.body, track })
  panel = document.querySelector('.ct-panel')
  form = panel.querySelector('form')
  contact.open()
  field('name').value = 'Visitor'
  field('email').value = 'visitor@example.com'
  field('message').value = 'A project idea'
})
afterEach(() => {
  contact.close()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Contact keyboard lifecycle', () => {
  it('contains both Tab boundaries and redirects consent/language focus', () => {
    const last = panel.querySelector('a')
    expect(document.activeElement).toBe(field('name'))
    key(field('name'), 'Tab', true)
    expect(document.activeElement).toBe(last)
    key(last, 'Tab')
    expect(document.activeElement).toBe(field('name'))
    document.querySelector('#consent').focus()
    expect(document.activeElement).toBe(field('name'))
    document.querySelector('#language').focus()
    expect(document.activeElement).toBe(field('name'))
  })

  it('restores the opener, removes closed controls immediately and clears old hide timers', async () => {
    contact.open() // repeated open must not replace the original opener
    key(field('name'), 'Escape')
    expect(document.activeElement).toBe(opener)
    expect(panel.inert).toBe(true)
    contact.open()
    await vi.advanceTimersByTimeAsync(300)
    expect(panel.hidden).toBe(false)
    expect(panel.inert).toBe(false)
    contact.close()
    await vi.advanceTimersByTimeAsync(300)
    expect(panel.hidden).toBe(true)
    document.querySelector('#consent').focus()
    expect(document.activeElement.id).toBe('consent')
  })

  it('can close after the opener is removed', () => {
    opener.remove()
    expect(() => contact.close()).not.toThrow()
  })
})

describe('Contact delivery lifecycle (all requests mocked)', () => {
  it('validates locally and prevents rapid duplicate sends while protecting the submitted draft', async () => {
    field('email').value = 'invalid'
    submit()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(message()).toBe(UI.contactBadEmail)
    field('email').value = 'visitor@example.com'
    fetchMock.mockReturnValue(new Promise(() => {}))
    panel.querySelector('.ct-send').focus()
    submit(); submit()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(field('message').readOnly).toBe(true)
    expect(document.activeElement).toBe(panel.querySelector('.ct-cancel'))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).message).toBe('A project idea')
  })

  it.each(['network', 'refused', 'invalid body'])('preserves draft and permits retry after %s', async kind => {
    if (kind === 'network') fetchMock.mockRejectedValueOnce(new Error('offline'))
    else fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: () => kind === 'invalid body' ? Promise.reject(new Error('json')) : Promise.resolve({ success: false }) })
    submit(); await flush()
    expect(message()).toBe(kind === 'network' ? UI.contactOffline : UI.contactRefused)
    expect(field('message').value).toBe('A project idea')
    expect(field('message').readOnly).toBe(false)
    fetchMock.mockResolvedValueOnce(success())
    submit(); await flush()
    expect(message()).toBe(UI.contactSent)
    expect(field('message').value).toBe('')
    expect(track).toHaveBeenCalledWith('contact_sent', { route: 'form' })
    await vi.advanceTimersByTimeAsync(4200)
    expect(contact.isOpen).toBe(false)
  })

  it.each(['fetch', 'body'])('bounds a stalled %s and ignores its late success during retry', async stage => {
    const stalled = deferred()
    fetchMock.mockReturnValueOnce(stage === 'fetch' ? stalled.promise : Promise.resolve({ ok: true, json: () => stalled.promise }))
    submit(); await flush()
    const signal = fetchMock.mock.calls[0][1].signal
    await vi.advanceTimersByTimeAsync(15000)
    expect(signal.aborted).toBe(true)
    expect(message()).toBe(UI.contactTimeout)
    expect(field('message').value).toBe('A project idea')
    const retry = deferred()
    fetchMock.mockReturnValueOnce(retry.promise)
    submit()
    stalled.resolve(stage === 'fetch' ? success() : { success: true })
    await flush()
    expect(message()).toBe(UI.contactSending)
    expect(field('message').readOnly).toBe(true)
    expect(field('message').value).toBe('A project idea')
    retry.resolve(success()); await flush()
    expect(message()).toBe(UI.contactSent)
    expect(track.mock.calls.filter(([event]) => event === 'contact_sent')).toHaveLength(1)
  })

  it.each(['Back', 'Escape', 'backdrop'])('%s aborts pending delivery, preserves the draft and isolates reopened requests', async method => {
    const old = deferred()
    fetchMock.mockReturnValueOnce(old.promise)
    submit()
    const signal = fetchMock.mock.calls[0][1].signal
    if (method === 'Back') panel.querySelector('.ct-cancel').click()
    if (method === 'Escape') key(field('name'), 'Escape')
    if (method === 'backdrop') panel.click()
    expect(contact.isOpen).toBe(false)
    expect(signal.aborted).toBe(true)
    contact.open()
    expect(message()).toBe(UI.contactCancelled)
    expect(field('message').value).toBe('A project idea')
    const next = deferred()
    fetchMock.mockReturnValueOnce(next.promise)
    submit()
    old.resolve(success()); await flush()
    expect(message()).toBe(UI.contactSending)
    expect(field('message').readOnly).toBe(true)
    expect(track).not.toHaveBeenCalledWith('contact_sent', expect.anything())
    next.resolve(success()); await flush()
    expect(message()).toBe(UI.contactSent)
  })

  it('does not let old success timers close a reopened dialog or a new draft', async () => {
    fetchMock.mockResolvedValue(success())
    submit(); await flush()
    contact.close(); contact.open()
    await vi.advanceTimersByTimeAsync(4200)
    expect(contact.isOpen).toBe(true)
    field('name').value = 'Visitor'
    field('email').value = 'visitor@example.com'
    field('message').value = 'Second message'
    submit(); await flush()
    field('message').value = 'New draft'
    field('message').dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(4200)
    expect(contact.isOpen).toBe(true)
    expect(field('message').value).toBe('New draft')
  })
})

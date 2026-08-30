/**
 * What the object reports about itself.
 *
 * The Unit is one page that never navigates, so the default pageview says almost
 * nothing: it fires once, at boot, and every visitor looks identical whether they
 * pressed one Pad and left or read three cases and wrote an email. **On a single
 * screen the events are the analytics.**
 *
 * This pushes to `dataLayer`, which is Tag Manager's own queue — no tag, no vendor,
 * no dependency (ADR-0004). Whether anything listens is decided in the GTM container,
 * so the code here is true whether or not a tag is ever published, and removing the
 * container removes the tracking without touching the object.
 *
 * **Nothing here identifies anybody.** Every payload is a name the source file
 * already contains — a Module id, a project id, a face. No text the visitor typed
 * (there is none to type), no addresses, no coordinates.
 */

/**
 * Local runs and the workbench stay out of the data.
 *
 * A day of pressing every Pad four hundred times while building the thing would
 * otherwise *be* the dataset. The published host is the only one that counts.
 */
const LIVE = /(^|\.)nanj\.in$/.test(location.hostname)

/**
 * The campaign parameters, read once and carried.
 *
 * GA4 reads UTMs off the URL by itself, on the first pageview — which is the only
 * pageview this site has, so that part is already handled. They are captured here as
 * well so that *every* event can carry them: a story link and a bio link produce the
 * same `work_open`, and without the source attached there is no way to tell which
 * one sent the person who read the case.
 */
const UTM = (() => {
  const q = new URLSearchParams(location.search)
  const out = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const v = q.get(k)
    if (v) out[k] = v.slice(0, 100)
  }
  return out
})()

/** Suppress repeats of the same event with the same payload, back to back. */
let last = ''
/** Pending settle timers, one per event name. See `trackSettled`. */
const settling = new Map()

/** Report something the visitor did. */
export function track(event, params = {}) {
  if (!LIVE) return
  const key = event + JSON.stringify(params)
  if (key === last) return
  last = key
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params, ...UTM })
}

/**
 * Report where something **came to rest**, not every place it passed through.
 *
 * The repeat guard above cannot do this and never could: it compares against the
 * previous push, and consecutive selections differ in `item`, so nothing is dropped.
 * A hand dragging the MOON from the first row to the fifth emitted four events —
 * exactly the "six events saying only that a wheel moves" this file claimed to have
 * designed out.
 *
 * So the push waits. Each new call for the same event name cancels the one before it,
 * and only the last one survives the quiet period. A reader crossing a list emits one
 * event, for the row they stopped on.
 */
export function trackSettled(event, params = {}, ms = 400) {
  if (!LIVE) return
  clearTimeout(settling.get(event))
  settling.set(event, setTimeout(() => { settling.delete(event); track(event, params) }, ms))
}

/** The campaign that brought this visit, for anything that wants to read it. */
export const campaign = () => ({ ...UTM })

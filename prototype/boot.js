/**
 * The entry point, and the only place that decides whether the Unit is built.
 *
 * It exists because the decision has to be made *before* `scene.js` is imported: that
 * module builds a `WebGLRenderer` at module scope, so by the time anything in it can
 * ask a question, the context is already asked for and the software rasteriser is
 * already grinding. A dynamic import is what buys the ordering.
 *
 * `?flat` forces the text version on a machine that could draw the Unit, which is the
 * only way to look at it without disabling hardware acceleration first. Same shape as
 * `?debug`, `?turned` and `?film`: a flag that reveals a path nobody can otherwise
 * see.
 */
import { probe3D } from './capability.js'

const forced = location.search.includes('flat')
const verdict = forced ? { ok: false, reason: 'forced' } : probe3D()

if (verdict.ok) {
  await import('./scene.js')
} else {
  const { flatten } = await import('./flat.js')
  flatten(verdict.reason)
}

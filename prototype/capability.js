/**
 * Whether this machine can be asked to draw the Unit.
 *
 * The Unit is WebGL. That was never in question; what was never checked is whether
 * the visitor has a GPU to run it on. PageSpeed found out first: Lighthouse runs
 * headless with no GPU, Chrome falls back to a software rasteriser, and every
 * `post.render()` — one per pre-warm mark, once per frame — takes seconds instead of
 * a millisecond. The renderer process stops answering and the browser kills the page.
 * The reported symptom was `PAGE_HUNG` on every metric.
 *
 * That is not a robot problem. Anyone whose hardware acceleration is off, or whose
 * old Android has no usable driver, gets the same frozen tab and the same dialog
 * asking whether to force the page closed. A blank page is a bad outcome; a hung
 * page is a worse one, because it blames the visitor's machine for our decision.
 *
 * So the answer is asked for before `scene.js` is ever imported — importing it builds
 * the renderer at module scope, and by then the choice is already made.
 */

/** Names software rasterisers announce themselves by. All three are unambiguous. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i

/**
 * @returns {{ ok: boolean, reason: string }} `ok` false means: do not build a scene.
 */
export function probe3D() {
  let canvas, gl
  try {
    canvas = document.createElement('canvas')
    /* Some browsers throw here rather than returning null, which is the same answer
       wearing a different coat. */
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  } catch {
    return { ok: false, reason: 'webgl-threw' }
  }
  if (!gl) return { ok: false, reason: 'no-webgl' }

  try {
    /* The precise signal, when the browser still offers it. It is being restricted
       for fingerprinting reasons, so its absence is not an answer either way. */
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '') : ''
    if (name && SOFTWARE.test(name)) return { ok: false, reason: 'software:' + name }

    /* No name to read. Ask the browser the question directly instead: a context that
       refuses to exist when a major performance caveat applies is the same fact,
       arrived at without a string to match. This is a *second* context and only a
       probe — it is never the one the scene draws into, because the flag is too blunt
       to gate a real visitor's session on by itself. */
    if (!name) {
      const strict = document.createElement('canvas')
        .getContext('webgl', { failIfMajorPerformanceCaveat: true })
      if (!strict) return { ok: false, reason: 'performance-caveat' }
      strict.getExtension('WEBGL_lose_context')?.loseContext()
    }
    return { ok: true, reason: name || 'gpu' }
  } catch {
    /* A probe that throws is not a reason to refuse a visitor with working hardware. */
    return { ok: true, reason: 'probe-failed' }
  } finally {
    /* Contexts are a limited resource and this one drew nothing. */
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

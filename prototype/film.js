/**
 * The film — the Unit recorded as a vertical clip, for a story.
 *
 * Loaded only for `?film`, as its own chunk, so nothing here reaches the site's
 * bundle. It exists because a release post wants the object *being used*: a still of
 * a Unit nobody is touching is a product shot, and the thing worth showing is that it
 * answers.
 *
 * **Why a recorder and not a screen capture.** A screen recording is whatever the
 * desktop happened to be doing — the browser's chrome, a dropped frame when something
 * else woke up, the wrong pixel ratio. `canvas.captureStream` records the canvas
 * itself at a fixed size, so the output is exactly the frame the renderer drew.
 *
 * **Why WebM and not MP4.** `MediaRecorder` writes WebM in every browser that
 * supports it and MP4 in almost none. The conversion is one `ffmpeg` call and it is
 * lossless to the eye at these bitrates; Instagram wants H.264 either way, so a
 * transcode was always going to happen.
 *
 * The clip is driven by a **script of cues on a real clock**, not by wall time
 * accumulating however the frame rate falls. If a frame is late the next cue still
 * fires where it was written, so the cut is the same length every time it is run.
 */

/** 9:16, the shape of a story. 1080x1920 is what Instagram serves back. */
const SIZE = { w: 1080, h: 1920 }
const FPS = 30

/**
 * The cut, in seconds.
 *
 * A landscape object in a portrait frame cannot be shown wide — it would be a band
 * across the middle of a tall black rectangle. So the camera is close for all of it
 * and the *movement* does the establishing: down the face, across to the Screen,
 * then out as the light goes.
 */
const SHOTS = [
  /* The opening runs on its own camera for the first four seconds — it is the ritual
     and it already knows how to stage itself. The film takes over after it lands. */
  { at: 4.0, cam: { tilt: 26, yaw: -10, dist: 3.4, pan: { x: 0, y: 0, z: .1 } } },
  { at: 5.4, do: u => u.press(1) },
  { at: 6.2, cam: { tilt: 38, yaw: 0, dist: 2.4, pan: { x: 0, y: 0, z: -.05 } }, ease: 1.8 },
  { at: 7.0, do: u => u.moon(1) },
  { at: 7.9, do: u => u.moon(1) },
  /* armed before the light moves, so the crossing that follows is the one that opens
     it — day into night, which is the MOON's face */
  { at: 8.8, do: u => u.eclipse() },
  { at: 9.2, cam: { tilt: 22, yaw: 12, dist: 3.2, pan: { x: 0, y: 0, z: .15 } }, ease: 2.0 },
  { at: 9.6, do: u => u.light(0) },
  { at: 12.4, cam: { tilt: 34, yaw: 0, dist: 2.1, pan: { x: 0, y: 0, z: -.08 } }, ease: 2.2 },
  { at: 17.0, end: true },
]

const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a, b, k) => a + (b - a) * k

export function runFilm(unit, canvas) {
  /**
   * The canvas is sized once, before anything is recorded: `captureStream` locks the
   * track's dimensions to whatever the canvas was when it started. The CSS size below
   * is only the preview — what is recorded is the canvas's own 1080x1920.
   */
  const stage = canvas.parentElement
  if (stage) stage.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center'
  canvas.style.width = '337px'
  canvas.style.height = '600px'
  unit.setFilmSize(SIZE.w, SIZE.h)

  document.querySelectorAll('.hud, .touch, .sr, #full, #turn').forEach(e => { e.style.display = 'none' })
  document.body.style.background = '#000'

  const stream = canvas.captureStream(FPS)
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find(t => MediaRecorder.isTypeSupported(t))
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 16e6 })
  const chunks = []
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
  rec.onstop = () => {
    const blob = new Blob(chunks, { type })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tenebrae-story.webm'
    a.click()
    console.log('[film] gravado:', (blob.size / 1e6).toFixed(1), 'MB')
  }

  /* the camera is interpolated between the two shots either side of now, so the move
     is continuous even though the script is a list of destinations */
  const cams = SHOTS.filter(s => s.cam)
  const fired = new Set()
  let t0 = 0

  const at = t => {
    let a = cams[0], b = cams[0]
    for (const s of cams) { if (s.at <= t) a = s }
    b = cams[cams.indexOf(a) + 1] || a
    if (b === a) return a.cam
    const k = ease(Math.min(1, (t - a.at) / ((b.ease || (b.at - a.at)))))
    const p = (x, y) => lerp(x, y, k)
    return {
      tilt: p(a.cam.tilt, b.cam.tilt), yaw: p(a.cam.yaw, b.cam.yaw), dist: p(a.cam.dist, b.cam.dist),
      pan: { x: p(a.cam.pan.x, b.cam.pan.x), y: p(a.cam.pan.y, b.cam.pan.y), z: p(a.cam.pan.z, b.cam.pan.z) },
    }
  }

  function frame(now) {
    if (!t0) { t0 = now; rec.start() }
    const t = (now - t0) / 1000
    for (const s of SHOTS) {
      if (t >= s.at && !fired.has(s)) {
        fired.add(s)
        if (s.end) { rec.stop(); return }
        if (s.do) try { s.do(unit) } catch (e) { console.warn('[film]', e) }
      }
    }
    /* the opening keeps the camera until the first shot is due */
    if (t >= cams[0].at) unit.setCam(at(t))
    unit.render()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  console.log('[film] gravando', SHOTS[SHOTS.length - 1].at, 's em', SIZE.w + 'x' + SIZE.h)
}

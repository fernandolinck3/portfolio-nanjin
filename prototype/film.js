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
 * Three rules, and they are all the same rule: **the object, and nothing else.**
 *
 * **Framing looks down, and `tilt` runs backwards.** A *lower* `tilt` puts the camera
 * *higher* — 20 is nearly overhead, 50 is closer to eye level. Reading it the other
 * way is what put a candlestick across the top third of the first cut: pulling back to
 * fit the object also tipped the frame up into the wall.
 *
 * The distance is not free either. The Plate is 1.84 wide and a 9:16 frame is narrow,
 * so anything under about `dist` 4.7 crops the Screen at the sides — which is fine for
 * a texture shot and fatal for the one beat where the display has to be read. So every
 * shot lives between 4.5 and 5.0, steeply overhead, and the extra vertical goes to the
 * desk rather than to the room: *"evite mostrar muito do room e a vela também."*
 *
 * **The opening is cut short.** It is a fly-in from across the room, which is the one
 * part of the object that is *about* the room. The film takes the camera at 2.6s,
 * while the ritual is still landing.
 *
 * **Nothing arms ECLIPSE.** The light still goes down to night, because that is the
 * best thing the object does on camera — but with the seventh state unarmed the
 * crossing opens nothing. A story that shows the secret has spent it.
 *
 * It ends on QUEM at full night, lit by its own Screen: the name, in blackletter, on
 * a dark object. That is the card, and it gives nothing away.
 */
const SHOTS = [
  { at: 2.6, cam: { tilt: 21, yaw: -6, dist: 5.0, pan: { x: 0, y: 0, z: .05 } } },
  { at: 4.2, do: u => u.press(1) },
  { at: 4.6, cam: { tilt: 26, yaw: 0, dist: 4.6, pan: { x: 0, y: 0, z: 0 } }, ease: 1.8 },
  { at: 5.8, do: u => u.moon(1) },
  { at: 6.6, do: u => u.moon(1) },
  { at: 7.4, cam: { tilt: 19, yaw: 7, dist: 5.0, pan: { x: 0, y: 0, z: .05 } }, ease: 1.8 },
  /* the light going out, which is the thing worth filming */
  { at: 8.2, do: u => u.light(0) },
  { at: 10.6, do: u => u.press(0) },
  { at: 11.0, cam: { tilt: 24, yaw: 0, dist: 4.5, pan: { x: 0, y: 0, z: -.02 } }, ease: 2.4 },
  { at: 15.0, end: true },
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

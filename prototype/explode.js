/**
 * The exploded view — the Unit taken apart in the air and put back.
 *
 * Loaded only for `?explode`, as its own chunk.
 *
 * **Why this reads without a caption.** An exploded diagram is a language people
 * already know, from furniture instructions and watch photography. It says "this is
 * an assembled thing, and someone decided every piece" in a way the sentence "a 3D
 * portfolio" cannot.
 *
 * **The trick this object needs.** The whole Unit lives inside 0.38 of height — the
 * Plate sits thirteen thousandths above the Chassis. At true scale an explosion is
 * invisible, so the layers are pushed apart by a *multiple* of their own order, not
 * by their real gaps. It is a diagram, not a measurement, and diagrams lie about
 * distance on purpose.
 *
 * Each layer also lags the one below it, so the object peels rather than jumping —
 * the eye follows one piece at a time and reads the stack as an order.
 */

/** Square, because a loop in a feed is watched at whatever size the feed gives it. */
const SIZE = { w: 1080, h: 1080 }
const FPS = 30

/**
 * The lift, in order from the bottom up, and the delay before each one starts.
 *
 * `rise` is scene units; `at` is seconds into the outward move. The Chassis never
 * moves — something has to stay still or the shot is a drift, not an explosion.
 */
const LIFT = [
  { key: 'chassis', rise: 0.00, at: 0.00 },
  { key: 'display', rise: 0.55, at: 0.10 },
  { key: 'plate', rise: 1.05, at: 0.00 },
  { key: 'lamps', rise: 1.35, at: 0.30 },
  { key: 'fader', rise: 1.55, at: 0.42 },
  { key: 'pads', rise: 1.80, at: 0.54 },
  { key: 'decks', rise: 2.20, at: 0.66 },
]

const OUT = 2.6      // seconds to come apart
const HOLD = 1.4     // seconds held open
const BACK = 2.0     // seconds to close
const LOOP = OUT + HOLD + BACK

/**
 * Low and to the side — the one thing an exploded diagram cannot do without.
 *
 * The first cut used the object's usual raked view, which on this rig is close to
 * overhead. Layers separating *vertically* then travel straight at the eye, and
 * moving toward a camera reads as **getting bigger**, not as coming apart:
 * *"ficou meio confuso pelo POV topdown, não dá pra entender que os objetos tão
 * separando."*
 *
 * `tilt` runs backwards here — 70 is a low camera, not a high one — and at that angle
 * `placeCamera` aims well above the pivot on its own, so `pan.y` pulls the target back
 * down to the middle of the column. The result: the camera sits at about the height of
 * the Plate and looks across the stack, so a piece rising crosses the frame.
 */
const CAM = { tilt: 70, yaw: -22, dist: 7.6, pan: { x: 0, y: -1.05, z: 0 } }

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
/* ease-in-out: pieces start and settle slowly, which is what makes a mechanism read
   as heavy rather than as a slideshow */
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function runExplode(unit, canvas) {
  const layers = unit.layers()

  const stage = canvas.parentElement
  if (stage) stage.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center'
  canvas.style.width = '520px'
  canvas.style.height = '520px'
  document.querySelectorAll('.hud, .touch, .sr, #full, #turn').forEach(e => { e.style.display = 'none' })
  document.body.style.background = '#000'

  unit.setFilmSize(SIZE.w, SIZE.h)
  unit.setCam(CAM)

  /**
   * The object alone, on black.
   *
   * A side-on camera puts the room, the wall and the candlestick straight into frame,
   * and a diagram with scenery behind it stops being a diagram. The room's *meshes*
   * are hidden rather than the group: the Candles are lights living inside it, and a
   * hidden parent takes its lights with it — the object would go dark.
   *
   * Nada é guardado para desfazer porque não há saída deste modo: `?explode` dedica a
   * página inteira à tomada, com a HUD fora e o fundo preto. Uma lista do que foi
   * escondido existiu aqui por uma sessão sem nunca ser lida.
   */
  const { room, altar } = unit.roots()
  for (const g of [room, altar]) {
    if (!g) continue
    g.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.visible = false })
  }

  /* every mesh's own resting height, so the lift is an offset and never an absolute —
     putting a Part back by assignment is how you lose a position nobody wrote down */
  const home = new Map()
  for (const step of LIFT) {
    for (const o of layers[step.key] || []) home.set(o, o.position.y)
  }

  const place = k => {
    for (const step of LIFT) {
      /* each layer's own clock: it waits its turn, then takes what is left */
      const own = clamp01((k - step.at) / (1 - step.at))
      for (const o of layers[step.key] || []) {
        o.position.y = home.get(o) + ease(own) * step.rise
      }
    }
  }

  /* a button rather than an automatic download: browsers permit a save only behind a
     real click, and a recorder that starts on load records the page settling */
  const bar = document.createElement('div')
  bar.style.cssText = `position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;
    justify-content:center;padding:18px;z-index:90;
    font:10px/1 "Azeret Mono",ui-monospace,monospace;letter-spacing:.18em`
  bar.innerHTML = `
    <button id="ex-rec" style="padding:10px 18px;background:rgba(10,9,8,.72);border:1px solid #3A3A38;
      color:#C9C2B0;cursor:pointer;font:inherit;letter-spacing:.18em">GRAVAR UM LOOP</button>
    <span id="ex-say" style="align-self:center;color:#8A8880"></span>`
  document.body.appendChild(bar)
  const say = t => { bar.querySelector('#ex-say').textContent = t }

  let rec = null, chunks = []
  bar.querySelector('#ex-rec').addEventListener('click', () => {
    if (rec) return
    const type = ['video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t))
    rec = new MediaRecorder(canvas.captureStream(FPS), { mimeType: type, videoBitsPerSecond: 14e6 })
    chunks = []
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
    rec.onstop = () => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob(chunks, { type }))
      a.download = 'tenebrae-explode.webm'
      a.click()
      rec = null
      say('salvo')
    }
    /* start at the top of the next loop so the clip begins assembled */
    startRecAt = Math.ceil(elapsed() / LOOP) * LOOP
    say('gravando no próximo ciclo…')
  })

  let t0 = 0, startRecAt = -1
  const elapsed = () => (performance.now() - t0) / 1000

  function frame(now) {
    if (!t0) t0 = now
    const t = elapsed()

    if (startRecAt >= 0 && t >= startRecAt && rec && rec.state === 'inactive') {
      rec.start(); say('gravando…')
      startRecAt = -1
      recUntil = t + LOOP
    }
    if (recUntil > 0 && t >= recUntil && rec && rec.state === 'recording') {
      rec.stop(); recUntil = -1
    }

    const c = t % LOOP
    const k = c < OUT ? c / OUT
      : c < OUT + HOLD ? 1
      : 1 - (c - OUT - HOLD) / BACK
    place(clamp01(k))
    unit.render()
    requestAnimationFrame(frame)
  }
  let recUntil = -1
  requestAnimationFrame(frame)
  console.log('[explode] ciclo de', LOOP.toFixed(1), 's em', SIZE.w + 'x' + SIZE.h)
}

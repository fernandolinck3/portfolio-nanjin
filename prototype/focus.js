import * as THREE from 'three'
import { caseOf } from '../src/content/modules.ts'

/**
 * Zoom to the Screen, then hand the Work to the DOM.
 *
 * **This reverses ADR-0017**, which sent a Work out to a plinth on the reasoning
 * that "a Work is an image and the Screen is a 590px inset — it cannot carry one".
 * That reasoning is still correct about the *buffer*: 320x180 upscaled to fill a
 * viewport is roughly 4.7x, which is beautiful for the Grimoire's pixel art and
 * mush for a photograph of a poster. And photographs of posters are what the Works
 * actually are.
 *
 * So the camera performs the move and the DOM holds the content. The fly-in lands
 * with the Screen filling the frame, and at that moment a real HTML panel — real
 * image, real text, real link — cross-fades over it.
 *
 * That is not a compromise, it is ADR-0002: **the DOM is truth**. It also means the
 * Works are indexable, readable by a screen reader, available at full resolution,
 * and reachable on a phone that never runs the WebGL scene at all.
 *
 * A prototype. The camera path and the hand-off are real; the panel's styling is
 * deliberately plain, because the question being answered is whether the *move*
 * feels right.
 */

const EASE = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Resolve a Work's still against the deployed base path.
 *
 * `modules.ts` stores these as `/works/foo.jpg`, which is the right shape for the
 * *data* — a bare, root-relative path that says nothing about where the site is
 * hosted. But the build emits its scripts relatively (`base: './'`), so the site
 * runs from a subdirectory as well as a domain root, and a root-absolute image URL
 * would resolve past that subdirectory to the server root and 404.
 *
 * That failure only ever appears in a deployed build — never in `npm run dev`,
 * where the site *is* at the root — which makes it precisely the kind of bug worth
 * spending four lines to never have.
 */
const asset = p => (import.meta.env?.BASE_URL || '/') + String(p).replace(/^\//, '')

/**
 * Where the camera has to stand for the Screen to fill the frame.
 *
 * The Screen is set into a horizontal Plate, so it faces straight up and the
 * camera has to come directly over it — which the tilt/dist/yaw rig cannot
 * express, since its minimum tilt is 4 degrees and it always looks at the origin
 * rather than at the Screen's own centre. Hence a separate path that drives
 * `camera.position` and `camera.quaternion` outright.
 */
function screenFillPose(camera, { centre, width, depth }) {
  const vFov = THREE.MathUtils.degToRad(camera.fov)
  /* fit the tighter of the two axes, with a margin so it does not touch the edges */
  const forHeight = (depth / 2) / Math.tan(vFov / 2)
  const forWidth = (width / 2) / (Math.tan(vFov / 2) * camera.aspect)
  const dist = Math.max(forHeight, forWidth) * 1.08

  const pos = new THREE.Vector3(centre.x, centre.y + dist, centre.z)
  /* The Screen's texture runs with its top edge toward -z (the plane is laid down
     by a -90 degree turn about x), so the camera's up has to point that way or the
     Work arrives upside down. */
  const m = new THREE.Matrix4().lookAt(pos, centre, new THREE.Vector3(0, 0, -1))
  return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) }
}

/**
 * @param camera        the scene camera
 * @param mount         element to put the panel in (the stage)
 * @param screen        { centre: Vector3, width, depth } of the Screen in world space
 * @param onProgress    0 idle -> 1 fully focused; the room dims on this
 * @param restore       called on exit, to hand the camera back to the rig
 */
export function createFocus({ camera, mount, screen, onProgress, restore, onStep }) {
  /* ---------- the panel ---------- */
  const panel = document.createElement('div')
  panel.className = 'work-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.hidden = true
  /**
   * Three ways back, because one was not enough.
   *
   * It shipped with Esc and a small chip in the corner. Esc is invisible until you
   * already know it, and does not exist at all on a phone — so on touch there was
   * no way out of the Work but the browser's own back button.
   *
   * `summon.js` had the right instinct for this object: "while a Work is up, the
   * Screen is the way back — anywhere on it". The Screen is now the thing filling
   * the frame, so **clicking anywhere off the Work returns** — which is also the
   * behaviour every dialog on the web already has, so nobody has to learn it.
   */
  panel.innerHTML = `
    <button class="work-back" type="button">&larr;&nbsp; RETURN</button>
    <button class="work-step" data-d="-1" type="button" aria-label="Previous work">&lsaquo;</button>
    <button class="work-step" data-d="1" type="button" aria-label="Next work">&rsaquo;</button>
    <div class="work-body">
      <div class="work-plate"><span class="work-count"></span></div>
      <div class="work-text">
        <p class="work-no"></p>
        <h2 class="work-title"></h2>
        <p class="work-meta"></p>
        <div class="work-blurb"></div>
        <div class="work-case"></div>
        <p class="work-more"></p>
      </div>
    </div>
    <p class="work-hint">clique em qualquer lugar para voltar &middot; &larr; &rarr; para navegar</p>`
  mount.appendChild(panel)

  const style = document.createElement('style')
  style.textContent = `
    /* fixed, not absolute: the stage is not a positioned ancestor, so inset:0 was
       resolving somewhere unhelpful and the panel came out a few hundred pixels
       wide in the middle of the frame */
    .work-panel { position:fixed; inset:0; z-index:20; display:grid; place-items:center;
      opacity:0; pointer-events:none; transition:opacity .28s ease;
      background:linear-gradient(180deg, rgba(6,5,5,.55), rgba(6,5,5,.86));
      font:13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; color:#C9C2B0; }
    .work-panel[data-open="1"] { opacity:1; pointer-events:auto; }
    .work-body { display:flex; gap:40px; align-items:flex-start;
      width:min(1180px, 86vw); max-height:86vh; }
    /* the text column scrolls on its own; the image stays put */
    .work-text { overflow:auto; max-height:86vh; padding-right:12px; }
    .work-case h3 { margin:18px 0 4px; font-size:11px; letter-spacing:.18em;
      color:#C9BE96; font-weight:600; }
    .work-case p { margin:0 0 4px; color:#A9A292; }
    .work-more { margin-top:20px; padding-top:12px; border-top:1px solid #2A2620;
      color:#8A8470; font-size:12px; letter-spacing:.06em; }
    .work-plate { position:relative; flex:0 0 58%; aspect-ratio:16/10; border:1px solid #3A322A;
      background:#14110F center/contain no-repeat; box-shadow:0 24px 70px rgba(0,0,0,.6); }
    .work-plate[data-many="1"] { cursor:pointer; }
    .work-count { position:absolute; bottom:10px; right:12px; color:#8A7A54;
      background:rgba(8,7,6,.7); padding:3px 8px; letter-spacing:.14em; }
    .work-client { color:#8A7A54; letter-spacing:.14em; margin:0 0 14px; }
    .work-text { flex:1 1 auto; }
    .work-no { color:#8A7A54; letter-spacing:.24em; margin:0 0 10px; }
    .work-title { font:600 30px/1.15 Georgia, 'Times New Roman', serif; margin:0 0 8px; color:#E4DCC6; }
    .work-meta { color:#7E7565; letter-spacing:.12em; margin:0 0 18px; }
    .work-blurb p { margin:0 0 6px; color:#ADA491; }
    .work-body { position:relative; z-index:1; }
    .work-back { position:absolute; top:26px; left:30px; z-index:2; background:rgba(10,9,8,.6);
      cursor:pointer; border:1px solid #4A4136; color:#C9C2B0; padding:10px 18px;
      letter-spacing:.22em; font:inherit; transition:.18s; }
    .work-back:hover { color:#F0E8D2; border-color:#8A7A54; background:rgba(20,17,14,.85); }
    .work-step { position:absolute; top:50%; transform:translateY(-50%); z-index:2;
      background:none; border:0; cursor:pointer; color:#5C5346; font-size:44px; line-height:1;
      padding:20px 26px; transition:.18s; }
    .work-step:hover { color:#C9C2B0; }
    .work-step[data-d="-1"] { left:8px; }
    .work-step[data-d="1"] { right:8px; }
    .work-hint { position:absolute; bottom:24px; left:0; right:0; text-align:center;
      color:#5C5346; letter-spacing:.16em; margin:0; pointer-events:none; }
    @media (max-width: 760px) {
      .work-back { top:16px; left:16px; padding:8px 14px; }
      .work-step { font-size:34px; padding:14px; }
    }
    @media (max-width: 760px) { .work-body { flex-direction:column; gap:20px; } }`
  document.head.appendChild(style)

  /* ---------- state ---------- */
  let phase = 'idle'          // idle | in | held | out
  let k = 0                   // 0 .. 1
  const DUR = 0.78
  const from = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }
  let to = null
  let current = null

  /* which still of a multi-image Work is showing */
  let shot = 0

  function paintPlate() {
    const shots = current?.images || []
    const plate = panel.querySelector('.work-plate')
    const count = panel.querySelector('.work-count')
    plate.style.backgroundImage = shots.length ? `url(${asset(shots[shot % shots.length])})` : 'none'
    plate.dataset.many = shots.length > 1 ? '1' : '0'
    count.textContent = shots.length > 1 ? `${(shot % shots.length) + 1} / ${shots.length}` : ''
  }

  function fill(work) {
    panel.querySelector('.work-no').textContent = work.no ? 'NO. ' + work.no : ''
    panel.querySelector('.work-title').textContent = work.title || ''
    /* `contain`, not `cover`: these are posters and carousels with type running to
       the edge, and cropping them to fill a 16:10 box would cut the work up */
    panel.querySelector('.work-meta').textContent =
      [work.client, work.kind, work.year].filter(Boolean).join('  ·  ')
    panel.querySelector('.work-blurb').innerHTML =
      (work.blurb || []).map(l => `<p>${l}</p>`).join('')

    /**
     * The case lives **here**, and only here.
     *
     * It used to be drawn on the Screen too, under the project list, where a 320x180
     * buffer had to carry five sections of prose at 12px and the reader met the case
     * before choosing the project. Fernando: *"o texto explicativo do projeto deve
     * apenas aparecer quando o usuário clica e a tela da zoom."* Right — this panel
     * is real HTML at real size, which is the one place the case is comfortable, and
     * the Screen goes back to being an index.
     */
    const secs = caseOf(work.id) || []
    panel.querySelector('.work-case').innerHTML = secs
      .filter(sec => sec.lines.length)
      .map(sec => `<h3>${sec.heading}</h3>` + sec.lines.map(l => `<p>${l}</p>`).join(''))
      .join('')
    /* A slot, not a link. The long write-up does not exist yet, and a button that
       goes nowhere is worse than a line saying it is coming. */
    panel.querySelector('.work-more').textContent =
      work.empty ? '' : 'Confira o case com mais detalhes — em breve.'

    shot = 0
    paintPlate()
  }

  /** Swap the Work without moving the camera — for prev/next while already in. */
  function show(work) {
    if (!work) return
    current = work
    fill(work)
    onStep?.(work)
  }

  /**
   * Who had focus before the overlay took it.
   *
   * Kept so it can be handed back. A dialog that closes and drops focus on `<body>`
   * sends a keyboard user to the top of the document — they were on a project row
   * and now they are nowhere, with no way back except Tab from the start. Restoring
   * is the whole difference between an overlay and a trapdoor.
   */
  let opener = null

  /** Everything inside the panel a keyboard can land on, in document order. */
  const focusables = () => [...panel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(n => !n.disabled && n.offsetParent !== null)

  function enter(work) {
    if (phase === 'in') return
    if (phase === 'held') { show(work); return }
    current = work
    fill(work)
    /* only remember the opener on the way *in* — stepping between Works must not
       overwrite it with a button inside the panel */
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    from.pos.copy(camera.position); from.quat.copy(camera.quaternion)
    to = screenFillPose(camera, screen)
    phase = 'in'; k = 0
    panel.hidden = false
    /* focus moves in as soon as the panel exists, not when the flight lands: the
       flight is half a second and a keyboard user should not be stranded for it */
    focusables()[0]?.focus()
  }

  function exit() {
    if (phase === 'idle' || phase === 'out') return
    panel.dataset.open = '0'
    from.pos.copy(camera.position); from.quat.copy(camera.quaternion)
    phase = 'out'; k = 0
    /* hand focus back before the flight, for the same reason it was taken early */
    if (opener && document.contains(opener)) opener.focus()
    opener = null
  }

  panel.querySelector('.work-back').addEventListener('click', e => { e.stopPropagation(); exit() })
  /* a Work with two stills steps through them on the plate itself */
  panel.querySelector('.work-plate').addEventListener('click', e => {
    e.stopPropagation()
    if ((current?.images || []).length > 1) { shot++; paintPlate() }
  })
  for (const b of panel.querySelectorAll('.work-step')) {
    b.addEventListener('click', e => { e.stopPropagation(); onStep?.(+b.dataset.d, 'request') })
  }
  /* click anywhere that is not the Work itself — the dialog convention, and the
     same instinct summon.js had about the Screen being the way back */
  panel.addEventListener('click', exit)
  panel.querySelector('.work-body').addEventListener('click', e => e.stopPropagation())
  addEventListener('keydown', e => {
    if (!(phase === 'held' || phase === 'in')) return
    if (e.key === 'Escape') { exit(); e.preventDefault(); return }
    if (e.key === 'ArrowLeft') { onStep?.(-1, 'request'); e.preventDefault(); return }
    if (e.key === 'ArrowRight') { onStep?.(1, 'request'); e.preventDefault(); return }
    /**
     * The focus trap.
     *
     * Tab off either end of the panel comes back round to the other, so focus
     * cannot walk out into the page behind — which is still there, still has six
     * Pads and three wheel proxies in it, and would silently become reachable
     * underneath an overlay that is meant to be modal. Capture is not enough on its
     * own; the wrap has to be explicit because the elements behind are not hidden.
     */
    if (e.key === 'Tab') {
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }, true)

  function update(dt) {
    if (phase === 'idle') return
    if (phase === 'held') return
    k = Math.min(1, k + dt / DUR)
    const e = EASE(k)

    if (phase === 'in') {
      camera.position.lerpVectors(from.pos, to.pos, e)
      camera.quaternion.slerpQuaternions(from.quat, to.quat, e)
      onProgress?.(e)
      if (k >= 1) { phase = 'held'; panel.dataset.open = '1' }
    } else {
      /* on the way out the rig takes the camera back, so the target is wherever it
         wants the camera to be *now* — asking it each frame keeps the hand-back
         seamless even if the visitor dragged the view before entering */
      const home = restore()
      camera.position.lerpVectors(from.pos, home.pos, e)
      camera.quaternion.slerpQuaternions(from.quat, home.quat, e)
      onProgress?.(1 - e)
      if (k >= 1) { phase = 'idle'; panel.hidden = true; current = null }
    }
  }

  return {
    enter, exit, update, show,
    /** Browse to the next or previous Work without leaving the overlay. */
    step(d) { if (phase === 'held' || phase === 'in') onStep?.(d, 'request') },
    get active() { return phase !== 'idle' },
    get holding() { return phase === 'held' },
    get work() { return current },
  }
}

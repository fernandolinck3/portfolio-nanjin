/**
 * The breakdown — the Unit shown four ways, for the art-direction post.
 *
 * Loaded only for `?breakdown`, as its own chunk, so nothing here reaches the site.
 *
 * The four passes are a progression, not a gallery: **shape → form → surface →
 * light**. Each answers one question about what you are looking at, and each answer
 * makes the next panel legible.
 *
 *   1  wireframe   what it is made of. This is the panel that carries the claim:
 *                  nothing here was modelled. There is no Blender file, no `.obj` —
 *                  the chassis, the Plate, the engraving and the Decks are built by
 *                  code at run time (ADR-0004), and a wireframe proves that in a way
 *                  no sentence does.
 *   2  clay        the form alone, one grey material everywhere, lighting on. What
 *                  the object *is* before it is decorated.
 *   3  surface     the artwork flat, lighting off. Fernando's Plate art, the Deck
 *                  photographs and the Screen, with nothing lit — the paint layer.
 *   4  final       all of it.
 *
 * The camera does not move between passes. That is the whole point of a breakdown:
 * four images that stack, so the eye reads the difference rather than re-finding the
 * object each time.
 */

/** LinkedIn's portrait slot. Four of these make a carousel. */
const SIZE = { w: 1080, h: 1350 }

/**
 * One framing, used by all four.
 *
 * `tilt` runs backwards on this rig — lower is a higher camera — and the Plate is
 * 1.84 wide, so at this aspect anything under about `dist` 3.4 crops it at the sides.
 * 3.9 leaves margin without tipping the frame up into the room.
 */
const CAM = { tilt: 24, yaw: -7, dist: 3.9, pan: { x: 0, y: 0, z: .05 } }

const PASSES = [
  { id: 'wireframe', label: '01 — geometria' },
  { id: 'clay', label: '02 — forma' },
  { id: 'surface', label: '03 — superfície' },
  { id: 'final', label: '04 — luz' },
]

export async function runBreakdown(unit, canvas, THREE) {
  const { unit: obj, room, altar } = unit.roots()

  const stage = canvas.parentElement
  if (stage) stage.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center'
  canvas.style.width = '400px'
  canvas.style.height = '500px'
  document.querySelectorAll('.hud, .touch, .sr, #full, #turn').forEach(e => { e.style.display = 'none' })
  document.body.style.background = '#000'

  unit.setFilmSize(SIZE.w, SIZE.h)
  unit.setCam(CAM)

  /* the room is staging, not subject: a breakdown isolates the object */
  const hidden = [room, altar].filter(Boolean)
  hidden.forEach(g => { g.visible = false })

  /**
   * Every material is swapped and put back.
   *
   * Materials are shared between meshes here — the Pads all point at one — so the
   * originals are kept per *mesh* and restored from that map. Mutating a shared
   * material in place and undoing it by hand is how a pass leaks into the next one.
   */
  const saved = new Map()
  const eachMesh = fn => obj.traverse(o => { if (o.isMesh && o.material) fn(o) })

  const swap = make => {
    eachMesh(o => {
      if (!saved.has(o)) saved.set(o, o.material)
      const m = make(saved.get(o), o)
      if (m) o.material = m
    })
  }
  const restore = () => {
    for (const [o, m] of saved) o.material = m
    saved.clear()
  }

  const passes = {
    wireframe: () => swap(src => new THREE.MeshBasicMaterial({
      color: 0xC9BE96, wireframe: true, transparent: true, opacity: .55,
    })),
    clay: () => swap(() => new THREE.MeshStandardMaterial({
      color: 0x9C968A, roughness: .82, metalness: 0,
    })),
    /* the paint layer: whatever map the material carried, unlit. Meshes with no map
       go near-black so the artwork is the only thing that reads. */
    surface: () => swap(src => new THREE.MeshBasicMaterial({
      map: src.map || src.emissiveMap || null,
      color: (src.map || src.emissiveMap) ? 0xffffff : 0x14120F,
      toneMapped: false,
    })),
    final: () => restore(),
  }

  /**
   * The frames are collected, then shown — not downloaded as they are made.
   *
   * A page cannot save four files on its own: browsers permit multiple downloads only
   * behind a user gesture, so the first attempt at this produced four blocked
   * requests and no files, silently. So the pass ends in a contact sheet the visitor
   * can look at, with one button that saves all four from a real click.
   */
  const shots = []
  const shoot = (name, label) => new Promise(done => {
    canvas.toBlob(b => { shots.push({ name, label, url: URL.createObjectURL(b) }); done() }, 'image/png')
  })

  for (const p of PASSES) {
    restore()
    passes[p.id]()
    /* two frames: one to compile whatever the swap just introduced, one to shoot */
    unit.render(); unit.render()
    console.log('[breakdown]', p.label)
    await shoot(p.id, p.label)
  }

  restore()
  hidden.forEach(g => { g.visible = true })
  unit.render()

  /* the contact sheet */
  canvas.style.display = 'none'
  const sheet = document.createElement('div')
  sheet.style.cssText = `position:fixed;inset:0;z-index:90;overflow:auto;background:#0A0A0B;
    padding:28px;font:12px/1.6 "Azeret Mono",ui-monospace,monospace;color:#8A8880;letter-spacing:.1em`
  sheet.innerHTML = `
    <div style="display:flex;align-items:baseline;gap:18px;margin-bottom:20px">
      <b style="color:#C9BE96;letter-spacing:.24em">BREAKDOWN</b>
      <span>${SIZE.w}×${SIZE.h} · quatro passes</span>
      <button id="bd-save" style="margin-left:auto;padding:9px 16px;background:rgba(10,9,8,.72);
        border:1px solid #3A3A38;color:#C9C2B0;cursor:pointer;font:inherit;letter-spacing:.18em">
        SALVAR OS QUATRO</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px">
      ${shots.map(s => `
        <figure style="margin:0">
          <img src="${s.url}" style="width:100%;display:block;border:1px solid #2A2620">
          <figcaption style="margin-top:8px;color:#C9BE96">${s.label}</figcaption>
        </figure>`).join('')}
    </div>`
  document.body.appendChild(sheet)
  sheet.querySelector('#bd-save').addEventListener('click', () => {
    /* inside a real click, so the browser allows more than one */
    shots.forEach((s, i) => setTimeout(() => {
      const a = document.createElement('a')
      a.href = s.url; a.download = `tenebrae-${s.name}.png`; a.click()
    }, i * 250))
  })

  console.log('[breakdown] pronto —', shots.length, 'passes em', SIZE.w + 'x' + SIZE.h)
}

/**
 * The summoning — how a Work gets big enough to look at.
 *
 * The Screen cannot carry a Work. It is a 1024x576 texture drawing about 590px on
 * the Plate, seen at an angle; a poster or a site is an image with real detail in
 * it. Any answer that keeps the Work on the Screen shows the visitor a thumbnail
 * of something they cannot read.
 *
 * So the Work leaves the Unit and stands on a plinth beside the Altar, and the
 * Screen becomes its plaque. That division is the point: the image goes where
 * there is room for it, the words stay where words are legible, and neither is
 * asked to do the other's job.
 *
 * This module owns the object and its arrival. It does not own *when* — it is
 * handed a `strength` from 0 to 1 by the rite in `scene.js`, so the same curve
 * that guts the Candles is the one that raises the Work.
 */

import * as THREE from 'three'
import { sheetFor } from './works-art.js'

/** Texture for a Work, made once and kept — these are canvas draws, not cheap. */
function textureFor(work, i) {
  const t = new THREE.CanvasTexture(sheetFor(work, i))
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * Build the plinth and the thing that stands on it.
 *
 * Placed off the Altar's right shoulder and set back, so it is in frame at the
 * default camera without ever being between the visitor and the Unit — the Unit
 * stays the subject even while something else is lit.
 */
export function createSummoning(scene, works, { floorY }) {
  const sheets = works.map(textureFor)
  const group = new THREE.Group(); scene.add(group)
  const PED = { x: 5.6, z: -4.2 }

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x4A443E, roughness: 0.92, metalness: 0,
  })
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 2.5, 16), stoneMat)
  shaft.position.set(PED.x, floorY + 1.25, PED.z)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.16, 16), stoneMat)
  cap.position.set(PED.x, floorY + 2.58, PED.z)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.82, 0.22, 16), stoneMat)
  base.position.set(PED.x, floorY + 0.11, PED.z)
  group.add(shaft, cap, base)

  const CAP_TOP = floorY + 2.66

  /** The Work itself. Basic, not physical: it is emitting, not being lit. */
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: sheets[0], transparent: true, opacity: 0, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false,
    }),
  )
  group.add(sheet)

  /* Lit from below, the way a thing being conjured is rather than a thing being
     displayed. The colour is the Screen's own phosphor, so the light that brought
     it is visibly the Unit's. */
  const light = new THREE.PointLight(0x7FD9B0, 0, 9, 2)
  light.position.set(PED.x, CAP_TOP + 0.4, PED.z)
  group.add(light)

  /**
   * The ring of motes the Work assembles out of.
   *
   * They spiral in as it arrives and out as it goes, which is what makes it read
   * as summoned rather than as faded in. Points, not sprites — forty additive
   * quads would cost more than the whole plinth.
   */
  const MOTES = 44
  const moteGeo = new THREE.BufferGeometry()
  const motePos = new Float32Array(MOTES * 3)
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xC9BE96, size: 0.075, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }))
  group.add(motes)

  let index = 0, height = 2.4

  /**
   * Fit a sheet inside a box, preserving its aspect.
   *
   * Posters are portrait and sites are landscape, so scaling to a fixed height
   * would make a site nearly twice as wide as a poster and overhang the plinth.
   */
  function fit(mesh, tex, maxH, maxW) {
    const aspect = tex.image.width / tex.image.height
    const h = Math.min(maxH, maxW / aspect)
    mesh.scale.set(h * aspect, h, 1)
    return h
  }

  function applyWork(i) {
    index = ((i % works.length) + works.length) % works.length
    const tex = sheets[index]
    sheet.material.map = tex
    sheet.material.needsUpdate = true
    height = fit(sheet, tex, 2.4, 3.0)
  }

  /**
   * `s` is how present the Work is, 0 to 1. `t` is seconds.
   *
   * Below a hair above zero the whole thing is switched off, so an empty plinth
   * does not sit there costing draw calls and throwing light it should not.
   */
  function update(s, t) {
    const on = s > 0.002
    sheet.visible = on
    motes.visible = on
    /* An empty Plinth kept this at 0 and three still evaluated it for every pixel
       of every lit surface. `visible` is what actually takes it out of the shader. */
    light.intensity = s * 3.4
    light.visible = light.intensity > 0.0005
    if (!on) return

    /* it arrives turned away and settles face-on, rather than spinning like a
       trophy — the visitor should end up looking at the work, not at its edge */
    const settle = 1 - Math.pow(1 - s, 3)
    sheet.material.opacity = s
    sheet.position.set(
      PED.x,
      CAP_TOP + height / 2 + (1 - settle) * 0.9 + Math.sin(t * 0.9) * 0.035,
      PED.z,
    )
    sheet.rotation.y = (1 - settle) * 2.4

    /* the motes spiral in as it resolves, and are gone once it has */
    const swirl = 1 - s
    motes.material.opacity = Math.sin(s * Math.PI) * 0.9
    for (let i = 0; i < MOTES; i++) {
      const a = (i / MOTES) * Math.PI * 2 + t * (0.5 + (i % 5) * 0.09)
      const r = 0.5 + swirl * (1.6 + (i % 7) * 0.16)
      motePos[i * 3] = PED.x + Math.cos(a) * r
      motePos[i * 3 + 1] = CAP_TOP + 0.15 + ((i % 11) / 11) * height * (0.3 + settle * 0.9)
        + swirl * Math.sin(a * 2 + t) * 0.5
      motePos[i * 3 + 2] = PED.z + Math.sin(a) * r
    }
    moteGeo.attributes.position.needsUpdate = true
  }

  /**
   * Redraw every sheet.
   *
   * The canvases are drawn once at load, usually before the webfonts have arrived
   * — so the type lands in a fallback sans and the posters look wrong in a way
   * that is easy to blame on the design. Call from `document.fonts.ready`.
   */
  function refresh() {
    works.forEach((w, i) => {
      sheets[i].image = sheetFor(w, i)
      sheets[i].needsUpdate = true
    })
    applyWork(index)
  }

  applyWork(0)
  update(0, 0)
  /* `group` so `castOnly()` in scene.js can let the Plinth and the summoned Work
     throw shadows — they stand in the key's cone and are the point of the rite. */
  return { update, applyWork, refresh, group, count: works.length, get index() { return index } }
}

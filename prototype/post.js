import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

/**
 * The pass that closes the gap with the reference — or tells us it cannot be closed.
 *
 * The reference is a path-traced still. Four of the things the eye reads as "real"
 * in it are not modelling or texture at all, and none of them exist in a raw
 * rasterised frame:
 *
 *   - **contact occlusion** — the darkness where a thing meets the floor. Without
 *     it everything floats however well it is lit, which is why the furniture still
 *     looked pasted on after the staging pass.
 *   - **bloom** — light spreading past the edge of its source. It is the whole
 *     difference between "a bright pixel" and "a light", and this scene is *made*
 *     of small bright sources in the dark.
 *   - **a grade** — a photograph is never neutral. Shadows go cool, highlights go
 *     warm, and the corners fall away.
 *   - **grain** — the one that quietly does the most. A perfectly clean gradient is
 *     the loudest remaining tell that a picture was computed.
 *
 * None of these is global illumination and none of them pretends to be. They are
 * the cheap perceptual half of what a path tracer gives away for free.
 *
 * `three/examples/jsm` ships inside the `three` package, so nothing here is a new
 * dependency under ADR-0004.
 */

/**
 * Grade, vignette and grain — after tone mapping, so it works in display space.
 *
 * Vignette and grain both want to be applied to the *displayed* value, not to
 * linear radiance: a vignette in linear crushes the shadows into nothing, and
 * grain in linear is invisible in the darks and enormous in the highlights, which
 * is backwards from how film behaves.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.055 },
    vignette: { value: 0.70 },
    /**
     * Where the shadows go — and the reason the page looked foggy.
     *
     * At 0x0A0E18 this added up to rgb(5,7,12) to every black pixel, which is a
     * **raised black point**: the exact thing haze is. On a scene that is four
     * fifths darkness it read as fog over the whole picture. Filmic grading does
     * lift shadows, but film has a subject in the light to justify it; this one is
     * mostly shadow, so the lift had nothing to contrast against.
     *
     * Kept as a whisper — enough that the darks lean cool toward the moon rather
     * than going dead neutral, not enough to see as a veil.
     */
    /* Zero. Any lift at all is a raised black point, and a raised black point on a
       scene made of darkness is exactly what reads as fog. */
    lift: { value: new THREE.Color(0x000000) },
    gain: { value: new THREE.Color(0xFFF0DC) },   // where the highlights go
    saturation: { value: 1.06 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float time, grain, vignette, saturation;
    uniform vec3 lift, gain;
    varying vec2 vUv;

    /* cheap hash — no texture fetch, no repeat pattern to spot */
    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);

      /* lift/gain: shadows toward the moon, highlights toward the candles. The
         weight is the pixel's own luminance, so it is a split tone rather than a
         tint over everything. */
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb += lift * (1.0 - l) * 0.35;
      c.rgb *= mix(vec3(1.0), gain, l * 0.6);

      c.rgb = mix(vec3(l), c.rgb, saturation);

      /* vignette, measured from the centre with a soft shoulder */
      vec2 d = vUv - 0.5;
      float v = 1.0 - dot(d, d) * vignette * 2.0;
      c.rgb *= clamp(v, 0.0, 1.0);

      /* grain, strongest in the mids — film is clean in the blacks and the blowouts */
      float g = hash(vUv * 900.0 + fract(time) * 100.0) - 0.5;
      c.rgb += g * grain * (0.35 + l * (1.0 - l) * 2.6);

      gl_FragColor = vec4(max(c.rgb, 0.0), c.a);
    }`,
}

/**
 * Build the chain.
 *
 * Order matters and is not arbitrary:
 *
 *   render → occlusion → bloom → tone map → grade
 *
 * Occlusion and bloom both belong in **linear HDR**, before tone mapping — bloom
 * especially, or only the pixels that already clipped would glow. The grade goes
 * after `OutputPass`, which is what performs the tone mapping and the sRGB
 * conversion, so vignette and grain land on display values.
 */
export function createPost(renderer, scene, camera, { width, height }) {
  const composer = new EffectComposer(renderer)
  composer.setSize(width, height)

  composer.addPass(new RenderPass(scene, camera))

  /**
   * Occlusion and bloom are **out of the chain**, not turned down.
   *
   * A pass costs what it costs whether or not its output is used. Bloom was left at
   * strength 0 when the haze was removed, which meant every downsample and upsample
   * still ran each frame to produce nothing at all. And `GTAOPass` re-renders the
   * whole scene twice more — once for depth, once for normals — which is why a
   * scene of ~150 objects was submitting **321 draw calls**.
   *
   * Between them that is the largest single cost in the frame, and the target is
   * 60fps. What survives is the cheap half: tone mapping, and one full-screen grade
   * for the vignette and the grain.
   *
   * Both are one line away if the budget ever allows them again — the imports and
   * the tuned parameters are kept in the git history, and the reasoning for their
   * settings is in ADR-0021.
   */



  /* Tone mapping and sRGB happen here, reading `renderer.toneMapping` and
     `renderer.toneMappingExposure` — so `__unit.setLight({ exposure })` still works. */
  composer.addPass(new OutputPass())

  const grade = new ShaderPass(GradeShader)
  grade.renderToScreen = true
  composer.addPass(grade)

  let enabled = true

  return {
    composer,
    /** Called once a frame from the render loop. */
    render(t) {
      grade.uniforms.time.value = t
      if (enabled) composer.render()
      else renderer.render(scene, camera)
    },
    setSize(w, h) { composer.setSize(w, h) },
    /** `__unit.setPost()` — every one of these needs eyes on it. */
    set({ on, grain, vignette, saturation, lift }) {
      if (on !== undefined) enabled = !!on
      if (grain !== undefined) grade.uniforms.grain.value = grain
      if (lift !== undefined) grade.uniforms.lift.value.setHex(lift)
      if (vignette !== undefined) grade.uniforms.vignette.value = vignette
      if (saturation !== undefined) grade.uniforms.saturation.value = saturation
      return {
        on: enabled,
        grain: grade.uniforms.grain.value, vignette: grade.uniforms.vignette.value,
        lift: '#' + grade.uniforms.lift.value.getHexString(),
        saturation: grade.uniforms.saturation.value,
      }
    },
  }
}

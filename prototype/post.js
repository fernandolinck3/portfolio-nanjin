import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

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

    /**
     * The low-fi register, folded in here rather than added as a pass.
     *
     * This file argues one line above that *a pass costs what it costs whether or
     * not its output is used*, and that is why occlusion and bloom are out of the
     * chain rather than turned down. A separate quantise pass would have made the
     * same mistake: a second full-screen draw, paid on every frame, to do nothing
     * whenever the register is off. Eleven instructions inside a pass that already
     * runs cost nothing measurable and cannot be forgotten in the chain.
     *
     * `lofi` is the master, and **at 0 this shader is the shipped one, pixel for
     * pixel** — the mix at the end collapses to the ungraded branch. That property
     * is the whole safety of the experiment: it is switched on, not converted to.
     */
    lofi: { value: 0 },       // 0..1 — how much of the quantised image survives
    levels: { value: 32 },    // colour steps per channel; 32 is the PS1's 5 bits
    dither: { value: 1 },     // 0..1 — strength of the ordered pattern

    /**
     * The Screen is exempt, and that is the whole design rather than a concession.
     *
     * A register applied flat across the frame is an effect. This object cannot
     * afford one: the Screen is 320x180 and every word it says lives there, so a
     * pass that treats it like any other surface trades the content for a texture.
     * The first version of this did exactly that and the Screen became unreadable —
     * which is not a matter of degree, it is the pass being wrong about what it is
     * looking at.
     *
     * So the quantiser is told where the Screen is. `sq0..sq3` are its four corners
     * projected into UV, updated every frame from the same camera that drew them, and
     * inside that quad the strength falls from `lofi` to `lofiScreen` — not to zero,
     * because a display sitting in a quantised room and showing none of it reads as
     * pasted on. A trace of the register keeps it in the same picture; the type stays
     * legible because the *palette* is what softens, never the resolution.
     */
    sq0: { value: new THREE.Vector2() }, sq1: { value: new THREE.Vector2() },
    sq2: { value: new THREE.Vector2() }, sq3: { value: new THREE.Vector2() },
    maskOn: { value: 0 },        // 0 = flat register, 1 = the Screen is protected
    lofiScreen: { value: 0 },    // what survives *inside* the Screen. Zero: he asked twice.
    feather: { value: 0.004 },   // soft edge, in the cross-product's own units
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
    uniform float lofi, levels, dither;
    uniform vec2 sq0, sq1, sq2, sq3;
    uniform float maskOn, lofiScreen, feather;
    uniform vec3 lift, gain;
    varying vec2 vUv;

    /* cheap hash — no texture fetch, no repeat pattern to spot */
    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    /**
     * Ordered dither, 8x8, built by recursion instead of a lookup table.
     *
     * The obvious way to write a Bayer matrix is a constant array indexed by the
     * pixel, and the obvious way is the one that does not compile everywhere:
     * GLSL ES 1.0 forbids indexing a constant array by a non-constant expression.
     * This is the standard closed form instead — a 2x2 that recurses into 4x4 and
     * 8x8 — and it is pure arithmetic, so it has no such restriction.
     *
     * It is fed gl_FragCoord, which is **the internal buffer's pixel grid, not the
     * page's**. That is the entire point: when the buffer is smaller than the canvas
     * the pattern is one chunky dot per rendered pixel, upscaled by the browser
     * along with everything else. Feed it vUv scaled by anything and it becomes
     * fine noise that reads as grain, which this shader already has and does not
     * need twice.
     */
    float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
    float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

    /**
     * Is this pixel inside the Screen?
     *
     * Four edges, one cross product each, and the sign of a fifth against a corner
     * to learn which way the quad wound this frame — a projected quad flips its
     * winding as the object tilts, and a test that assumes one direction protects
     * the whole frame *except* the Screen the moment it flips.
     *
     * No perspective divide beyond the one already done on the CPU: the Screen is a
     * planar quad, so its projection is a convex quad in UV and four half-plane tests
     * are exact for it.
     */
    float edgeOf(vec2 p, vec2 a, vec2 b) {
      vec2 e = b - a, v = p - a;
      return e.x * v.y - e.y * v.x;
    }
    float insideScreen(vec2 p) {
      float w = sign(edgeOf(sq2, sq0, sq1));
      float d = min(
        min(edgeOf(p, sq0, sq1) * w, edgeOf(p, sq1, sq2) * w),
        min(edgeOf(p, sq2, sq3) * w, edgeOf(p, sq3, sq0) * w));
      return smoothstep(0.0, max(feather, 1e-5), d);
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

      c.rgb = max(c.rgb, 0.0);

      /**
       * Quantise last, because quantising is the last thing a display does.
       *
       * The grade, the vignette and the grain all describe a continuous image; the
       * register being borrowed here is what happens when that image is written to
       * a framebuffer that cannot hold it. Doing it before the grain would let the
       * grain re-introduce values the palette does not have, which is the same as
       * not quantising at all.
       *
       * The dither offset is scaled by one step of the palette: it is there to
       * decide which of the two neighbouring steps a pixel lands on, not to add
       * brightness. At dither 0 the same code is a hard posterise, and the banding
       * that appears is the argument for the pattern.
       */
      float k = lofi;
      if (maskOn > 0.5) k = mix(lofi, lofiScreen * lofi, insideScreen(vUv));
      if (k > 0.0) {
        /* not named "step": that is a GLSL built-in, and shadowing a built-in with
           a variable is legal in the spec and rejected by some drivers. */
        float band = 1.0 / max(levels, 2.0);
        vec3 q = c.rgb + (bayer8(gl_FragCoord.xy) - 0.5) * band * dither;
        c.rgb = mix(c.rgb, floor(q / band + 0.5) * band, k);
      }

      gl_FragColor = vec4(max(c.rgb, 0.0), c.a);
    }`,
}

/* ---------------------------------------------------------------------------
 * O bloom, escrito à mão — e por que não é o `UnrealBloomPass` de volta
 * ------------------------------------------------------------------------- */

/**
 * `UnrealBloomPass` custava um terço do quadro, medido: com ele o quadro ia a média
 * 74 e p90 172, sem ele a média 53 e p90 144 (ADR-0021). Ele faz cinco passagens de
 * *Gauss separável* — duas passagens por nível, horizontal e vertical, com treze
 * amostras cada — mais um passe de composição com curva. É qualidade de filme e é
 * caro, e o alvo aqui é 90fps.
 *
 * Este é o outro filtro conhecido pelo mesmo resultado: **dual filtering**, o de
 * Marius Bjørge. A cadeia desce por mips com cinco amostras bilineares por pixel e
 * sobe com oito, e é a interpolação bilinear da GPU que faz o borrão — não um kernel.
 * Cada nível tem um quarto da área do anterior, então a cadeia inteira custa cerca de
 * um terço de um passe em resolução cheia, e o primeiro nível já é a metade.
 *
 * **Nenhuma dependência nova.** `Pass` e `FullScreenQuad` vêm de `three/examples/jsm`,
 * que já está dentro do pacote `three` — o ADR-0003 aceitou o peso do three e este
 * arquivo inteiro se move dentro dele. Um `mipmapBlur` de biblioteca exigiria o pacote
 * `postprocessing`, que é uma dependência de runtime e uma decisão de ADR.
 *
 * O limiar é 2.6 e não 0.85, e a razão está no ADR-0021: isto roda em **HDR linear
 * antes do tone mapping**, com exposição bem acima de 1, então quase toda superfície
 * iluminada já passa de 1.0 e qualquer limiar abaixo de um faz a sala inteira brilhar.
 * A primeira montagem virou névoa, não luz.
 */
const CORTE = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 passo;
  uniform float limiar;
  uniform float joelho;
  varying vec2 vUv;
  void main() {
    /* cinco amostras: o centro e as quatro diagonais a meio texel — a bilinear da
       GPU já lê quatro texels em cada uma, então são vinte texels por quatro fetches */
    vec3 c = texture2D(tDiffuse, vUv).rgb * 4.0;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x, -passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2( passo.x, -passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x,  passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2( passo.x,  passo.y)).rgb;
    c /= 8.0;

    /**
     * O joelho: um limiar duro pisca.
     *
     * Sem ele, um pixel que atravessa 2.6 entra na cadeia inteiro no quadro seguinte
     * e sai inteiro no outro — a chama de uma Vela cintilando em volta do limiar
     * ligaria e desligaria o halo dela. A curva quadrática entre "limiar - joelho" e
     * "limiar + joelho" faz a entrada ser contínua, que é o que a torna luz.
     */
    float b = max(c.r, max(c.g, c.b));
    float macio = clamp(b - limiar + joelho, 0.0, 2.0 * joelho);
    macio = macio * macio / (4.0 * joelho + 1e-4);
    float k = max(macio, b - limiar) / max(b, 1e-4);
    gl_FragColor = vec4(c * k, 1.0);
  }`

const DESCE = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 passo;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb * 4.0;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x, -passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2( passo.x, -passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x,  passo.y)).rgb;
    c += texture2D(tDiffuse, vUv + vec2( passo.x,  passo.y)).rgb;
    gl_FragColor = vec4(c / 8.0, 1.0);
  }`

/** A subida, com o filtro de tenda de oito amostras que dá o borrão largo. */
const SOBE = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 passo;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tDiffuse, vUv + vec2(-passo.x * 2.0, 0.0)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x, passo.y)).rgb * 2.0;
    c += texture2D(tDiffuse, vUv + vec2(0.0, passo.y * 2.0)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(passo.x, passo.y)).rgb * 2.0;
    c += texture2D(tDiffuse, vUv + vec2(passo.x * 2.0, 0.0)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(passo.x, -passo.y)).rgb * 2.0;
    c += texture2D(tDiffuse, vUv + vec2(0.0, -passo.y * 2.0)).rgb;
    c += texture2D(tDiffuse, vUv + vec2(-passo.x, -passo.y)).rgb * 2.0;
    gl_FragColor = vec4(c / 12.0, 1.0);
  }`

const SOMA = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform sampler2D tBloom;
  uniform float forca;
  varying vec2 vUv;
  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(base.rgb + texture2D(tBloom, vUv).rgb * forca, base.a);
  }`

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const mat = (frag, uniforms) => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, fragmentShader: frag,
  depthTest: false, depthWrite: false,
})

class BloomPass extends Pass {
  /**
   * @param {number} niveis quantas vezes a cadeia desce. Cinco a 1920 leva o menor
   *   mip a 60 pixels de largura, que é o raio do halo mais largo.
   */
  constructor(width, height, { forca = .30, limiar = 2.6, joelho = .8, niveis = 5 } = {}) {
    super()
    this.needsSwap = true
    this.niveis = niveis
    this.mips = []
    this.corteMat = mat(CORTE, {
      tDiffuse: { value: null }, passo: { value: new THREE.Vector2() },
      limiar: { value: limiar }, joelho: { value: joelho },
    })
    this.desceMat = mat(DESCE, { tDiffuse: { value: null }, passo: { value: new THREE.Vector2() } })
    this.sobeMat = mat(SOBE, { tDiffuse: { value: null }, passo: { value: new THREE.Vector2() } })
    this.sobeMat.blending = THREE.AdditiveBlending
    this.somaMat = mat(SOMA, {
      tDiffuse: { value: null }, tBloom: { value: null }, forca: { value: forca },
    })
    this.quad = new FullScreenQuad(this.corteMat)
    this.setSize(width, height)
  }

  get forca() { return this.somaMat.uniforms.forca.value }
  set forca(v) { this.somaMat.uniforms.forca.value = v }
  get limiar() { return this.corteMat.uniforms.limiar.value }
  set limiar(v) { this.corteMat.uniforms.limiar.value = v }

  setSize(width, height) {
    for (const m of this.mips) m.dispose()
    this.mips = []
    let w = Math.max(1, Math.round(width / 2)), h = Math.max(1, Math.round(height / 2))
    for (let i = 0; i < this.niveis; i++) {
      const rt = new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType, format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
      })
      rt.texture.name = 'bloom' + i
      this.mips.push(rt)
      w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2))
    }
  }

  desenhar(renderer, alvo, material) {
    this.quad.material = material
    renderer.setRenderTarget(alvo)
    /* nunca limpar na subida: ela é aditiva sobre o mip que já está lá, e é essa
       soma que empilha os raios largos sobre os estreitos */
    if (material !== this.sobeMat) renderer.clear()
    this.quad.render(renderer)
  }

  render(renderer, writeBuffer, readBuffer) {
    const limparAntes = renderer.autoClear
    renderer.autoClear = false

    /* corte + primeira descida, numa passagem só */
    this.corteMat.uniforms.tDiffuse.value = readBuffer.texture
    this.corteMat.uniforms.passo.value.set(1 / readBuffer.width, 1 / readBuffer.height)
    this.desenhar(renderer, this.mips[0], this.corteMat)

    for (let i = 1; i < this.mips.length; i++) {
      const de = this.mips[i - 1]
      this.desceMat.uniforms.tDiffuse.value = de.texture
      this.desceMat.uniforms.passo.value.set(1 / de.width, 1 / de.height)
      this.desenhar(renderer, this.mips[i], this.desceMat)
    }

    for (let i = this.mips.length - 1; i > 0; i--) {
      const de = this.mips[i]
      this.sobeMat.uniforms.tDiffuse.value = de.texture
      this.sobeMat.uniforms.passo.value.set(1 / de.width, 1 / de.height)
      this.desenhar(renderer, this.mips[i - 1], this.sobeMat)
    }

    this.somaMat.uniforms.tDiffuse.value = readBuffer.texture
    this.somaMat.uniforms.tBloom.value = this.mips[0].texture
    this.quad.material = this.somaMat
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    renderer.clear()
    this.quad.render(renderer)

    renderer.autoClear = limparAntes
  }

  dispose() {
    for (const m of this.mips) m.dispose()
    this.corteMat.dispose(); this.desceMat.dispose()
    this.sobeMat.dispose(); this.somaMat.dispose()
    this.quad.dispose()
  }
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
export function createPost(renderer, scene, camera, { width, height, screen }) {
  const composer = new EffectComposer(renderer)
  composer.setSize(width, height)

  /**
   * The Screen's four corners, in world space, computed once.
   *
   * It is a horizontal quad on the Plate's face — the object is looked at from
   * above — so the corners are the rectangle `screen` describes, and they never
   * move relative to the Unit. What moves is the camera, which is why they are
   * projected every frame rather than stored as UV.
   */
  const corners = screen ? [
    new THREE.Vector3(screen.centre.x - screen.w / 2, screen.centre.y, screen.centre.z - screen.d / 2),
    new THREE.Vector3(screen.centre.x + screen.w / 2, screen.centre.y, screen.centre.z - screen.d / 2),
    new THREE.Vector3(screen.centre.x + screen.w / 2, screen.centre.y, screen.centre.z + screen.d / 2),
    new THREE.Vector3(screen.centre.x - screen.w / 2, screen.centre.y, screen.centre.z + screen.d / 2),
  ] : null
  const projected = new THREE.Vector3()

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
   *
   * ## O bloom voltou como opção, e **entra e sai da cadeia**
   *
   * A primeira lição do ADR é literal: *um passe custa o que custa, use-se ou não o
   * resultado dele*. Deixar o bloom montado com força 0 foi exatamente o desperdício
   * que ninguém acharia olhando para a tela. Então `ligar` não é um uniforme — é
   * `insertPass` e `removePass`. Desligado, ele não existe no laço.
   *
   * Ele começa **desligado**, e isso não é timidez: a segunda lição do ADR é que o
   * único número confiável saiu do contador de FPS do laço real, e `rAF` não dispara
   * em aba automatizada. Ligar por padrão seria eu decidir por uma medição que eu não
   * posso fazer. O botão BLOOM na bancada existe para que a medição seja feita onde
   * ela vale — na janela dele, com o contador na tela.
   */
  let bloom = null

  /** Põe o bloom entre o render e o tone mapping, que é onde o HDR linear ainda existe. */
  function ligarBloom(liga) {
    if (liga === !!bloom) return !!bloom
    if (!liga) { composer.removePass(bloom); bloom.dispose(); bloom = null; return false }
    bloom = new BloomPass(composer._width || width, composer._height || height)
    /* índice 1: depois do `RenderPass`, antes do `OutputPass`. Depois do tone mapping
       só existiriam os pixels que já estouraram, e um halo em cima deles é fumaça. */
    composer.insertPass(bloom, 1)
    composer.setSize(composer._width || width, composer._height || height)
    return true
  }

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
      /* Only while the mask is doing something. Four `project()` calls are cheap and
         four of them every frame for a register nobody turned on is still four more
         than nothing, and this file's whole argument is that unused work gets paid
         for anyway. */
      if (corners && grade.uniforms.maskOn.value > 0.5 && grade.uniforms.lofi.value > 0) {
        const u = [grade.uniforms.sq0, grade.uniforms.sq1, grade.uniforms.sq2, grade.uniforms.sq3]
        for (let i = 0; i < 4; i++) {
          projected.copy(corners[i]).project(camera)
          u[i].value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5)
        }
      }
      if (enabled) composer.render()
      else renderer.render(scene, camera)
    },
    setSize(w, h) { composer.setSize(w, h) },
    /**
     * The composer keeps its **own** pixel ratio, and this is the only way to move it.
     *
     * `EffectComposer` reads `renderer.getPixelRatio()` once, in its constructor, and
     * multiplies every render target by that number from then on. So a caller that
     * lowers the renderer's ratio and stops there gets a canvas that shrinks and a
     * chain that does not: the scene is still rasterised at the old size and handed
     * to a smaller canvas at the end. The picture changes and the frame time does
     * not — which is the exact opposite of the point when the ratio is being lowered
     * to buy back a frame.
     */
    setPixelRatio(r) { composer.setPixelRatio(r) },
    /** `__unit.setPost()` — every one of these needs eyes on it. */
    set({ on, grain, vignette, saturation, lift, lofi, levels, dither,
          maskOn, lofiScreen, feather, bloom: quer, bloomForca, bloomLimiar }) {
      if (on !== undefined) enabled = !!on
      if (quer !== undefined) ligarBloom(!!quer)
      if (bloom && bloomForca !== undefined) bloom.forca = bloomForca
      if (bloom && bloomLimiar !== undefined) bloom.limiar = bloomLimiar
      if (grain !== undefined) grade.uniforms.grain.value = grain
      if (lift !== undefined) grade.uniforms.lift.value.setHex(lift)
      if (vignette !== undefined) grade.uniforms.vignette.value = vignette
      if (saturation !== undefined) grade.uniforms.saturation.value = saturation
      if (lofi !== undefined) grade.uniforms.lofi.value = lofi
      if (levels !== undefined) grade.uniforms.levels.value = levels
      if (dither !== undefined) grade.uniforms.dither.value = dither
      if (maskOn !== undefined) grade.uniforms.maskOn.value = maskOn ? 1 : 0
      if (lofiScreen !== undefined) grade.uniforms.lofiScreen.value = lofiScreen
      if (feather !== undefined) grade.uniforms.feather.value = feather
      return {
        on: enabled,
        grain: grade.uniforms.grain.value, vignette: grade.uniforms.vignette.value,
        lift: '#' + grade.uniforms.lift.value.getHexString(),
        saturation: grade.uniforms.saturation.value,
        lofi: grade.uniforms.lofi.value, levels: grade.uniforms.levels.value,
        dither: grade.uniforms.dither.value,
        maskOn: grade.uniforms.maskOn.value > 0.5,
        lofiScreen: grade.uniforms.lofiScreen.value,
        feather: grade.uniforms.feather.value,
        bloom: !!bloom,
        bloomForca: bloom ? bloom.forca : null,
        bloomLimiar: bloom ? bloom.limiar : null,
        screenKnown: !!corners,
      }
    },
  }
}

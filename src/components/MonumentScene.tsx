import { useEffect, useRef, type MutableRefObject } from 'react'
import { drawWordmark } from '../wordmark/texture'
import { registerContextLossHandler } from './webglContext'

type PointerTarget = MutableRefObject<{ x: number; y: number }>

type MonumentSceneProps = {
  lines: string[]
  active: boolean
  reducedMotion: boolean
  pointerTarget: PointerTarget
  decayRef: MutableRefObject<number>
  onReady: () => void
  onFailure: () => void
}

const vertexShader = /* glsl */ `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

/**
 * Phosphor decay applied to the letterforms themselves: chromatic separation
 * toward the signal red, bloom sampled from the glyph field, scanlines, grain
 * and intermittent dropout. No second hue enters anywhere.
 */
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uWordmark;
  uniform float uTime;
  uniform float uDecay;
  uniform vec2 uPointer;
  uniform vec2 uTexel;
  uniform vec3 uInk;
  uniform vec3 uSignal;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float glyph(vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return texture2D(uWordmark, uv).a;
  }

  /** Cheap bloom: a ring of taps around the sample point. */
  float bloom(vec2 uv, float radius) {
    float sum = 0.0;
    sum += glyph(uv + vec2(uTexel.x, 0.0) * radius);
    sum += glyph(uv - vec2(uTexel.x, 0.0) * radius);
    sum += glyph(uv + vec2(0.0, uTexel.y) * radius);
    sum += glyph(uv - vec2(0.0, uTexel.y) * radius);
    sum += glyph(uv + uTexel * radius);
    sum += glyph(uv - uTexel * radius);
    return sum / 6.0;
  }

  void main() {
    vec2 uv = vUv;

    /** Horizontal tear bands that drift slowly and widen as the section decays. */
    float band = floor(uv.y * 34.0);
    float tear = hash(vec2(band, floor(uTime * 0.6))) - 0.5;
    float tearAmount = (0.0016 + uDecay * 0.02) *
      step(0.86 - uDecay * 0.25, hash(vec2(band, floor(uTime * 0.6) + 11.0)));
    uv.x += tear * tearAmount;

    /** Pointer pulls the field with a shallow parallax. */
    uv += uPointer * vec2(0.006, 0.008) * (1.0 - uDecay);

    /** Chromatic separation grows with pointer distance and decay. */
    float split = (0.0012 + uDecay * 0.006) + abs(uPointer.x) * 0.0022;

    float centre = glyph(uv);
    float left = glyph(uv + vec2(split, 0.0));
    float right = glyph(uv - vec2(split, 0.0));

    float halo = bloom(uv, 2.2 + uDecay * 5.0);

    /** Ink body, with the separated edges tinted toward the single signal red. */
    vec3 color = uInk * centre;
    color += uSignal * max(left - centre, 0.0) * 1.15;
    color += uSignal * max(right - centre, 0.0) * 0.55;
    color += uSignal * halo * (0.10 + uDecay * 0.26);
    color += uInk * halo * 0.05;

    float coverage = max(centre, max(left, right));
    float alpha = clamp(coverage + halo * (0.32 + uDecay * 0.4), 0.0, 1.0);

    /** Scanlines and grain sit on the ink only, never on the empty field. */
    float scan = 0.86 + 0.14 * sin(vUv.y * 900.0 - uTime * 1.4);
    color *= mix(1.0, scan, 0.5 + uDecay * 0.3);

    float grain = (hash(gl_FragCoord.xy + floor(uTime * 14.0)) - 0.5) * 0.10;
    color += grain * coverage;

    /** Dropout: whole scan rows briefly lose signal. */
    float dropRow = floor(vUv.y * 120.0);
    float drop = step(0.982 - uDecay * 0.12, hash(vec2(dropRow, floor(uTime * 5.0))));
    color *= 1.0 - drop * 0.75;
    alpha *= 1.0 - drop * 0.5;

    /** The monument recedes and dims as the visitor leaves the threshold. */
    alpha *= 1.0 - uDecay * 0.55;

    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('shader allocation failed')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`shader compile failed: ${log}`)
  }

  return shader
}

function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta))
}

const INK: [number, number, number] = [0xed / 255, 0xe9 / 255, 0xe4 / 255]
const SIGNAL: [number, number, number] = [0xe2 / 255, 0x32 / 255, 0x1c / 255]

/**
 * Raw WebGL rather than a scene graph. The monument is one quad with one
 * shader, so a 3D engine would add roughly 860 kB to render two triangles.
 */
export default function MonumentScene({
  lines,
  active,
  reducedMotion,
  pointerTarget,
  decayRef,
  onReady,
  onFailure,
}: MonumentSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** Read inside the render loop so changes never restart the context. */
  const stateRef = useRef({ active, reducedMotion })
  stateRef.current = { active, reducedMotion }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      }) as WebGLRenderingContext | null) ?? null

    if (!gl) {
      onFailure()
      return
    }

    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let texture: WebGLTexture | null = null
    let unregisterContextLoss: (() => void) | null = null
    let frame = 0
    let disposed = false

    try {
      const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader)
      const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader)

      program = gl.createProgram()
      if (!program) throw new Error('program allocation failed')

      gl.attachShader(program, vertex)
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`link failed: ${gl.getProgramInfoLog(program)}`)
      }

      gl.useProgram(program)

      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      )

      const position = gl.getAttribLocation(program, 'aPosition')
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

      const source = drawWordmark(lines, 2048)
      texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      /** The wordmark is not power-of-two, so mipmaps and repeat are unavailable. */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

      const uniform = (name: string) => gl.getUniformLocation(program!, name)
      const uWordmark = uniform('uWordmark')
      const uTime = uniform('uTime')
      const uDecay = uniform('uDecay')
      const uPointer = uniform('uPointer')
      const uTexel = uniform('uTexel')
      const uInk = uniform('uInk')
      const uSignal = uniform('uSignal')

      gl.uniform1i(uWordmark, 0)
      gl.uniform2f(uTexel, 1 / source.width, 1 / source.height)
      gl.uniform3fv(uInk, INK)
      gl.uniform3fv(uSignal, SIGNAL)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      unregisterContextLoss = registerContextLossHandler(canvas, onFailure)

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
        if (canvas.width === width && canvas.height === height) return
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }

      const observer =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
      observer?.observe(canvas)
      resize()

      const pointer = { x: 0, y: 0 }
      let elapsed = 0
      let last = performance.now()

      const render = (now: number) => {
        if (disposed) return

        const delta = Math.min((now - last) / 1000, 0.1)
        last = now

        const { active: isActive, reducedMotion: isReduced } = stateRef.current

        pointer.x = damp(pointer.x, pointerTarget.current.x, 3.2, delta)
        pointer.y = damp(pointer.y, pointerTarget.current.y, 3.2, delta)

        if (isActive && !isReduced) elapsed += delta

        gl.uniform1f(uTime, elapsed)
        gl.uniform1f(uDecay, decayRef.current)
        gl.uniform2f(uPointer, pointer.x, pointer.y)

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        frame = requestAnimationFrame(render)
      }

      frame = requestAnimationFrame(render)
      onReady()

      return () => {
        disposed = true
        cancelAnimationFrame(frame)
        observer?.disconnect()
        unregisterContextLoss?.()
        gl.deleteTexture(texture)
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        /**
         * Deliberately does NOT call `WEBGL_lose_context`. The canvas element
         * survives a remount, and a context lost that way can never be
         * recreated on it — which breaks the scene under StrictMode's double
         * mount. Dropping the resources above is enough; the context itself is
         * reclaimed with the element.
         */
      }
    } catch (error) {
      disposed = true
      cancelAnimationFrame(frame)
      unregisterContextLoss?.()
      if (texture) gl.deleteTexture(texture)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      /** Never fail silently — the fallback hides the symptom otherwise. */
      console.error('[monument] scene initialisation failed', error)
      onFailure()
      return
    }
    /**
     * Deliberately excludes `active` and `reducedMotion` — those are read from
     * a ref so toggling them never tears down the GL context.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, pointerTarget, decayRef, onReady, onFailure])

  return (
    <div className="monument__canvas" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

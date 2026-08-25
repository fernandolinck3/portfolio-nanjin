import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Wordmark } from './Wordmark'

const MonumentScene = lazy(() => import('./MonumentScene'))

type SceneBoundaryProps = {
  children: ReactNode
  onFailure: () => void
}

class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function canUseWebGL(canvas: HTMLCanvasElement): boolean {
  try {
    return Boolean(
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }),
    )
  } catch {
    return false
  }
}

type MonumentProps = {
  lines: string[]
  /** The readable name. Kept alongside the art so it can never be lost. */
  label: string
  reducedMotion: boolean
  decayRef: MutableRefObject<number>
}

/**
 * The name as the page's one interactive object. The inline SVG is the
 * baseline and always renders; WebGL layers over it and is removed on any
 * failure without taking the monument with it.
 */
export function Monument({ lines, label, reducedMotion, decayRef }: MonumentProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pointerTarget = useRef({ x: 0, y: 0 })
  const [webglAvailable, setWebglAvailable] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(true)

  useEffect(() => {
    setWebglAvailable(canUseWebGL(document.createElement('canvas')))
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(!document.hidden)
    onVisibilityChange()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (!frameRef.current || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.02 },
    )

    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [])

  /** Pointer is tracked across the whole viewport, not just the glyph box. */
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  /**
   * Stable identities: the scene tears down and rebuilds its GL context when
   * these change, so inline closures would thrash it on every render.
   */
  const handleSceneFailure = useCallback(() => {
    setSceneReady(false)
    setSceneFailed(true)
  }, [])

  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  return (
    <div
      className="monument"
      ref={frameRef}
      data-enhanced={sceneReady ? 'true' : 'false'}
    >
      <span className="sr-only">{label}</span>
      <Wordmark className="monument__svg" lines={lines} />

      {webglAvailable && !sceneFailed ? (
        <SceneBoundary onFailure={handleSceneFailure}>
          <Suspense fallback={null}>
            <MonumentScene
              lines={lines}
              active={isVisible && documentVisible}
              reducedMotion={reducedMotion}
              pointerTarget={pointerTarget}
              decayRef={decayRef}
              onReady={handleSceneReady}
              onFailure={handleSceneFailure}
            />
          </Suspense>
        </SceneBoundary>
      ) : null}
    </div>
  )
}

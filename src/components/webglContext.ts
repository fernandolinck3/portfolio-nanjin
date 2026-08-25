/**
 * Reports genuine context loss.
 *
 * Returns an unregister function that MUST be called before any deliberate
 * teardown — releasing the context ourselves also fires `webglcontextlost`,
 * and treating that as a failure would permanently disable the enhancement.
 */
export function registerContextLossHandler(
  canvas: HTMLCanvasElement,
  onFailure: () => void,
) {
  const onContextLost = (event: Event) => {
    /** Preventing the default keeps the canvas restorable. */
    event.preventDefault()
    onFailure()
  }

  canvas.addEventListener('webglcontextlost', onContextLost)

  return () => canvas.removeEventListener('webglcontextlost', onContextLost)
}

/** Keep body-mounted notices out of frame-mounted controls without changing the camera. */
export function observeNotices() {
  const notices = document.getElementById('avisos')
  const touch = document.querySelector('.touch')
  const root = document.documentElement
  const update = () => {
    root.style.setProperty('--notice-height', `${notices?.getBoundingClientRect().height || 0}px`)
    root.style.setProperty('--touch-height', `${touch?.offsetHeight || 0}px`)
  }
  const observer = new ResizeObserver(update)
  if (notices) observer.observe(notices)
  if (touch) observer.observe(touch)
  update()
  return () => observer.disconnect()
}

/** Normalize a canvas hit after the frame's clockwise quarter-turn. */
export function canvasPoint(event, rect, width, height, rotated = false) {
  if (!rect.width || !rect.height) return null
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  return rotated ? [y * width, (1 - x) * height] : [x * width, y * height]
}

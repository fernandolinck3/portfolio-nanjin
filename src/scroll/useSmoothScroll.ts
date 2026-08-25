import Lenis from 'lenis'
import { useEffect, useState } from 'react'

/**
 * Virtual smooth scroll. Disabled entirely under `prefers-reduced-motion`, in
 * which case the browser's native scrolling is left untouched.
 *
 * Anchor links, keyboard navigation and find-in-page must keep working, so the
 * scroller never captures input beyond the wheel/touch smoothing itself.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      /**
       * Touch devices keep native scrolling — smoothing there fights the OS
       * and breaks momentum on iOS.
       */
      syncTouch: false,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    /** Keep in-page anchors working with the virtual scroller. */
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]')
      if (!anchor) return

      const id = anchor.getAttribute('href')?.slice(1)
      if (!id) return

      const target = document.getElementById(id)
      if (!target) return

      event.preventDefault()
      lenis.scrollTo(target, { offset: 0 })
      /** Preserve focus semantics that preventDefault would otherwise drop. */
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }

    document.addEventListener('click', onAnchorClick)

    return () => {
      document.removeEventListener('click', onAnchorClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [enabled])
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return reducedMotion
}

/**
 * Progress of the visitor through an element, from 0 when its top meets the
 * viewport top to 1 when it has been scrolled entirely past.
 */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0

    const measure = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const travel = rect.height || 1
      const next = Math.min(Math.max(-rect.top / travel, 0), 1)
      setProgress(next)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])

  return progress
}

import { useEffect } from 'react'

/* The border beam is animated by CSS through a registered custom property. If that animation
   is not advancing - an engine without @property support, a frozen timeline, anything - the
   ring would sit still and look broken. One check a second after load, then a cheap 12 fps
   driver only if it is actually needed. */
export function useBeamFallback(): void {
  useEffect(() => {
    const root = document.documentElement
    const angle = () => parseFloat(getComputedStyle(root).getPropertyValue('--beam-a')) || 0
    let inner = 0, raf = 0, stopped = false

    const outer = window.setTimeout(() => {
      const a = angle()
      inner = window.setTimeout(() => {
        if (Math.abs(angle() - a) > 0.05) return /* CSS is doing its job */
        let deg = a, last = 0
        const spin = (now: number) => {
          if (stopped) return
          raf = requestAnimationFrame(spin)
          if (document.hidden || now - last < 80) return /* 12 fps is plenty for a slow sweep */
          deg = (deg + (now - last) * 0.042) % 360; last = now /* 42 deg per second, the resting speed */
          root.style.setProperty('--beam-a', deg.toFixed(1) + 'deg')
        }
        spin(0)
      }, 700)
    }, 900)

    return () => {
      stopped = true
      clearTimeout(outer)
      clearTimeout(inner)
      cancelAnimationFrame(raf)
    }
  }, [])
}

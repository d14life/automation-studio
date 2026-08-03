import { useEffect } from 'react'

/* Every quality decision on this page used to be a guess about the machine: "a phone is weak",
   "a desktop is fine". Then it lagged on Windows, where a desktop browser runs on integrated
   graphics and the whole page is fill-rate bound - a case neither guess covers.

   So the page stops guessing and measures. It watches the real frame rate for a moment after
   the first screen has settled, and if the machine is not keeping up it writes data-perf="low"
   on <html>. The CSS drops the expensive blurs from there, and the two canvas systems listen
   for the event and thin themselves out.

   One shot. It never upgrades back, because a page that keeps switching quality reads as broken.
   The window is deliberately late: the first seconds after load are always slow (fonts, first
   paint, WebGL init) and judging the machine on those was wrong. */

const SETTLE_MS = 2600
const SAMPLE_MS = 1800
/* Below this the page is visibly dropping frames on any display. A 60Hz screen that is coping
   sits at 58-60; anything at 45 is missing one frame in four, which is exactly what he feels. */
const FLOOR_FPS = 46

export function usePerfGuard(): void {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let stopped = false
    const settle = window.setTimeout(() => {
      let frames = 0
      let t0 = 0
      const tick = (now: number) => {
        if (stopped) return
        raf = requestAnimationFrame(tick)
        if (!t0) { t0 = now; return }
        /* a backgrounded tab reports nonsense: rAF stops, so the next delta is enormous */
        if (document.hidden) { t0 = 0; frames = 0; return }
        frames++
        if (now - t0 < SAMPLE_MS) return
        stopped = true
        cancelAnimationFrame(raf)
        const fps = frames / ((now - t0) / 1000)
        window.__perfFps = Math.round(fps) /* readable proof, for checking a real machine */
        if (fps < FLOOR_FPS) {
          document.documentElement.dataset.perf = 'low'
          dispatchEvent(new CustomEvent('perf-low'))
        }
      }
      raf = requestAnimationFrame(tick)
    }, SETTLE_MS)

    return () => {
      stopped = true
      clearTimeout(settle)
      cancelAnimationFrame(raf)
    }
  }, [])
}

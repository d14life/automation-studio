import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { isSmallDevice } from './heroTuning'

/** Starfield behind the whole document. Returns the ref for its host div (#space). */
export function useStarfield(ready: boolean): RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!ready || !host) return
    const SMALL = isSmallDevice()

    const stopStars = window.Starfield1(host, {
      /* spread is pinned to 1100 - the value the approved look had at 2200 stars - so the count
         below is now purely a count. Before this, the library derived spread from quantity, and
         raising the count pushed the whole field outward and lost the extras off the edges. */
      quantity: SMALL ? 900 : 4400,
      spread: SMALL ? 150 : 1100,
      /* 4400 stars redrawn every frame, for the whole life of the page, is the single largest
         standing cost on the desktop version. Uncapped it ran at the screen's refresh - 120 a
         second on this Mac. Capped to ~45 that is well under half the work, and because the
         drift is now measured against the clock rather than counted in frames, the field moves
         at exactly the same visible speed as before. */
      minFrameMs: SMALL ? 32 : 22,
      speed: SMALL ? 3.12 : 3.84,
      easing: 1,
      warpFactor: 10,
      opacity: 0.1,
      mouseAdjust: false,
      clickToWarp: false,
      starColor: 'rgba(255,255,255,1)',
      bgColor: 'rgba(0,0,0,1)',
      zIndex: 1,
    })

    /* Watchdog, phones only and only after the page has settled: at load the first seconds are
       always slow (fonts, first paint, scene init) and judging the machine on those was wrong. */
    let raf = 0
    let done = false
    const settle = SMALL ? window.setTimeout(() => {
      let frames = 0, t0 = 0
      const tick = (now: number) => {
        if (done) return
        raf = requestAnimationFrame(tick)
        if (!t0) { t0 = now; return }
        frames++
        if (now - t0 < 2000) return
        done = true
        const fps = frames / ((now - t0) / 1000)
        if (fps < 26 && stopStars && stopStars.setQuantity) stopStars.setQuantity(70)
      }
      tick(0)
    }, 3000) : 0

    return () => {
      done = true
      clearTimeout(settle)
      cancelAnimationFrame(raf)
      stopStars()
    }
  }, [ready])

  return hostRef
}

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

    /* The mobile field used to be 900 stars squeezed into a spread of 150 - a dense knot in the
       middle of the screen with empty corners, which is why the phone never looked like the Mac.
       The faithful match is the same DENSITY, not the same count: the Mac runs 4400 stars over a
       ~1520x864 window, so the spread scales with this screen's size and the count with its
       area. On a 375x812 phone that lands near 1100 stars over a spread of ~550. */
    const z = ((innerWidth || 1520) + (innerHeight || 864)) / 2
    const stopStars = window.Starfield1(host, {
      /* spread is pinned to 1100 - the value the approved look had at 2200 stars - so the count
         below is now purely a count. Before this, the library derived spread from quantity, and
         raising the count pushed the whole field outward and lost the extras off the edges. */
      quantity: SMALL ? Math.round(4400 * (innerWidth * innerHeight) / (1520 * 864)) : 4400,
      spread: SMALL ? Math.round(1100 * z / 1192) : 1100,
      /* 4400 stars redrawn every frame, for the whole life of the page, is the single largest
         standing cost on the desktop version. Uncapped it ran at the screen's refresh - 120 a
         second on this Mac. Capped to ~45 that is well under half the work, and because the
         drift is now measured against the clock rather than counted in frames, the field moves
         at exactly the same visible speed as before. */
      minFrameMs: SMALL ? 32 : 22,
      /* 30% slower on both versions - his word */
      speed: SMALL ? 2.18 : 2.69,
      easing: 1,
      warpFactor: 10,
      opacity: 0.1,
      mouseAdjust: false,
      clickToWarp: false,
      starColor: 'rgba(255,255,255,1)',
      bgColor: 'rgba(0,0,0,1)',
      zIndex: 1,
    })

    /* The page-wide frame guard: on a machine that is not coping, the field thins to a third
       rather than the page losing its stars. Thinning is free - the library keeps the same
       array and just shortens it. */
    const thin = () => { stopStars.setQuantity?.(Math.round((SMALL ? 1100 : 4400) * 0.34)) }
    if (document.documentElement.dataset.perf === 'low') thin()
    else addEventListener('perf-low', thin, { once: true })

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
      removeEventListener('perf-low', thin)
      clearTimeout(settle)
      cancelAnimationFrame(raf)
      stopStars()
    }
  }, [ready])

  return hostRef
}

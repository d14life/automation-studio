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
    const QTY = SMALL ? Math.round(4400 * 2.6 * (innerWidth * innerHeight) / (1520 * 864)) : 4400
    const stopStars = window.Starfield1(host, {
      /* spread is pinned to 1100 - the value the approved look had at 2200 stars - so the count
         below is now purely a count. Before this, the library derived spread from quantity, and
         raising the count pushed the whole field outward and lost the extras off the edges. */
      /* Matching the Mac's DENSITY gave a phone 913 stars, and his verdict on that was "too
         little" - which is right, because density per CSS pixel is not density per eye: a
         402px-wide phone is held close and covers far less of your view than a 1520px window.
         1.9x the faithful count is ~1735, and it is affordable now that it has been measured -
         the whole starfield costs 1.2fps of the 60 on this device, against the slogan melt's
         22.9. Cheap things can be generous. */
      quantity: QTY,
      /* "More in the middle." A star is drawn at cx + (x/z)*spread, and it is only drawn at all
         if that lands inside the canvas - so a smaller spread pulls the whole field inward and
         more of it survives the cull near the centre, where the far stars are thinnest and the
         field looked emptiest. 0.78x the spread with 2.6x the count fills the middle without
         thinning the edges. The x and y extents stay tied to the screen's own aspect (the
         library seeds x in [-w,w] and y in [-h,h]), so on a portrait phone the field is already
         taller than it is wide - it is not the Mac's landscape field cropped. */
      spread: SMALL ? Math.round(1100 * z / 1192 * 0.78) : 1100,
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
    /* was a hardcoded 1100 on small screens, which no longer had anything to do with the
       quantity actually being drawn - raising the count did nothing once this had fired. */
    const thin = () => { stopStars.setQuantity?.(Math.round(QTY * 0.45)) }
    if (document.documentElement.dataset.perf === 'low') thin()
    else addEventListener('perf-low', thin, { once: true })

    /* Watchdog, phones only and only after the page has settled: at load the first seconds are
       always slow (fonts, first paint, scene init) and judging the machine on those was wrong. */
    let raf = 0
    let done = false
    /* This is why the phone looked almost starless. It sampled 2s starting only 3s after load -
       squarely inside the window where the filmed clip is still starting, the melt is running
       its first morph and the fonts have just landed - and on a dip it cut the field to a
       hardcoded SEVENTY stars, permanently, with no way back. Raising the count could not be
       seen because this had already thrown it away.

       It samples from 6s now, when the page has actually settled, over 2.5s rather than 2, and
       a bad reading thins to 40% of the real count instead of a number picked out of the air.
       The field measured 1.2fps of 60 on this device, so this guard should almost never fire. */
    const settle = SMALL ? window.setTimeout(() => {
      let frames = 0, t0 = 0
      const tick = (now: number) => {
        if (done) return
        raf = requestAnimationFrame(tick)
        if (!t0) { t0 = now; return }
        frames++
        if (now - t0 < 2500) return
        done = true
        const fps = frames / ((now - t0) / 1000)
        if (fps < 24 && stopStars && stopStars.setQuantity) stopStars.setQuantity(Math.round(QTY * 0.4))
      }
      tick(0)
    }, 6000) : 0

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

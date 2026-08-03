import { useCallback, useEffect, useState } from 'react'
import { useTubeScene } from '@/hooks/useTubeScene'

/* The tubes live in their own fixed layer at the root, beside the starfield: the library sizes
   its canvas from the PARENT box, so the wrapper is what keeps the surface viewport-sized.

   Two ways to draw the same ribbons:

   LIVE - the WebGL scene. Eleven tubes whose geometry is rebuilt every frame, lit by four
   lights. On a machine that can afford it there is nothing better.

   FILMED - a clip of that exact scene, captured by record-tubes.html: same library, same figure,
   same sweep, same speed. Video decoding runs on a dedicated block of the chip rather than the
   shader cores, so a phone or an integrated-graphics laptop plays it without noticing. The
   ribbons do not follow the cursor on this site - that was switched off long ago - so a clip is
   not an approximation of the effect, it IS the effect.

   The first attempt at colour flooded his phone. The clip was filmed near-white and tinted by an
   overlay set to multiply inside an isolated group: correct on paper, and on iOS the video under
   that group never painted, so the multiply had nothing to multiply against and an opaque sheet
   of pale blue got screened over the entire page. The lesson is not "fix the blend" - it is that
   a colour which only looks right when a video paints underneath it must not exist. The colour
   now lives inside the clip, and the only compositing left is one screen blend on the video
   element itself, which is the best-supported form there is.

   Who gets which: a phone or tablet gets the clip from the start - that is the machine the live
   scene was hurting. A desktop gets the live scene, and falls back to the clip only if the frame
   guard finds it is not coping. */
export function TubeLayer({ ready, heroVisible }: { ready: boolean; heroVisible: boolean }) {
  const [filmed, setFilmed] = useState(false)
  /* if the clip never paints, the layer removes itself rather than sitting there as a black or
     coloured rectangle over the hero. Nothing is always better than something wrong. */
  const [dead, setDead] = useState(false)

  useEffect(() => {
    /* This used to be `isSmallDevice()`, which handed EVERY phone the clip - and that made the
       light phone build inside useTubeScene dead code it could never reach. The two files
       disagreed and the clip won.

       His call, 4 Aug, Mac beside phone: the phone must be the web version. Two of the three
       things he asked for are impossible with a clip, not merely wrong in it. The ribbons walk
       the ICE palette one step behind the slogan, recoloured every frame by setColors; a filmed
       frame has one fixed colour and can never do that. And the sweep is measured off the
       slogan's own ink each time it changes - a clip is stuck with the geometry of the screen it
       was filmed on. Only the live scene has either.

       So the test is now the same one useTubeScene already uses to opt out: a genuinely weak
       device, not merely a small one. Everything else runs the light build - 8 tubes, 5 radial
       segments, pixel ratio 1. usePerfGuard is still the safety net underneath: measure under
       46fps and `perf-low` swaps this layer to the clip mid-flight. */
    const WEAK = !!(navigator.deviceMemory && navigator.deviceMemory <= 3)
    if (WEAK || document.documentElement.dataset.perf === 'low') {
      setFilmed(true)
      return
    }
    const swap = () => setFilmed(true)
    addEventListener('perf-low', swap, { once: true })
    return () => removeEventListener('perf-low', swap)
  }, [])

  /* autoPlay+muted+playsInline is the recipe every browser honours, but a tab that loads in the
     background comes back paused, and some iOS builds want to be asked out loud. One nudge, then
     a watchdog: no frames after four seconds and the layer gives up. */
  const nudge = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return
    el.play().catch(() => { /* a browser that refuses: the watchdog below takes over */ })
    window.setTimeout(() => {
      const painted = el.readyState >= 2 && el.currentTime > 0
      if (!painted) setDead(true)
    }, 4000)
  }, [])

  /* the hook is called unconditionally - hooks must be - and builds nothing while filmed is on */
  const layerRef = useTubeScene(ready && !filmed, heroVisible)

  if (filmed) {
    if (dead) return null
    return (
      <div id="tubelayer" className="tubefilm">
        <video ref={nudge} src="/tubes-loop.mp4" autoPlay muted loop playsInline preload="auto" />
      </div>
    )
  }
  return <div id="tubelayer" ref={layerRef} />
}

import { useCallback, useEffect, useState } from 'react'
import { useTubeScene } from '@/hooks/useTubeScene'
import { isSmallDevice } from '@/hooks/heroTuning'

/* The tubes live in their own fixed layer at the root, beside the starfield: the library sizes
   its canvas from the PARENT box, so the wrapper is what keeps the surface viewport-sized.

   Two ways to draw the same ribbons:

   LIVE - the WebGL scene. Eleven tubes whose geometry is rebuilt every frame, lit by four
   lights. On a machine that can afford it there is nothing better.

   FILMED - a 236KB clip of that exact scene, captured by record-tubes.html: same library, same
   figure, same sweep, same speed. Video decoding runs on a dedicated block of the chip rather
   than the shader cores, so a phone or an integrated-graphics laptop plays it without noticing.
   The ribbons do not follow the cursor on this site - that was switched off long ago - so a clip
   is not an approximation of the effect, it IS the effect.

   The one thing a clip cannot do is change colour with the slogan, so the colour is not in the
   clip: it was filmed near-white and is tinted here, live, on the slogan's own palette clock.

   Who gets which: a phone or tablet gets the clip from the start - that is the machine the live
   scene was hurting. A desktop gets the live scene, and falls back to the clip only if the frame
   guard finds it is not coping. */
export function TubeLayer({ ready, heroVisible }: { ready: boolean; heroVisible: boolean }) {
  const [filmed, setFilmed] = useState(false)

  useEffect(() => {
    if (isSmallDevice() || document.documentElement.dataset.perf === 'low') {
      setFilmed(true)
      return
    }
    const swap = () => setFilmed(true)
    addEventListener('perf-low', swap, { once: true })
    return () => removeEventListener('perf-low', swap)
  }, [])

  /* autoPlay+muted+playsInline is the recipe every browser honours, but a tab that loads in the
     background comes back paused, and some iOS builds want to be asked out loud. One nudge. */
  const nudge = useCallback((el: HTMLVideoElement | null) => {
    if (el) el.play().catch(() => { /* a browser that refuses: the layer just sits still */ })
  }, [])

  /* the hook is called unconditionally - hooks must be - and builds nothing while filmed is on */
  const layerRef = useTubeScene(ready && !filmed, heroVisible)

  if (filmed) {
    return (
      <div id="tubelayer" className="tubefilm">
        <video ref={nudge} src="/tubes-loop.mp4" autoPlay muted loop playsInline preload="auto" />
        {/* multiply turns the white ribbons into the palette colour and leaves the black alone;
            the wrapper then adds the whole thing to the page with screen, so the black vanishes */}
        <i className="tubefilm-tint" aria-hidden="true" />
      </div>
    )
  }
  return <div id="tubelayer" ref={layerRef} />
}

import { useEffect, useRef } from 'react'
import { FLOW, ICE } from './heroTuning'

/* two lines, same timings, started in the same tick: they melt into the next phrase together */
export const SLOGAN_LINE_1 = ['АВТОМАТИЗИРУЕМ', 'БЫСТРО', 'ТОЛЬКО ПРАКТИКА']
export const SLOGAN_LINE_2 = ['БИЗНЕС-ПРОЦЕССЫ', 'НЕ ЗНАЧИТ ПЛОХО', 'НОЛЬ ТЕОРИИ']

/** Morphing slogan on #liq1 / #liq2. `heroVisible` gates the melt, it never rebuilds it. */
export function useLiquidSlogan(ready: boolean, heroVisible: boolean): void {
  const activeRef = useRef(heroVisible)
  useEffect(() => { activeRef.current = heroVisible }, [heroVisible])

  useEffect(() => {
    if (!ready) return
    const L1 = document.getElementById('liq1') as LiquidTextHost | null
    const L2 = document.getElementById('liq2') as LiquidTextHost | null
    if (!L1 || !L2) return
    /* Phones used to get `simple` - a plain crossfade instead of the liquid melt - and a fast
       0.9s morph. His word: the mobile hero must be EXACTLY the Mac one. The melt is an SVG
       threshold filter plus a per-frame blur on two short lines of text, which a modern phone
       handles; only a genuinely weak device keeps the crossfade. */
    const WEAK = !!(navigator.deviceMemory && navigator.deviceMemory <= 3)
    /* The grey box he photographed behind each line: the travelling colour is painted as the
       span's BACKGROUND and cut to the glyphs with background-clip:text. The melt blurs that
       same span, and iOS drops the clip on a blurred layer - so the background rectangle gets
       painted instead of the letters. Touch devices walk the same palette as a plain text
       colour instead. The melt itself, threshold included, is untouched. */
    const TOUCH = matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches
    /* The threshold went off on touch for one release and it was a mistake. The report that the
       slogan "was not morphing" came from the screenshot where a broken tint had flooded the
       whole page pale blue - the text was there, under the flood. Without the threshold what
       is left is a blurred cross-fade, and worse, the blur exposes the span's own background
       box: the words are painted with background-clip:text over a flowing gradient, and iOS
       stops honouring that clip once the layer is blurred, so a rectangle appears behind each
       line. The threshold clamps everything under 55% alpha to nothing, which is exactly what
       was hiding that box. It stays on everywhere. */
    const MORPH: LiquidTextOptions = {
      /* Desktop: 4.5s melting against 0.45s still, so the words are in transition 91% of the
         time. At 77px that reads as liquid and he approved it. Photographed at 34px on a real
         iPhone it reads as a collision - two phrases sharing one line with nothing legible.
         Touch gets the same melt, just weighted the other way: a quick 1.6s morph and a 2.6s
         hold, so most of the time there is a readable sentence on screen. */
      morphTime: WEAK ? 0.9 : TOUCH ? 1.6 : 4.5,
      cooldownTime: WEAK ? 1.7 : TOUCH ? 2.6 : 0.45,
      colors: ICE,
      flow: FLOW,
      drift: FLOW * 3,
      spread: ICE.length * 0.08,
      /* The melt works by showing BOTH words at once and letting a heavy blur plus the SVG
         threshold fuse them into one liquid mass. That needs room: at the desktop's 77px it
         reads as liquid. At 34px on a phone there is no room - photographed on a real iPhone it
         was first blue blobs (blur three times the letter height) and then, once the blur was
         capped, two crisp phrases sitting on top of each other. Neither is the effect.
         Touch gets a clean crossfade instead: one phrase out, the next in, never both legible
         at once. Same palette, same tempo, and it costs no per-frame blur at all. */
      simple: WEAK || TOUCH,
      flat: TOUCH,
      /* Photographed on a real iPhone: the slogan turned into blue blobs. The library caps the
         melt blur at a flat 100px, which was written for a 77px desktop slogan - on a phone the
         same words are 34px, so the blur was twice the letter height and ate them. Half the
         measured font size keeps the melt and keeps the words readable. */
      maxBlur: TOUCH ? Math.round(parseFloat(getComputedStyle(L1).fontSize || '34') * 0.5) : 100,
      activeWhen: () => activeRef.current,
    }
    const stop1 = window.LiquidText(L1, SLOGAN_LINE_1, MORPH)
    const stop2 = window.LiquidText(L2, SLOGAN_LINE_2, MORPH)
    return () => { stop1(); stop2() }
  }, [ready])
}

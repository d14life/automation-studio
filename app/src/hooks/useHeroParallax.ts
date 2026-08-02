import { useEffect } from 'react'

/* Hero parallax, the way the reference does it: NOTHING fades. The layers simply travel upward
   at different speeds, so the near ones outrun the far ones and the screen gains depth. The
   words and the number leave because they have physically moved off the top, not because they
   were dissolved - he was explicit that the original effect was never meant to make anything
   disappear, and that going from solid to gone was the thing that felt wrong.

   Speeds are PIXELS MOVED PER PIXEL SCROLLED, which is the only number that decides whether
   the effect is felt. Below 1 a layer lags behind your scroll, and that lag IS the sensation.
   The first version had everything between 0.9 and 1.2 - moving with the scroll or faster than
   it - so there was nothing to feel and the hero was gone in an instant. Now the spread runs
   seven to one, from a backdrop that barely creeps to buttons that nearly keep pace:

     ribbons  0.12  - deepest, almost still
     101      0.52
     line 2   0.62
     line 1   0.72
     buttons  0.85  - nearest, closest to the scroll

   With a 200vh runway the slowest layer still clears the top edge by the end, which is when the
   next section arrives, so nothing is left hanging and no empty screen opens up. */

/* Much slower than before. At 0.72 the slogan lagged the scroll by only 28% and read as
   "it just moves down a bit with the page". The lag IS the effect, so these are roughly halved:
   the slogan now holds back 55%, the number 75%, the ribbons 95%.

   They no longer have to clear the top edge inside the runway either - the pin releases while
   the 101 is still in frame and the hero then leaves at normal speed with the next section
   behind it, so slow rates cost nothing. */
/* He asked for the slogan to hang back the way the number does, so the two lines now sit
   almost on the number's rate instead of half again faster. What is left between them is just
   enough to keep the lines from travelling as one slab: 0.28 / 0.26 against the number's 0.25.
   The depth on this screen now comes from the spread between the ribbons, the text and the
   buttons - 0.05 to 0.60, twelve to one. */
const SPEED = { tubes: 0.05, num: 0.25, line2: 0.26, line1: 0.28, acts: 0.60 }

export function useHeroParallax(): void {
  useEffect(() => {
    const l1 = document.getElementById('liq1'),
      l2 = document.getElementById('liq2'),
      acts = document.querySelector<HTMLElement>('.acts'),
      num = document.querySelector<HTMLElement>('.hero101')
    let tubes: HTMLElement | null = null /* the canvas arrives a moment later, so look it up lazily */
    if (!l1 || !l2) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* written straight from the scroll handler: it only writes styles, never reads layout, and
       the browser already fires scroll at most once a frame. No animation-frame queue to miss. */
    /* the runway only changes on resize, so it is measured there, not on every scroll event -
       offsetHeight inside the scroll handler was the one layout read left on the hot path */
    let track = 160
    const measure = () => {
      const h = innerHeight || 1
      track = Math.max(160, (document.getElementById('stage')?.offsetHeight || h) - h)
    }
    measure()
    function paint() {
      if (!l1 || !l2) return
      const y = window.pageYOffset || 0
      if (y > track * 1.4) return /* past the hero: stop paying for it */
      const travelled = Math.min(y, track) /* stop moving once the runway is done */
      const f = travelled / track
      const up = (speed: number) => 'translateY(' + (-travelled * speed).toFixed(1) + 'px)'

      l1.style.transform = up(SPEED.line1)
      l2.style.transform = up(SPEED.line2)
      if (acts) acts.style.transform = up(SPEED.acts)
      /* the number also drifts closer as it goes, which reads as depth rather than as a zoom */
      if (num) num.style.transform = up(SPEED.num) + ' scale(' + (1 + f * 0.1).toFixed(3) + ')'

      if (!tubes) tubes = document.getElementById('tubelayer')
      if (tubes) {
        const tcv = tubes.firstElementChild as HTMLElement | null
        if (tcv) tcv.style.transform = up(SPEED.tubes)
      }
    }
    const onResize = () => { measure(); paint() }
    addEventListener('scroll', paint, { passive: true })
    addEventListener('resize', onResize, { passive: true })
    paint()
    return () => {
      removeEventListener('scroll', paint)
      removeEventListener('resize', onResize)
    }
  }, [])
}

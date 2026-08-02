import { useEffect } from 'react'

/* Hero parallax, the way the reference does it: NOTHING fades. The layers simply travel upward
   at different speeds, so the near ones outrun the far ones and the screen gains depth. The
   words and the number leave because they have physically moved off the top, not because they
   were dissolved - he was explicit that the original effect was never meant to make anything
   disappear, and that going from solid to gone was the thing that felt wrong.

   Speeds are multiples of the viewport height, deepest layer slowest:
     ribbons  0.40  - the backdrop, barely moves
     101      1.00  - mid ground
     slogan   1.25  - nearest, leaves first
     buttons  1.35  - riding in front of the 101
   Everything has cleared the top edge by the end of the runway, which is when the next section
   arrives, so there is no stretch of empty screen either. */

const SPEED = { tubes: 0.4, num: 1.0, line1: 1.25, line2: 1.18, acts: 1.35 }

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
    function paint() {
      if (!l1 || !l2) return
      const y = window.pageYOffset || 0
      const h = innerHeight || 1
      const track = Math.max(160, (document.getElementById('stage')?.offsetHeight || h) - h)
      if (y > track * 1.4) return /* past the hero: stop paying for it */
      const f = Math.min(1, y / track)
      const up = (speed: number) => 'translateY(' + (-f * h * speed).toFixed(1) + 'px)'

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
    addEventListener('scroll', paint, { passive: true })
    addEventListener('resize', paint, { passive: true })
    paint()
    return () => {
      removeEventListener('scroll', paint)
      removeEventListener('resize', paint)
    }
  }, [])
}

import { useEffect } from 'react'

/* Hero parallax: the two morph lines and the buttons leave at different speeds, so the first
   screen gains depth as you scroll instead of sliding away as one flat sheet. */
export function useHeroParallax(): void {
  useEffect(() => {
    const l1 = document.getElementById('liq1'), l2 = document.getElementById('liq2'),
      acts = document.querySelector<HTMLElement>('.acts'),
      hint: HTMLElement | null = null, /* source keeps this slot empty; the fade is wired, the element is not */
      num = document.querySelector<HTMLElement>('.hero101')
    let tubes: HTMLElement | null = null /* the canvas arrives a moment later, so it is looked up lazily */
    if (!l1 || !l2) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* written straight from the scroll handler: it only writes styles, never reads layout, and
       the browser already fires scroll at most once a frame. No animation-frame queue to miss. */
    function paint() {
      if (!l1 || !l2) return
      const y = window.pageYOffset || 0, h = innerHeight || 1
      /* the runway is exactly the part of the hero below the first screen: the dissolve finishes
         at the instant the next section reaches the top */
      const track = Math.max(160, (document.getElementById('stage')?.offsetHeight || h) - h)
      if (y > track * 1.4) return /* past the hero: stop paying for it */
      const f = Math.min(1, y / track)
      /* Hold, THEN fade. The empty stretch he keeps seeing is the part of the runway where the
         words have already gone but the next section has not arrived, so it is exactly the
         length of the fade - so it has to be halved in PIXELS, not as a share of a runway that
         just doubled. Old runway 458px faded over 55% = 252px. New runway 916px faded over 14%
         = 128px: half the empty stretch, on twice the scroll. */
      const fade = Math.max(0, (f - 0.86) / 0.14)
      l1.style.transform = 'translateY(' + (f * 360).toFixed(1) + 'px)'
      l1.style.opacity = (1 - fade).toFixed(3)
      l2.style.transform = 'translateY(' + (f * 215).toFixed(1) + 'px)'
      l2.style.opacity = (1 - fade).toFixed(3)
      if (acts) {
        acts.style.transform = 'translateY(' + (-f * 165).toFixed(1) + 'px)'
        acts.style.opacity = (1 - fade * 1.05).toFixed(3)
      }
      if (num) {
        num.style.transform = 'translateY(' + (f * 95).toFixed(1) + 'px) scale(' + (1 + f * 0.14).toFixed(3) + ')'
        num.style.opacity = (1 - fade).toFixed(3)
      }
      if (hint) hint.style.opacity = (1 - f * 3.2).toFixed(3)
      /* the ribbons sit behind the words, so they travel slower: that difference is the depth */
      if (!tubes) tubes = document.getElementById('tubelayer')
      if (tubes) {
        const op = Math.max(0, 1 - fade * 1.5)
        tubes.style.opacity = op.toFixed(3)
        tubes.style.visibility = op < 0.02 ? 'hidden' : 'visible'
        const tcv = tubes.firstElementChild as HTMLElement | null
        if (tcv) tcv.style.transform = 'translateY(' + (f * 140).toFixed(1) + 'px)'
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

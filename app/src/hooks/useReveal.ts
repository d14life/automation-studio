import { useEffect } from 'react'

/* Apple's scroll-in. This hook only tags the elements; the animation itself is CSS, driven by
   the browser's own scroll timeline (see .rise in site.css). No observer, no rAF, nothing per
   frame - and nothing that can leave the page blank, because the hidden state only exists in a
   browser that supports the timeline, and a hook that never ran just means no classes at all.

   The classes are added here rather than in the JSX so that not one section file has to change:
   the markup is the approved design. */

/* Every group whose members arrive one after another, in the order a reader meets them.

   Two tiers on purpose. The cards move as boxes, and then the writing inside each card moves
   again on its own clock - that nesting is what gives Apple's pages their look mid-scroll: the
   card is already half there while its heading is still climbing and its body copy has barely
   started. Tag the containers only and everything inside a card arrives as one flat slab. */
const GROUPS = [
  /* the page's own spine */
  '.band .eyebrow',
  '.band > .wrap > h2',
  '.band .claim',
  '.does li',
  /* the boxes */
  '.stats > *',
  '.srv > *',
  '.steps > *',
  '.qs li',
  '.req > *',
  '#contacts .ways > *',
  '.band .formnote',
  'footer .cols > div',
  /* and then, separately, the writing inside those boxes */
  '.card > h3, .card > p, .card > .gain',
  '.step > b, .step > span',
  '.stat > b, .stat > span',
  '.proj .shot, .proj .body > *',
  '.form label, .form input, .form textarea, .form .gradient-button',
  'footer .cols div > *',
]

/* One stagger step, in percent of the element's own range. This shifts where each member's
   window opens, so neighbours are never at the same point at the same moment. */
const STEP = 7
const MAX_STAGGER = 5

/* The container drift ('.par') that used to live here is gone on his word: parallax stays on
   the hero only, everywhere else it was extra per-frame work for an effect he could not feel.
   The arrive-from-below reveal below is untouched - that is not parallax. */

export function useReveal(): void {
  useEffect(() => {
    /* Chrome 115+ and Safari 26 drive both effects off the browser's own scroll timeline, which
       costs nothing. Anywhere else they would silently do nothing at all - the hidden state and
       the drift both live inside @supports - so the same two effects run from script instead. */
    const native = CSS.supports('animation-timeline', 'view()')
    if (!native) document.documentElement.classList.add('no-view-timeline')

    const marked: HTMLElement[] = []
    for (const sel of GROUPS) {
      const nodes = Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[]
      nodes.forEach((el, i) => {
        /* an element caught by two selectors keeps the first delay it was given */
        if (el.classList.contains('rise')) return
        el.classList.add('rise')
        const nth = Math.min(i, MAX_STAGGER)
        if (i) el.style.setProperty('--rd', nth * STEP + '%')
        if (i && !native) el.style.setProperty('--rd-ms', nth * 90 + 'ms')
        marked.push(el)
      })
    }

    /* --- script fallback, only where the browser has no scroll timeline --- */
    let io: IntersectionObserver | null = null
    if (!native) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            e.target.classList.add('in')
            io!.unobserve(e.target) /* one shot: it must not fade back out on the way up */
          }
        },
        { threshold: 0, rootMargin: '0px 0px -14% 0px' },
      )
      marked.forEach((el) => io!.observe(el))
      /* safety: these start invisible, so if the observer never fires the page would read as
         blank. Two seconds later, show everything regardless. */
      window.setTimeout(() => marked.forEach((el) => el.classList.add('in')), 2000)

    }

    return () => {
      if (io) io.disconnect()
      document.documentElement.classList.remove('no-view-timeline')
      marked.forEach((el) => {
        el.classList.remove('rise', 'in')
        el.style.removeProperty('--rd')
        el.style.removeProperty('--rd-ms')
      })
    }
  }, [])
}

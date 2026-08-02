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

/* Elements that drift against the scroll. They must NOT overlap the reveal list above: an
   element carrying both view() animations plays neither - both report a null progress, which is
   what silently killed the arrive-from-below on every heading. So the text reveals and the
   containers around it drift, and no element does both. */
const PARALLAX: [string, string][] = [
  ['.srv', '30px'],
  ['.skewrow', '30px'],
  ['.steps', '30px'],
  ['.stats', '38px'],
  ['.projects', '34px'],
  ['#contacts .ways', '30px'],
  ['.qs', '30px'],
]

export function useReveal(): void {
  useEffect(() => {
    if (!CSS.supports('animation-timeline', 'view()')) return

    const drifted: HTMLElement[] = []
    for (const [sel, amount] of PARALLAX) {
      for (const el of Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[]) {
        el.classList.add('par')
        el.style.setProperty('--par', amount)
        drifted.push(el)
      }
    }

    const marked: HTMLElement[] = []
    for (const sel of GROUPS) {
      const nodes = Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[]
      nodes.forEach((el, i) => {
        /* an element caught by two selectors keeps the first delay it was given */
        if (el.classList.contains('rise')) return
        el.classList.add('rise')
        if (i) el.style.setProperty('--rd', Math.min(i, MAX_STAGGER) * STEP + '%')
        marked.push(el)
      })
    }

    return () => {
      marked.forEach((el) => {
        el.classList.remove('rise')
        el.style.removeProperty('--rd')
      })
      drifted.forEach((el) => {
        el.classList.remove('par')
        el.style.removeProperty('--par')
      })
    }
  }, [])
}

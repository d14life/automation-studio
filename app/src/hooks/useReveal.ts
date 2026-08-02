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
/* The value is half the travel: the block starts +N and ends -N, so 30px moved a container by
   only 60px across a whole screen of scrolling - invisible. These are three to four times that,
   which is the difference between "there is a parallax" and "I cannot feel any parallax". */
const PARALLAX: [string, string][] = [
  ['.srv', '105px'],
  ['.skewrow', '105px'],
  ['.steps', '95px'],
  ['.stats', '120px'],
  ['.projects', '110px'],
  ['#contacts .ways', '95px'],
  ['.qs', '95px'],
]

export function useReveal(): void {
  useEffect(() => {
    /* Chrome 115+ and Safari 26 drive both effects off the browser's own scroll timeline, which
       costs nothing. Anywhere else they would silently do nothing at all - the hidden state and
       the drift both live inside @supports - so the same two effects run from script instead. */
    const native = CSS.supports('animation-timeline', 'view()')
    if (!native) document.documentElement.classList.add('no-view-timeline')

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
        const nth = Math.min(i, MAX_STAGGER)
        if (i) el.style.setProperty('--rd', nth * STEP + '%')
        if (i && !native) el.style.setProperty('--rd-ms', nth * 90 + 'ms')
        marked.push(el)
      })
    }

    /* --- script fallback, only where the browser has no scroll timeline --- */
    let io: IntersectionObserver | null = null
    let onScroll: (() => void) | null = null
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

      let queued = false
      onScroll = () => {
        if (queued) return
        queued = true
        requestAnimationFrame(() => {
          queued = false
          const h = innerHeight || 1
          for (const el of drifted) {
            const b = el.getBoundingClientRect()
            if (b.bottom < -200 || b.top > h + 200) continue
            /* -1 at the bottom of the screen, +1 at the top: the same ramp the keyframes use */
            const p = 1 - 2 * ((b.top + b.height / 2) / (h + b.height))
            const amt = parseFloat(el.style.getPropertyValue('--par')) || 0
            el.style.translate = '0 ' + (p * amt).toFixed(1) + 'px'
          }
        })
      }
      addEventListener('scroll', onScroll, { passive: true })
      addEventListener('resize', onScroll, { passive: true })
      onScroll()
    }

    return () => {
      if (io) io.disconnect()
      if (onScroll) {
        removeEventListener('scroll', onScroll)
        removeEventListener('resize', onScroll)
      }
      document.documentElement.classList.remove('no-view-timeline')
      marked.forEach((el) => {
        el.classList.remove('rise', 'in')
        el.style.removeProperty('--rd')
        el.style.removeProperty('--rd-ms')
      })
      drifted.forEach((el) => {
        el.classList.remove('par')
        el.style.removeProperty('--par')
        el.style.removeProperty('translate')
      })
    }
  }, [])
}

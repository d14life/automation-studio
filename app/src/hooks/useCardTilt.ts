import { useEffect } from 'react'

/* The 3D tilt from sign-in-card-2, which Damir asked to make stronger.
   The donor mapped a fixed +/-300px of cursor travel onto +/-10deg, so on a 436px card the
   pointer never reached full deflection. Here the range is the card's own half-size, so the
   corner IS the full tilt, and the angle is 18deg instead of 10. Roughly 2.5x the donor.

   Written as CSS variables rather than framer-motion because .proj already carries the fan's
   transform (--fx/--fy/--fr/--fs); the tilt has to compose with it, not replace it.

   The listener is capture-phase on window because useSpotlight stops propagation there to keep
   the tube scene off the cursor. Capture listeners on the same target all still run. */

const MAX_DEG = 18
const LIFT_PX = 26

export function useCardTilt(): void {
  useEffect(() => {
    /* the fan only exists above 820px; below that the cards are a plain stacked list */
    const wide = matchMedia('(min-width:821px)')
    if (!wide.matches || matchMedia('(hover:none)').matches) return

    const wrap = document.querySelector<HTMLElement>('.projects')
    if (!wrap) return
    const cards = Array.prototype.slice.call(wrap.querySelectorAll('.proj')) as HTMLElement[]
    if (!cards.length) return

    let last = 0
    let px = 0
    let py = 0

    function paint() {
      /* The fan pushes cards outside the wrapper's own box, so "am I near the cards" has to be
         asked of the cards themselves - measuring the wrapper flattened any card that had been
         thrown clear of it. */
      const boxes = cards.map((el) => el.getBoundingClientRect())
      let l = Infinity, r = -Infinity, t = Infinity, b2 = -Infinity
      for (const b of boxes) {
        if (b.left < l) l = b.left
        if (b.right > r) r = b.right
        if (b.top < t) t = b.top
        if (b.bottom > b2) b2 = b.bottom
      }
      const outside = px < l - 80 || px > r + 80 || py < t - 80 || py > b2 + 80
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i]
        if (outside) {
          el.removeAttribute('data-tilt')
          el.style.removeProperty('--tx')
          el.style.removeProperty('--ty')
          el.style.removeProperty('--tz')
          continue
        }
        const b = boxes[i]
        const hw = b.width / 2
        const hh = b.height / 2
        /* -1..1 across the card, clamped so a far-away cursor does not over-rotate it */
        const dx = Math.max(-1, Math.min(1, (px - (b.left + hw)) / hw))
        const dy = Math.max(-1, Math.min(1, (py - (b.top + hh)) / hh))
        el.setAttribute('data-tilt', 'on')
        el.style.setProperty('--tx', (-dy * MAX_DEG).toFixed(2) + 'deg')
        el.style.setProperty('--ty', (dx * MAX_DEG).toFixed(2) + 'deg')
        /* the nearer the cursor, the more the card lifts toward it */
        const near = 1 - Math.min(1, Math.hypot(dx, dy))
        el.style.setProperty('--tz', (near * LIFT_PX).toFixed(1) + 'px')
      }
    }

    /* paint() measures five boxes, so it forces layout. Doing that straight from the event meant
       one forced layout per pointermove on a page that is already busy; folded into an animation
       frame it happens at most once per frame, which is all the screen can show anyway. */
    let queued = false
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (queued) return
      queued = true
      requestAnimationFrame(() => { queued = false; last = 0; paint() })
    }

    const flatten = () => {
      for (const el of cards) {
        el.removeAttribute('data-tilt')
        el.style.removeProperty('--tx')
        el.style.removeProperty('--ty')
        el.style.removeProperty('--tz')
      }
    }

    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('blur', flatten)
    document.addEventListener('visibilitychange', flatten)

    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('blur', flatten)
      document.removeEventListener('visibilitychange', flatten)
      flatten()
    }
  }, [])
}

import { useEffect } from 'react'

/* One capture-phase listener does two jobs: it swallows the event so the tube library cannot
   chase the cursor, and it hands the position to the spotlight cards. Writes are folded into
   an animation frame, so a fast mouse still costs one write per frame. */
export function useSpotlight(): void {
  useEffect(() => {
    const glowCards = Array.prototype.slice.call(document.querySelectorAll('.glow')) as HTMLElement[]

    function placeGlow() {
      for (let i = 0; i < glowCards.length; i++) {
        const b = glowCards[i].getBoundingClientRect()
        glowCards[i].style.setProperty('--ox', String(Math.round(b.left)))
        glowCards[i].style.setProperty('--oy', String(Math.round(b.top)))
      }
    }
    let placeQueued = false
    function queuePlace() {
      if (placeQueued) return
      placeQueued = true
      requestAnimationFrame(() => { placeQueued = false; placeGlow() })
    }
    /* This used to run on every scroll frame, for the whole length of the page: one
       getBoundingClientRect per glow card per frame, which forces the browser to lay the page
       out again mid-scroll. That was the drag he felt away from the hero.
       These offsets only matter while the cursor is actually over a card, and mouseenter
       already refreshes them - so scrolling no longer pays for them at all. */
    addEventListener('resize', queuePlace, { passive: true })
    glowCards.forEach((c) => {
      c.addEventListener('mouseenter', queuePlace)
      c.addEventListener('transitionend', queuePlace)
    })
    placeGlow()

    let spotQueued = false, spotX = 0, spotY = 0
    const onPointerMove = (e: PointerEvent) => {
      e.stopPropagation()
      spotX = e.clientX; spotY = e.clientY
      if (spotQueued) return
      spotQueued = true
      requestAnimationFrame(() => {
        spotQueued = false
        const r = document.documentElement.style
        r.setProperty('--x', spotX.toFixed(1))
        r.setProperty('--y', spotY.toFixed(1))
        r.setProperty('--xp', (spotX / innerWidth).toFixed(3))
        r.setProperty('--yp', (spotY / innerHeight).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onPointerMove, true)

    return () => {
      removeEventListener('resize', queuePlace)
      glowCards.forEach((c) => {
        c.removeEventListener('mouseenter', queuePlace)
        c.removeEventListener('transitionend', queuePlace)
      })
      window.removeEventListener('pointermove', onPointerMove, true)
    }
  }, [])
}

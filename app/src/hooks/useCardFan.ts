import { useEffect } from 'react'

/* Card fan: slot geometry from the original carousel (21 degrees at the edges, scale falling
   with the square of the distance). Pointing at a card lifts it and pushes its neighbours aside. */
export function useCardFan(): void {
  useEffect(() => {
    const wrap = document.querySelector<HTMLElement>('.projects')
    if (!wrap) return
    const cards = Array.prototype.slice.call(wrap.querySelectorAll('.proj')) as HTMLElement[]
    const narrow = matchMedia('(max-width:820px)')
    const N = cards.length, center = (N - 1) / 2

    /* the spread is measured from the container, so six cards always fit the screen instead of
       piling up on each other or running off the side */
    /* Card size follows the container: every card keeps at least 55 percent of its width clear
       of the next one, so six cards read as a fan instead of a pile on a narrow screen. */
    /* WIDER THAN IT WAS. avail/2.9 capped at 520 was sized for a square card; the card is now
       the screenshot's own 1120/780 shape, and at that ratio a 520px card is only 362px tall -
       too small to read a dashboard in. avail/2.15 capped at 700 makes the product legible,
       which is the entire job of the deck. */
    function cardW() {
      const avail = wrap!.clientWidth
      return Math.round(Math.max(340, Math.min(940, avail / 1.62)))
    }
    /* 0.92 left a margin the fan did not need. At the full viewport width the cards can use the
       whole span, and every extra pixel here is a pixel of the next card's title that stops
       being covered. */
    function edgeX() { return Math.max(60, (wrap!.clientWidth - cardW()) / 2 * 1) }
    function slotCfg(slot: number) {
      const d = N > 1 ? (slot - center) / center : 0, ad = Math.abs(d)
      return { rot: d * 8, scale: 1 - 0.08 * ad * ad, x: d * edgeX(), y: ad * ad * 2.2, z: 10 - Math.abs(slot - center) }
    }
    function apply(slot: number, extra?: { dx?: number; dy?: number; dr?: number; ds?: number; z?: number }) {
      const c = slotCfg(slot), el = cards[slot]
      const x = extra || {}
      el.style.setProperty('--fx', (c.x + (x.dx || 0) * 16) + 'px')
      el.style.setProperty('--fy', (c.y + (x.dy || 0)) + 'rem')
      el.style.setProperty('--fr', (c.rot + (x.dr || 0)) + 'deg')
      el.style.setProperty('--fs', (c.scale * (x.ds || 1)).toFixed(4))
      el.style.setProperty('--fz', String(x.z != null ? x.z : c.z))
    }
    function layout(hover: number | null) {
      cards.forEach(function (_el, slot) {
        if (hover == null) { apply(slot); return }
        if (slot === hover) { apply(slot, { dy: -1.4, ds: 1.08, z: 20 }); return }
        const dist = Math.abs(slot - hover), push = 2.6 * (1 + 0.2 * Math.max(0, 3 - dist))
        apply(slot, { dx: slot < hover ? -push : push, dr: (slot < hover ? -3 : 3) / dist })
      })
    }
    /* below the breakpoint the cards are a plain column, so the fan hands the layout back to CSS
       instead of leaving stale transforms behind - that is what piled them on top of each other */
    function refresh() {
      if (narrow.matches) {
        cards.forEach(function (el) {
          ;['--fx', '--fy', '--fr', '--fs', '--fz'].forEach(function (p) { el.style.removeProperty(p) })
        })
        return
      }
      wrap!.style.setProperty('--cardw', cardW() + 'px')
      layout(null)
    }

    const enters = cards.map((el, slot) => {
      const h = () => { if (!narrow.matches) layout(slot) }
      el.addEventListener('mouseenter', h)
      return h
    })
    wrap.addEventListener('mouseleave', refresh)
    addEventListener('resize', refresh, { passive: true })
    addEventListener('load', refresh)
    refresh()

    return () => {
      cards.forEach((el, slot) => { el.removeEventListener('mouseenter', enters[slot]) })
      wrap.removeEventListener('mouseleave', refresh)
      removeEventListener('resize', refresh)
      removeEventListener('load', refresh)
    }
  }, [])
}

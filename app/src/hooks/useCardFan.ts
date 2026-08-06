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
    /* THE CARD IS SIZED SO ALL OF THEM FIT, NOT SO ONE OF THEM IS BIG. avail/1.62 capped at 940
       chased legibility - make the card huge and the dashboard inside it becomes readable - and
       it bought that at the cost of the deck's whole job. Four 940px cards cannot sit side by
       side in 1440px, so they stacked: every card but the last showed a 170px sliver of itself,
       and the one thing a visitor could not do was see a product. His words: "i cant see".
       The arithmetic that matters is N cards across the container, not one card against the
       viewport. Adjacent slots sit (2/3 * edgeX) apart, so the card has to be about that wide
       for its neighbour to clear it - anything larger is overlap by construction.

       avail/(N - 0.1) lands at 369px for four cards at 1440, which leaves about 5% of each one
       tucked behind the next: still a fan, and still a whole screenshot. N is in the divisor,
       not a constant, so adding a fifth demo shrinks the cards instead of restacking the pile
       nobody could read. The 420 cap keeps a wide monitor from turning four cards into four
       billboards; the 260 floor is where a screenshot stops being a picture of anything. */
    function cardW() {
      const avail = wrap!.clientWidth
      return Math.round(Math.max(260, Math.min(420, avail / (N - 0.1))))
    }
    /* SPACING FIRST, THEN CLAMPED TO THE EDGE. 1.42 * cardW leaves adjacent cards a hair short
       of touching - enough overlap that it still reads as a fan and not a row of tiles, little
       enough that every screenshot is whole. The second term is the wall: the outer card's far
       edge cannot leave the container, or the fan runs off the screen the way it used to. */
    function edgeX() {
      const w = cardW(), avail = wrap!.clientWidth
      return Math.max(60, Math.min(w * 1.42, (avail - w) / 2))
    }
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

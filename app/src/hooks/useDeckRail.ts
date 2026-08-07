import { useEffect } from 'react'

/* THE DECK SLIDES UNDER THE CURSOR, AND ONLY UNDER THE CURSOR.
   His brief, in his words: "we going to get like 6 more later tomorrow, need the mechanism so
   people dont miss them and can slide through each when hovering over and when not just past
   it."

   That is two behaviours in one element and the whole difficulty is the seam between them:

     cursor NOT on the deck  ->  the wheel belongs to the page. The deck scrolls past like any
                                 other section. Nothing is captured, nothing is intercepted.
     cursor ON the deck      ->  the wheel drives the deck sideways, one card per gesture.

   WHY NOT A FAN. The fan arranged N cards around a centre and it was already at its limit with
   four - at ten every card would be a 40px sliver. A rail does not care how many there are:
   the tenth demo costs exactly what the second one did.

   WHY NATIVE SCROLL UNDERNEATH. The track is a real overflow-x element with scroll-snap, so
   trackpad swipes, touch drags, shift+wheel, keyboard and the scrollbar all work with no code
   at all - and the snap points are the browser's, which means they are smooth in a way a
   rAF loop writing transforms is not. This hook only teaches the vertical wheel to drive it.

   THE PART THAT MATTERS MOST IS THE RELEASE.
   A section that eats the wheel is a trap - the reader scrolls, the page does not move, and
   the only way out is to aim the cursor somewhere else. So the capture is conditional: the
   event is only taken while the track can actually still move that way. One card short of the
   end the deck slides; at the end the wheel is not touched at all and the page carries on. You
   can scroll straight through the deck without ever noticing it can do more - which is the
   "when not just past it" half of the ask.

   TRACKPADS FIRE A LOT. A two-finger flick is dozens of events, and one card per event would
   throw the deck to the far end. Each gesture is allowed one card, and the next one is not
   accepted until the scroll has settled - that is what makes it feel like turning pages
   rather than sliding a pile. */

/* a wheel gesture is over once events stop arriving for this long */
const GESTURE_MS = 180
/* below this the deck is a plain vertical list and there is nothing to slide */
const WIDE = '(min-width:821px)'

export function useDeckRail(): void {
  useEffect(() => {
    const wide = matchMedia(WIDE)
    const track = document.querySelector<HTMLElement>('.projects')
    if (!track) return

    let hot = false        /* cursor is over the deck */
    let armed = true       /* this gesture has not spent its card yet */
    let timer = 0

    /* Sub-pixel: scrollWidth and clientWidth are rounded, scrollLeft is not, so at the far end
       the difference lands at 0.5px instead of 0 and the deck would keep claiming it can move.
       One pixel of slack is the difference between releasing the page and trapping the reader. */
    const atStart = () => track.scrollLeft <= 1
    const atEnd = () => track.scrollLeft >= track.scrollWidth - track.clientWidth - 1

    /* THE SMOOTHING IS CSS'S JOB, NOT THIS FUNCTION'S, and that is not a style preference -
       measured in the browser: with scroll-snap-type:x mandatory on the track,
       scrollBy({behavior:'smooth'}) moves it exactly 0px. The snap engine re-targets the
       animation and cancels it. The same distance written straight to scrollLeft lands
       correctly (483px, snapped), and `scroll-behavior:smooth` in v2.css animates it. So the
       hook decides HOW FAR and the stylesheet decides HOW - which is also why the
       reduced-motion rule can turn the animation off without touching this file. */
    function step(dir: 1 | -1) {
      const card = track!.querySelector<HTMLElement>('.proj')
      if (!card) return
      /* the gap is real spacing, not decoration: a step of exactly the card width would leave
         the next card offset by one gap every time and snap would fight it back */
      const gap = parseFloat(getComputedStyle(track!).columnGap || '0') || 0
      track!.scrollLeft += dir * (card.offsetWidth + gap)
    }

    function onWheel(e: WheelEvent) {
      if (!hot || !wide.matches) return
      /* a horizontal gesture is already the track's own scroll - do not double-handle it */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1
      /* THE RELEASE. Nothing is prevented when the deck has nowhere left to go, so the page
         takes the same event and the reader never feels a wall. */
      if ((dir === 1 && atEnd()) || (dir === -1 && atStart())) return
      e.preventDefault()
      if (!armed) return
      armed = false
      step(dir)
      clearTimeout(timer)
      timer = setTimeout(() => { armed = true }, GESTURE_MS)
    }

    const enter = () => { hot = true }
    const leave = () => { hot = false; armed = true }

    track.addEventListener('mouseenter', enter)
    track.addEventListener('mouseleave', leave)
    /* passive:false is the whole point - a passive listener cannot preventDefault, and without
       that the page scrolls underneath while the deck also slides, which reads as a glitch */
    addEventListener('wheel', onWheel, { passive: false })

    return () => {
      clearTimeout(timer)
      track.removeEventListener('mouseenter', enter)
      track.removeEventListener('mouseleave', leave)
      removeEventListener('wheel', onWheel)
    }
  }, [])
}

import { useCallback, useEffect, useRef } from 'react'
import './v2.css'

/* v2: the DNA strand is driven by the scroll wheel, not by playback.

   His idea, and it is the right one for this clip: the footage already runs destroy ->
   rebuild (it is the take followed by its own reverse), so scrubbing it with the scrollbar
   means scrolling down pulls the strand apart and scrolling back up knits it together, at
   exactly the speed of your hand.

   Three things make this work rather than stutter:

   1. The clip is re-encoded with a keyframe every 10 frames. This is the whole game. Seeking
      lands on the nearest keyframe and decodes forward from there, so with a default GOP of
      250 every scroll step can mean decoding a hundred frames. 59 keyframes across 585 costs
      about 25% more file and turns each seek into at most nine frames of work.

   2. currentTime is written once per animation frame, never per scroll event. Scroll fires
      far more often than the screen refreshes, and every write is a seek.

   3. The time eases toward its target instead of snapping to it. A trackpad emits scroll in
      coarse jumps; easing turns those into motion. */

const RUNWAY = 4 /* screens of scrolling to cross the clip once */
/* The clip is 25fps by construction (585 frames over 23.4s). Seeking finer than one frame
   just decodes the same picture again, so the scrubber works on this grid. */
const FPS = 25
const HALF_FRAME = 0.5 / FPS

export default function V2() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const target = useRef(0)
  const shown = useRef(0)

  const nudge = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el) return
    /* iOS will not let a video be SEEKED until it has been allowed to play at least once, and
       in Low Power Mode it will not autoplay at all - so play, immediately pause, and ask
       again on the first real gesture if it was refused. Same lesson as the live page. */
    const arm = () => {
      el.play().then(() => el.pause()).catch(() => { /* wait for a gesture */ })
    }
    arm()
    addEventListener('touchstart', arm, { once: true, passive: true })
    addEventListener('click', arm, { once: true })
  }, [])

  useEffect(() => {
    let raf = 0
    let alive = true

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      target.current = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0
    }

    const tick = () => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      const el = videoRef.current
      if (!el || !el.duration || Number.isNaN(el.duration)) return

      /* Ease toward the scroll position rather than jumping to it - but SNAP once the gap is
         negligible. An exponential ease never actually arrives, so after the finger lifts it
         kept creeping for dozens of frames, and every one of those frames was a seek. That
         crawl is what he saw as lag when scrolling stopped, on both the phone and the Mac. */
      shown.current += (target.current - shown.current) * 0.18
      if (Math.abs(target.current - shown.current) < 0.0015) shown.current = target.current

      /* The turnaround was rigid, and here is why: the clip is the take followed by its own
         reverse, so the strand changes direction at exactly the halfway frame. Mapped straight
         from scroll, time crosses that frame at full speed and the motion flips in one frame -
         a bounce, not a turn.

         So bend the mapping instead of the footage. p is re-centred to -1..1 and raised to a
         power, which leaves the ends alone but flattens the curve around the middle: the
         same scroll distance buys less and less time as the strand approaches the turn, so it
         slows into it and picks up again coming out. 1.7 is gentle; higher dwells longer. */
      const u = shown.current * 2 - 1
      const bent = (Math.sign(u) * Math.abs(u) ** 1.7 + 1) / 2
      /* Quantise to real frame boundaries. The clip is 25fps, so a frame is 0.04s and any
         seek finer than that decodes a picture you are already looking at - pure cost, and on
         iOS a queue of pending seeks that arrives late and looks like stutter. Rounding to the
         frame grid means a seek happens only when the visible frame actually changes. */
      const t = Math.round(bent * (el.duration - 0.05) * FPS) / FPS
      if (Math.abs(el.currentTime - t) >= HALF_FRAME) el.currentTime = t
    }

    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    onScroll()
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <div className="v2bg">
        <video ref={nudge} src="/dna-loop.mp4" muted playsInline preload="auto" />
      </div>
      {/* the runway: nothing in it, it exists so there is something to scroll */}
      <div className="v2runway" style={{ height: `${RUNWAY * 100}svh` }} />
    </>
  )
}

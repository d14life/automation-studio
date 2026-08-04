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

/* 5 screens, settled rather than guessed. At 4 the whole 23.4s clip crossed in a flick, so
   the strand raced and every scroll step jumped several frames - which is also what made the
   seeking look coarse. 5 gives finer control per pixel of scroll and fewer frames skipped. */
const RUNWAY = 5
/* The clip is 25fps by construction (585 frames over 23.4s). Seeking finer than one frame
   just decodes the same picture again, so the scrubber works on this grid. */
const FPS = 25
const HALF_FRAME = 0.5 / FPS

/* 1920x1080 is the source, so it is also the ceiling - there is no higher master to unlock,
   and the only thing left to spend on quality is bitrate. Two encodes of the same frames:
   CRF 21 at 15.7MB for a screen big enough to see the difference, CRF 30 at 6.3MB for
   everything else. A phone cannot resolve the extra detail and would just pay for it in data
   and decode, and decode is what the whole scrub depends on staying cheap.
   Chosen once at module load rather than per render - the file cannot be swapped mid-scroll
   without losing the seek position, so a resize does not re-pick. */
const SRC = matchMedia('(min-width:1100px) and (min-height:700px)').matches
  ? '/dna-loop-hq.mp4'
  : '/dna-loop.mp4'

export default function V2() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
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

    /* Progress through the STAGE, not through the whole document. That is what turns this
       from a page-length effect into a header: the clip is finished by the time the stage has
       been scrolled past, and everything below it is an ordinary page. */
    const onScroll = () => {
      const stage = stageRef.current
      if (!stage) return
      const travel = stage.offsetHeight - innerHeight
      target.current = travel > 0
        ? Math.min(1, Math.max(0, -stage.getBoundingClientRect().top / travel))
        : 0
    }

    const tick = () => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      const el = videoRef.current
      if (!el || !el.duration || Number.isNaN(el.duration)) return

      /* Ease toward the scroll position, but barely, and SNAP as soon as the gap is small.

         The easing was there to smooth the coarse jumps a trackpad emits - but the seek is
         quantised to the 25fps frame grid now, which already does that job, so most of what
         the easing still contributed was TAIL: motion continuing after the scroll had stopped.
         That is what he is seeing. 0.18 -> 0.38 and the snap threshold nearly tripled, so the
         scrubber is within a frame of the scroll almost immediately.

         What is left after this is iOS momentum: the page really is still scrolling for a
         moment after the finger lifts, and the strand tracking that is correct rather than
         laggy. The fix for THAT would be to stop honouring momentum at all, which would feel
         worse. */
      shown.current += (target.current - shown.current) * 0.38
      if (Math.abs(target.current - shown.current) < 0.004) shown.current = target.current

      /* The turnaround was rigid, and here is why: the clip is the take followed by its own
         reverse, so the strand changes direction at exactly the halfway frame. Mapped straight
         from scroll, time crosses that frame at full speed and the motion flips in one frame -
         a bounce, not a turn.

         So bend the mapping instead of the footage. p is re-centred to -1..1 and raised to a
         power, which leaves the ends alone but flattens the curve around the middle: the
         same scroll distance buys less and less time as the strand approaches the turn, so it
         slows into it and picks up again coming out. 1.7 is gentle; higher dwells longer. */
      const u = shown.current * 2 - 1
      /* 1.9, settled. He called the turnaround rigid, and this exponent is what softens it -
         higher means the strand dwells longer as it reaches the halfway frame where the
         footage reverses. 1.7 was a first guess; 1.9 holds the turn noticeably without
         slowing the ends, which stay near linear. */
      const bent = (Math.sign(u) * Math.abs(u) ** 1.9 + 1) / 2
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
      {/* THE HEADER. The clip used to be position:fixed, which pins it to the screen forever -
          there was no "after". Sticky inside a tall section holds it for exactly the length of
          that section and then lets it scroll away like anything else. */}
      <section className="v2stage" ref={stageRef} style={{ height: `${RUNWAY * 100}svh` }}>
        <div className="v2pin">
          <div className="v2bg">
            <video ref={nudge} src={SRC} muted playsInline preload="auto" />
          </div>
        </div>
      </section>

      {/* and the real page begins */}
      <main className="v2main">
        <div className="v2wrap">
          <h1 className="v2h1">Автоматизируем<br /><em>бизнес-процессы</em></h1>
        </div>
      </main>
    </>
  )
}

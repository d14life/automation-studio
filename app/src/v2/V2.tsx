import { useCallback, useEffect, useRef, useState } from 'react'
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
const RUNWAY = 6.5
/* The clip is 25fps by construction (585 frames over 23.4s). Seeking finer than one frame
   just decodes the same picture again, so the scrubber works on this grid. */
const FPS = 50
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
  /* Light and dark are the SAME clip. The donor's light hero is not a second video, it is the
     same footage with `invert` over a pale background - so the switch costs one CSS filter and
     no extra download. The strand is white on cream in light, dark on near-black in dark. */
  const [light, setLight] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('v2light', light)
  }, [light])

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

      /* NO EASING. It was here to smooth a trackpad's coarse jumps, but the frame grid below
         already does that - and everything else it did was tail: motion continuing after the
         scroll stopped, which is what he kept reporting. The clip now tracks the scroll 1:1,
         so whatever movement is left after his finger lifts is the page genuinely still
         scrolling under iOS momentum, not us lagging behind it.

         No turnaround bend either. That existed because the clip was the take plus its own
         reverse and flipped direction at the halfway frame. The clip is forward-only now -
         scrolling UP is what rebuilds the strand, because scrubbing backwards IS reverse
         playback - so there is no midpoint to ease through. */
      const t = Math.round(target.current * (el.duration - 0.05) * FPS) / FPS
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
      {/* the switch, over the header where a nav bar would sit */}
      <button className="v2sw" type="button" aria-pressed={light}
              aria-label={light ? 'Тёмная тема' : 'Светлая тема'}
              onClick={() => setLight((v) => !v)}>
        <span className="v2sw-sky" />
        <span className="v2sw-cloud v2sw-c1" />
        <span className="v2sw-cloud v2sw-c2" />
        <span className="v2sw-cloud v2sw-c3" />
        <span className="v2sw-knob" />
      </button>

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

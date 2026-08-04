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

/* Back to 5. The +30% was his idea and he has changed his mind having felt it - it made the
   header too long to get through. */
const RUNWAY = 5
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
      {/* The sky toggle from his reference, ported to plain CSS. The donor ships it as a
          styled-components file; this project animates with CSS and rAF and does not carry
          that dependency, so the markup and the mechanism are kept and the styling moves into
          v2.css. That is the same adaptation the handoff's 21st.dev convention asks for. */}
      <label className="theme-switch">
        <input type="checkbox" className="theme-switch__checkbox"
               checked={light} onChange={(e) => setLight(e.target.checked)} />
        <div className="theme-switch__container">
          <div className="theme-switch__clouds" />
          <div className="theme-switch__stars-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor" />
            </svg>
          </div>
          <div className="theme-switch__circle-container">
            <div className="theme-switch__sun-moon-container">
              <div className="theme-switch__moon">
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
              </div>
            </div>
          </div>
        </div>
      </label>

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

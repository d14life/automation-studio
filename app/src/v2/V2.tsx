import { useCallback } from 'react'
import './v2.css'

/* v2, starting point: a blank page and the DNA animation. That is the whole thing.

   The nav, the slogan, the kicker, the lede, the buttons and the numbers have all been in
   here at some point tonight and are all gone on his word - get the background right first,
   then write on top of it. */

export default function V2() {
  /* iOS will not autoplay in Low Power Mode however muted and inline the video is, so ask
     again on the first real gesture. Learned on his own phone, not guessed. */
  const nudge = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return
    const play = () => { el.play().catch(() => { /* refused; the black page stands */ }) }
    play()
    addEventListener('touchstart', play, { once: true, passive: true })
    addEventListener('click', play, { once: true })
  }, [])

  return (
    <div className="v2bg">
      <video ref={nudge} src="/dna-loop.mp4" autoPlay muted loop playsInline preload="auto" />
    </div>
  )
}

import { useCallback, useState } from 'react'
import './v2.css'

/* v2 first screen — deliberately only two things: the DNA clip, and the slogan over it.
   The kicker, the lede, the buttons and the numbers were all in the first pass and are all
   gone on his word: get these two right first, everything else is written afterwards. */

const NAV = [
  { label: 'О нас', href: '#about' },
  { label: 'Услуги', href: '#services' },
  { label: 'Контакты', href: '#contacts' },
]

export default function V2() {
  const [menu, setMenu] = useState(false)

  /* iOS will not autoplay in Low Power Mode however muted and inline the video is, so ask
     again on the first real gesture. Learned on his own phone, not guessed. */
  const nudge = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return
    const play = () => { el.play().catch(() => { /* refused; the gradient stands in */ }) }
    play()
    addEventListener('touchstart', play, { once: true, passive: true })
    addEventListener('click', play, { once: true })
  }, [])

  return (
    <section className="v2hero">
      <div className="v2bg">
        <video ref={nudge} src="/dna-loop.mp4" autoPlay muted loop playsInline preload="auto" />
      </div>
      <div className="v2veil" />

      <header className="v2wrap v2bar">
        <a className="v2mark" href="/">Solutions<span>101</span></a>
        <nav className="v2nav">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <button className="v2burger" type="button" aria-label="Меню"
                aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <i /><i /><i />
        </button>
      </header>

      <div className="v2mid">
        <div className="v2wrap">
          <h1 className="v2h1">Автоматизируем<br /><em>бизнес-процессы</em></h1>
        </div>
      </div>
    </section>
  )
}

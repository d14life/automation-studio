import { useCallback, useState } from 'react'
import './v2.css'

/* v2 first screen — two things only: the DNA clip in a rounded card, and the slogan over it.
   The kicker, lede, buttons and numbers from the first pass are gone on his word: get these
   two right, everything else is written afterwards.

   The shape is from the reference he sent: the clip is not full-bleed, it fills a rounded box
   inset from the page, with the nav inside the box at the top and the headline low on the
   left. The donor does that with `absolute inset-1 rounded-3xl overflow-hidden`. */

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
    <div className="v2page">
      <section className="v2card">
        <div className="v2bg">
          <video ref={nudge} src="/dna-loop.mp4" autoPlay muted loop playsInline preload="auto" />
        </div>
        <div className="v2veil" />

        <header className="v2bar">
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
          <h1 className="v2h1">Автоматизируем<br /><em>бизнес-процессы</em></h1>
        </div>
      </section>
    </div>
  )
}

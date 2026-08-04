import { useCallback, useState } from 'react'
import './v2.css'

/* v2 first screen. Built from scratch beside the live page, not on top of it.

   Three things carried over from the donor hero-section-5, and three deliberately left behind:

   KEPT  a full-bleed video behind the whole first screen; a kicker pill over a big headline;
         a two-button row.
   LEFT  next/link, because this is Vite and an <a> is the same thing here.
         framer-motion, per the project's rule that this page animates with CSS and rAF only.
         ProgressiveBlur, which renders eight stacked layers each with its own backdrop-filter,
         and twice over that is sixteen full passes across the first screen every frame. Trap
         5.8 in the handoff exists because a past session spent an evening taking backdrop
         passes from 52 down to 28. The legibility it buys is a gradient's job here.

   The clip is self-hosted rather than pulled from the donor's CDN, the same reason the fonts
   and the ribbon library are: an origin the browser has already opened, and no third party
   deciding when our first screen renders. Re-encoded 1920 -> 1280 and 3.4MB -> 1.2MB. */

const NAV = [
  { label: 'О нас', href: '#about' },
  { label: 'Услуги', href: '#services' },
  { label: 'Контакты', href: '#contacts' },
]

export default function V2() {
  const [menu, setMenu] = useState(false)

  /* Same lesson as the live page, learned the hard way tonight: iOS refuses to autoplay in Low
     Power Mode however muted and inline the video is, so ask again on the first real gesture. */
  const nudge = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return
    const play = () => { el.play().catch(() => { /* refused; the poster frame stands in */ }) }
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
          <div className="v2copy">
            <p className="v2kicker"><b />Берём задачу в работу за один день</p>

            <h1 className="v2h1">Автоматизируем<br /><em>бизнес-процессы</em></h1>

            <p className="v2lede">
              Собираем рабочий инструмент под вашу задачу за дни, а не за кварталы.
              Проверяете на своей реальной работе. Не помогло — не платите, предоплаты нет.
            </p>

            <div className="v2cta">
              <a className="v2btn pri" href="#request">Обсудить задачу</a>
              <a className="v2btn sec" href="demo/index.html" target="_blank" rel="noopener">
                Живой продукт
              </a>
            </div>

            <div className="v2facts">
              <div><b>60+</b><span>готовых сценариев автоматизации</span></div>
              <div><b>дни</b><span>от задачи до рабочего инструмента</span></div>
              <div><b>0 ₽</b><span>предоплата до результата</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

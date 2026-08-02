import type { MouseEvent } from 'react'
import { GradientButton } from '@/components/ui/gradient-button'

/* The nav is words, not icons: each item is a glass bubble carrying the section name, and
   hovering it opens a one-line explanation of what is behind it. Same glass as the pair in
   front of the 101 - a near-clear pane over a blurred backdrop, no colour of its own. */
const NAV = [
  { label: 'О нас', sub: 'кто мы', hint: 'Кто мы и как работаем', href: '#about' },
  { label: 'Услуги', sub: 'что умеем', hint: 'Что умеем и что снимаем с вас', href: '#services' },
  { label: 'Контакты', sub: 'как связаться', hint: 'Телефон, почта и мессенджеры', href: '#contacts' },
  { label: 'Живой продукт', sub: 'открыть пример', hint: 'Рабочая программа, можно потыкать', href: 'demo/index.html' },
]

export function TopBar({
  onAiOpen,
  onBurger,
  navOpen,
  onNavClick,
}: {
  onAiOpen: () => void
  onBurger: () => void
  navOpen: boolean
  onNavClick: (e: MouseEvent<HTMLElement>) => void
}) {
  return (
    <header><div className="wrap topbar">
      <a className="mark" href="/">Solutions<span>101</span></a>
      <button className="burger" id="burger" type="button" aria-label="Меню" aria-expanded={navOpen} onClick={onBurger}>
        <i></i><i></i><i></i>
      </button>
      <nav className={navOpen ? 'topnav open' : 'topnav'} id="topnav" onClick={onNavClick}>
        <div className="navpills">
          {NAV.map((n) => (
            <a className="navpill" key={n.href} href={n.href}
               {...(n.href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener' })}>
              <span className="np-text">
                <span className="np-label">{n.label}</span>
                <span className="np-sub">{n.sub}</span>
              </span>
              {/* the hint sits in a 0fr grid track and opens to 1fr on hover, which is the only
                  reliable way to transition to an automatic width */}
              <span className="np-hintwrap" aria-hidden="true"><span className="np-hint">{n.hint}</span></span>
            </a>
          ))}
        </div>
        <GradientButton type="button" id="aiopen3" style={{ padding: '13px 26px', fontSize: '16px' }} onClick={onAiOpen}>Обсудить задачу бесплатно</GradientButton>
      </nav>
    </div></header>
  )
}

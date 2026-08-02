import type { MouseEvent } from 'react'
import { GradientButton } from '@/components/ui/gradient-button'
import GradientMenu from '@/components/ui/gradient-menu'
import type { GradientMenuItem } from '@/components/ui/gradient-menu'
import { IoInformationCircleOutline, IoGridOutline, IoCallOutline, IoOpenOutline } from 'react-icons/io5'

/* The nav uses the gradient-menu donor: each item rests as an icon and opens on hover into a
   gradient pill carrying a short line about what is behind it. */
const NAV: GradientMenuItem[] = [
  { title: 'Кто мы и как работаем', icon: <IoInformationCircleOutline />, href: '#about',
    gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
  { title: 'Что умеем делать', icon: <IoGridOutline />, href: '#services',
    gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
  { title: 'Как с нами связаться', icon: <IoCallOutline />, href: '#contacts',
    gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
  { title: 'Открыть рабочий пример', icon: <IoOpenOutline />, href: 'demo/index.html',
    gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
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
        <GradientMenu items={NAV} className="gmenu" listClassName="flex gap-3 items-center" />
        <GradientButton type="button" id="aiopen3" style={{ padding: '11px 20px', fontSize: '14.5px' }} onClick={onAiOpen}>Обсудить задачу</GradientButton>
      </nav>
    </div></header>
  )
}

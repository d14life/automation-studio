import { useCallback, useEffect, useState } from 'react'
import type { MouseEvent } from 'react'

export interface BurgerMenu {
  /* caller puts this on the nav as class "open" and on the button as aria-expanded */
  open: boolean
  toggle: () => void
  /* on the nav: a jump closes the menu so the page is not left covered */
  onNavClick: (e: MouseEvent<HTMLElement>) => void
}

/* phone menu: one toggle, closes after a jump so the page is not left covered */
export function useBurgerMenu(): BurgerMenu {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onResize = () => { if (innerWidth > 700) setOpen(false) }
    addEventListener('resize', onResize, { passive: true })
    return () => { removeEventListener('resize', onResize) }
  }, [])

  const toggle = useCallback(() => { setOpen((o) => !o) }, [])
  const onNavClick = useCallback((e: MouseEvent<HTMLElement>) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'A' || tag === 'BUTTON') setOpen(false)
  }, [])

  return { open, toggle, onNavClick }
}

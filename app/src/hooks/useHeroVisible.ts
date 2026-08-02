import { useEffect, useState } from 'react'

/* One observer on the hero, read by both the tube scene (park / wake) and the morphing
   slogan (activeWhen). Starts true, exactly like the source: the hero is on screen at load
   and the first callback only confirms it. */
export function useHeroVisible(): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const stage = document.getElementById('stage')
    if (!stage || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => { setVisible(es[0].isIntersecting) },
      { rootMargin: '80px' })
    io.observe(stage)
    return () => { io.disconnect() }
  }, [])
  return visible
}

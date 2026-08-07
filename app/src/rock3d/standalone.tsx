import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * Отдельная страница только со сценой — та, ссылку на которую можно послать.
 *
 * От блока в разделе «О нас» отличается тем, что здесь НЕ НУЖЕН
 * IntersectionObserver: страница целиком и есть сцена, ждать её появления в
 * кадре бессмысленно, грузим сразу. Проверки на WebGL и на просьбу «меньше
 * движения» остаются: без первой посетитель получает чёрный экран без
 * объяснений, а вторая — не украшение, сцена непрерывно качается.
 */

const Scene = lazy(() => import('./Scene').then((m) => ({ default: m.Scene })))

function webglWorks() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const HINT: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 16,
  margin: 0,
  textAlign: 'center',
  font: '500 11px/1.6 ui-sans-serif, system-ui, sans-serif',
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'rgba(237,242,236,.34)',
  pointerEvents: 'none',
}

const MIDDLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  font: '700 22px/1 ui-sans-serif, system-ui, sans-serif',
  color: '#3d5a6b',
}

function App() {
  const [blocked, setBlocked] = useState<null | 'webgl' | 'motion'>(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setBlocked('motion')
    else if (!webglWorks()) setBlocked('webgl')
  }, [])

  if (blocked) {
    return (
      <div style={MIDDLE}>
        {blocked === 'webgl'
          ? 'Браузер не умеет WebGL — сцену показать нечем'
          : 'Сцена выключена: в системе включено «меньше движения»'}
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={<div style={MIDDLE}>Solutions 101</div>}>
        <Scene />
      </Suspense>
      <p style={HINT}>
        Клик — бросок · тяните — двигает · правая — разворот · колесо — размер
      </p>
    </>
  )
}

createRoot(document.getElementById('rock')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

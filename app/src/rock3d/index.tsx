import { Suspense, lazy, useEffect, useRef, useState } from 'react'

/**
 * Камень в разделе «О нас» — обёртка, которая решает, КОГДА его грузить.
 *
 * Сцена тянет за собой three.js, R3F, drei, постобработку и два с лишним
 * мегабайта геометрии и текстур. Класть это в общий пакет страницы нельзя:
 * посетитель, который до «О нас» не доскроллил (а таких большинство), платил
 * бы за сцену загрузкой первого экрана.
 *
 * Поэтому два уровня отсечки:
 *   1. lazy() выносит весь трёхмерный код в ОТДЕЛЬНЫЙ кусок сборки;
 *   2. IntersectionObserver не даёт его запросить, пока раздел не подъехал к
 *      экрану. Запас в 300 пикселей — чтобы к моменту, когда раздел войдёт в
 *      кадр, картинка уже была, а не начинала грузиться на глазах.
 *
 * Плюс два отказа, оба тихие и оба обязательные:
 *   - нет WebGL — показываем неподвижную подпись вместо пустого чёрного
 *     прямоугольника;
 *   - пользователь просил меньше движения (prefers-reduced-motion) — сцену не
 *     поднимаем вовсе. Она непрерывно качается и дышит; для человека с
 *     вестибулярной чувствительностью это не украшение.
 */

const Scene = lazy(() => import('./Scene').then((m) => ({ default: m.Scene })))

/** Есть ли в браузере рабочий WebGL. Проверяется один раз. */
function webglWorks() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function RockLogo() {
  const box = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [blocked, setBlocked] = useState<null | 'webgl' | 'motion'>(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setBlocked('motion')
      return
    }
    if (!webglWorks()) {
      setBlocked('webgl')
      return
    }
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={box} className="rock3d">
      {show && !blocked ? (
        <Suspense fallback={<div className="rock3d__wait" />}>
          <Scene />
        </Suspense>
      ) : (
        <div className="rock3d__wait">{blocked === 'webgl' ? 'Solutions 101' : null}</div>
      )}
      {!blocked && (
        <p className="rock3d__hint">
          Клик — бросок · тяните — двигает · правая — разворот · колесо — размер
        </p>
      )}
    </div>
  )
}

import * as THREE from 'three'
import { ENV } from './config'

/**
 * Студия, нарисованная на холсте.
 *
 * Возвращает готовую карту окружения. Панорама рисуется вручную, а не качается
 * HDRI-файлом: во-первых, это лишние мегабайты и ещё один ассет, который
 * пропадёт на хостинге; во-вторых, ручная панорама точно попадает в палитру
 * сцены, а случайная студия с диска тянет свой цвет и разваливает грейд.
 *
 * Разрешение крошечное намеренно. После PMREM это всё равно превращается в
 * набор размытых мипов, и разница между 256 и 2048 пикселями не видна ни на
 * одной грани — а вот время загрузки видно.
 */
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const cv = document.createElement('canvas')
  cv.width = ENV.width
  cv.height = ENV.height
  const g = cv.getContext('2d')!

  // Вертикальный градиент: потолок → горизонт → пол. Тёмный низ обязателен,
  // иначе нижние грани кусков отражают свет и камень теряет вес.
  const sky = g.createLinearGradient(0, 0, 0, ENV.height)
  sky.addColorStop(0, ENV.ceiling)
  sky.addColorStop(0.48, ENV.horizon)
  sky.addColorStop(1, ENV.floor)
  g.fillStyle = sky
  g.fillRect(0, 0, ENV.width, ENV.height)

  // Софтбоксы — те самые вытянутые блики, которые обрисовывают рёбра сколов.
  const softbox = (b: { x: number; y: number; w: number; h: number; color: string }) => {
    const x = b.x * ENV.width
    const y = b.y * ENV.height
    const w = b.w * ENV.width
    const h = b.h * ENV.height
    const r = g.createRadialGradient(
      x + w / 2,
      y + h / 2,
      0,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) / 2,
    )
    r.addColorStop(0, b.color)
    r.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = r
    g.fillRect(x, y, w, h)
  }
  softbox(ENV.keyBox)
  softbox(ENV.fillBox)

  const tex = new THREE.CanvasTexture(cv)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace

  // PMREM превращает панораму в пирамиду свёрток по шероховатости — без него
  // отражение остаётся зеркальным и на матовом камне выглядит грязью.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(tex).texture
  pmrem.dispose()
  tex.dispose()
  return env
}

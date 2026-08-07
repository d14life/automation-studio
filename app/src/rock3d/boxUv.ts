import * as THREE from 'three'

/**
 * Коробочная проекция UV.
 *
 * Зачем. У выдавленного текста нормальные UV есть только на лицевых гранях, а
 * боковые грани выдавливания и — главное — свежие грани раскола получают
 * растянутые до бесконечности координаты. Камень на них размазывается в
 * продольные полосы, и никакая частота повтора этого не лечит: полосы просто
 * становятся чаще.
 *
 * Что делает. Для каждого треугольника берётся нормаль, выбирается ось, вдоль
 * которой она смотрит сильнее всего, и UV назначаются из двух ОСТАВШИХСЯ
 * мировых координат. Грань, смотрящая вверх, тайлится по XZ; смотрящая вбок —
 * по YZ; и так далее. Растяжения не остаётся нигде, а зерно камня получает
 * один и тот же физический размер на всех гранях.
 *
 * Почему не трипланарный шейдер, который сделал бы это честнее и со швами
 * помягче: в проекте ровно один самописный шейдер, и это переход. Здесь всё
 * считается один раз при загрузке на процессоре и потом ничего не стоит.
 *
 * Швы. По границе смены оси зерно скачет. На камне это читается как смена
 * слоя породы, поэтому сглаживание тут не нужно — на гладкой поверхности было
 * бы иначе.
 */

/** Геометрии в GLB общие между клонами, поэтому результат кэшируется по
 *  исходной геометрии, а не считается заново при каждом монтировании. */
const cache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

export function boxProjectUv(
  source: THREE.BufferGeometry,
  tileMeters: number,
): THREE.BufferGeometry {
  const hit = cache.get(source)
  if (hit) return hit

  // Проекция назначается ПО ТРЕУГОЛЬНИКУ, поэтому индексы надо развернуть:
  // у общей вершины двух граней с разными осями не может быть одного UV.
  const geo = source.index ? source.toNonIndexed() : source.clone()
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const count = pos.count
  const uv = new Float32Array(count * 2)

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()
  const scale = 1 / Math.max(tileMeters, 1e-6)

  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + 2)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac)

    const nx = Math.abs(n.x)
    const ny = Math.abs(n.y)
    const nz = Math.abs(n.z)

    for (let k = 0; k < 3; k++) {
      const v = k === 0 ? a : k === 1 ? b : c
      let u: number
      let w: number
      if (nx >= ny && nx >= nz) {
        u = v.z // грань смотрит вдоль X → тайлим по ZY
        w = v.y
      } else if (ny >= nx && ny >= nz) {
        u = v.x // вдоль Y → по XZ
        w = v.z
      } else {
        u = v.x // вдоль Z → по XY
        w = v.y
      }
      uv[(i + k) * 2] = u * scale
      uv[(i + k) * 2 + 1] = w * scale
    }
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  cache.set(source, geo)
  return geo
}

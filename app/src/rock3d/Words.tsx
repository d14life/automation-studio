import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CAMERA, DRAG, FLOAT, GROUND, LAYOUT, LAYOUT_3DAR, ROCK, THROW, WORDS } from './config'
import { boxProjectUv } from './boxUv'
import { groundVelocity, impulse, springVelocity } from './impact'

/** Стадия жизни выбитого обломка. */
const FALLING = 0
const LYING = 1
const RETURNING = 2

/** Обломок, отвязанный от слова: он живёт в МИРОВЫХ осях, а не в осях слова. */
type Free = {
  stage: number
  /** Мировая скорость и мировая же угловая скорость кувырка. */
  vel: THREE.Vector3
  spin: THREE.Vector3
  /** Секунды в текущей стадии. */
  timer: number
  /** Откуда начался путь домой. Цель считается каждый кадр заново — слово
   *  покачивается, и зафиксированная цель промахнулась бы мимо своего гнезда. */
  fromPos: THREE.Vector3
  fromQuat: THREE.Quaternion
}

type Piece = {
  obj: THREE.Object3D
  home: THREE.Vector3
  /** Родная ориентация из GLB. Удар доворачивает кусок ОТ неё, а не от нуля. */
  homeRot: THREE.Euler
  /** Куда кусок отходит на вдохе: наружу от центра своего слова. */
  out: THREE.Vector3
  /** Фаза дыхания. У каждого куска своя, иначе слово дышит как поршень. */
  phase: number
  /** На сколько центр обломка стоит выше земли, когда он лежит.
   *
   *  Это САМАЯ КОРОТКАЯ полутолщина габаритной коробки, а не радиус
   *  описанной сферы. Радиус сферы — расстояние до дальнего УГЛА: длинный
   *  осколок с ним «ложится» на четверть единицы выше грунта и повисает в
   *  воздухе — ровно то, что было видно на кадрах как летающие камешки.
   *  Кувыркаясь, плоский обломок останавливается на самой широкой своей
   *  стороне, и высота его центра над землёй — как раз половина наименьшего
   *  габарита. */
  size: number
  /** Смещение и доворот от близкого удара, и их скорости. Пружина тянет обе
   *  тройки к нулю каждый кадр — см. lib/impact.ts. */
  kick: THREE.Vector3
  kickVel: THREE.Vector3
  twist: THREE.Vector3
  twistVel: THREE.Vector3
  /** Не null, пока кусок выбит из слова. */
  free: Free | null
}

type Word = {
  group: THREE.Group
  pieces: Piece[]
  /** Место покоя слова. Покачивание прибавляется к нему каждый кадр, поэтому
   *  тащить надо ЭТО, а не group.position: позиция переписывается заново
   *  каждый кадр, и сдвиг курсора стирался бы, не дожив до отрисовки. */
  at: THREE.Vector3
  /** Текущий размер. Хранится здесь, а не читается из group.scale, потому что
   *  от него зависит высота, на которой лягут обломки. */
  scale: number
  /** Разворот правой кнопкой: поворот вокруг вертикали и наклон. */
  spin: number
  tilt: number
  /** Завал на бок из раскладки. Мышью не меняется: это часть знака, а не поза.
   *  Нужен «studio», которое в «3DAR studio» стоит стоймя. */
  roll: number
  bobPhase: number
  /** Свой материал на слово — только ради подсветки выбранного. Общий на оба
   *  слова подсвечивал бы сразу оба. */
  material: THREE.MeshPhysicalMaterial
}

/** Летящий снаряд. Один на сцену: следующий бросок перехватывает тот же камень. */
type Shot = {
  /** Доля перелёта, 0..1. Дальше единицы снаряд уже отскочил. */
  t: number
  from: THREE.Vector3
  to: THREE.Vector3
  /** Позиция прошлого кадра — из неё берётся направление удара. Считать его
   *  как `to - from` нельзя: дуга приходит в цель сверху, и настоящее
   *  направление в момент попадания заметно круче прямой. */
  prev: THREE.Vector3
  /** Скорость после отскока, мировая. */
  bounce: THREE.Vector3
  since: number
  hit: boolean
}

const UP = new THREE.Vector3(0, 1, 0)

/**
 * ОБА слова висят в кадре одновременно, целиком, из цельного колотого камня.
 * Камера их облетает мышью, как референсная сцена облетала ледяную сферу.
 *
 * Жизнь сцены — из референса, перенесённая с кирпичей на камень:
 *   - слова медленно покачиваются: глыба ПАРИТ, а не стоит на постаменте;
 *   - куски дышат — еле заметно расходятся и сходятся по своим фазам;
 *   - КЛИК ПО КАМНЮ — это бросок. Снаряд прилетает из-за плеча зрителя,
 *     выбивает из слова горсть обломков, те падают на землю по-настоящему,
 *     лежат там и через паузу возвращаются в свои гнёзда;
 *   - внутреннего света в словах НЕТ. Он был перенесён из референса, где
 *     подсвечивал ледяные кирпичи, и на камне читался наоборот: камень
 *     непрозрачен, свечение из щелей делало глыбу полой лампой — ровно тем,
 *     от чего избавлялись, чиня геометрию. Объём теперь даёт свет снаружи:
 *     рисующий с тенями, заполняющий, контровой и затенение в щелях.
 */
export function Words({ logo = 'solutions' }: { logo?: 'solutions' | '3dar' }) {
  const gltf = useGLTF(logo === '3dar' ? WORDS.glb3dar : WORDS.glb, WORDS.dracoPath)
  const [colorMap, normalMap, roughnessMap] = useTexture([
    WORDS.colorMap,
    WORDS.normalMap,
    WORDS.roughMap,
  ])

  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  // Контролы приезжают из состояния сцены (OrbitControls помечен makeDefault).
  // Через ref, а не напрямую: их надо выключать и включать внутри обработчиков
  // событий, которые заводятся один раз и не пересоздаются на каждый кадр.
  const orbitControls = useThree((s) => s.controls) as { enabled: boolean; enableZoom: boolean } | null
  const controls = useRef(orbitControls)
  controls.current = orbitControls

  /** Слово, по которому кликнули последним: колесо меняет размер именно его. */
  const selected = useRef<Word | null>(null)

  const rock = useRef<THREE.Mesh>(null)
  const shot = useRef<Shot | null>(null)
  /** Точка, куда целится следующий бросок. Ставится по клику, тратится в кадре. */
  const pending = useRef<THREE.Vector3 | null>(null)

  const { words, flyingMaterial, flyingGeometry } = useMemo(() => {
    for (const t of [colorMap, normalMap, roughnessMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(1, 1)
      // Анизотропия — первое, что надо включить, когда «текстуры есть, а всё
      // равно мыло»: под скользящим углом ничто другое не помогает.
      t.anisotropy = WORDS.anisotropy
    }
    colorMap.colorSpace = THREE.SRGBColorSpace

    // ОДИН материал на все куски: кожа и скол различаются цветом вершин,
    // запечённым в GLB.
    const rockMaterial = new THREE.MeshPhysicalMaterial({
      map: colorMap,
      normalMap,
      roughnessMap,
      vertexColors: true,
      color: new THREE.Color(ROCK.coreColor),
      roughness: ROCK.roughness,
      metalness: 0,
      normalScale: new THREE.Vector2(ROCK.normalScale, ROCK.normalScale),
      envMapIntensity: ROCK.envIntensity,
      sheen: ROCK.sheen,
      sheenColor: new THREE.Color(ROCK.sheenColor),
      sheenRoughness: ROCK.sheenRoughness,
      // Обе стороны граней. Страховка поверх заливки дыр в Блендере: если
      // какая-то стенка всё же потеряется, кусок покажет камень, а не
      // сквозную дыру. Цена на этой сцене неизмерима.
      side: THREE.DoubleSide,
    })

    // Снаряду нужен СВОЙ материал: у обычного включён цвет вершин, а у
    // простого многогранника такого атрибута нет — с ним снаряд рисуется
    // чёрным. Гранёное затенение вместо сглаженного: он из той же породы, что
    // и обломки, а те гранёные.
    const flyingMaterial = rockMaterial.clone()
    flyingMaterial.vertexColors = false
    flyingMaterial.flatShading = true

    // Двенадцатигранник, а не сфера: у камня плоские сколы. Тайлинг тот же,
    // что у слов, поэтому зерно совпадает по размеру.
    const flyingGeometry = boxProjectUv(
      new THREE.DodecahedronGeometry(THROW.size, 0),
      ROCK.tileMeters,
    )

    // Клонируется: useGLTF кэширует сцену, а мы двигаем объекты руками.
    const root = gltf.scene.clone(true)

    const listA: THREE.Object3D[] = []
    const listB: THREE.Object3D[] = []
    for (const o of [...root.children]) {
      if (o.name.startsWith(WORDS.prefixA)) listA.push(o)
      else if (o.name.startsWith(WORDS.prefixB)) listB.push(o)
    }

    const buildWord = (
      list: THREE.Object3D[],
      layout: {
        position: readonly [number, number, number]
        rotY: number
        roll: number
        scale: number
        bobPhase: number
      },
    ): Word => {
      // Копия общего материала: текстуры и настройки те же по ссылке, свой
      // только объект — чтобы подсветить выбранное слово, не трогая соседнее.
      const material = rockMaterial.clone()
      const centre = new THREE.Vector3()
      const box = new THREE.Box3()
      const tmp = new THREE.Box3()
      const size = new Map<THREE.Object3D, number>()

      const half = new THREE.Vector3()
      for (const piece of list) {
        let rest = 0
        piece.traverse((o) => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          m.material = material
          // Камень и отбрасывает тень, и принимает: куски затеняют друг друга,
          // и слово перестаёт быть плоской аппликацией.
          m.castShadow = true
          m.receiveShadow = true
          m.geometry = boxProjectUv(m.geometry, ROCK.tileMeters)
          m.geometry.computeBoundingBox()
          // Наименьшая полутолщина — высота, на которой обломок ляжет. См.
          // комментарий к Piece.size: радиус описанной сферы вешает камень
          // в воздух.
          m.geometry.boundingBox!.getSize(half).multiplyScalar(0.5)
          rest = Math.max(rest, Math.min(half.x, half.y, half.z))
          tmp.copy(m.geometry.boundingBox!).translate(piece.position)
          box.union(tmp)
        })
        // Размер В ЕДИНИЧНОМ масштабе: слово теперь можно увеличить колесом,
        // и высота, на которой ляжет обломок, обязана меняться вместе с ним.
        size.set(piece, rest)
      }
      box.getCenter(centre)

      // Слово живёт в СВОЕЙ группе: положение в композиции — это трансформация
      // группы, а куски внутри остаются в родных координатах. Двигать сами
      // куски — значит навсегда потерять «дом», от которого дышат швы.
      const group = new THREE.Group()
      group.position.set(...layout.position)
      group.rotation.y = layout.rotY
      group.scale.setScalar(layout.scale)
      // Центр слова — в ноль группы, иначе поворот группы водит слово по дуге.
      const offset = centre.clone().multiplyScalar(-1)

      const pieces: Piece[] = list.map((obj, i) => {
        obj.position.add(offset)
        group.add(obj)
        const out = obj.position.clone()
        if (out.lengthSq() < 1e-8) out.set(0, 1, 0)
        out.normalize()
        return {
          obj,
          home: obj.position.clone(),
          homeRot: obj.rotation.clone(),
          out,
          // Фаза — золотым углом от индекса, не Math.random(): фазы не
          // кучкуются, а картинка одинакова при каждой перезагрузке.
          phase: (i * 2.399963) % (Math.PI * 2),
          size: size.get(obj) ?? 0.05,
          kick: new THREE.Vector3(),
          kickVel: new THREE.Vector3(),
          twist: new THREE.Vector3(),
          twistVel: new THREE.Vector3(),
          free: null,
        }
      })

      return {
        group,
        pieces,
        at: new THREE.Vector3(...layout.position),
        scale: layout.scale,
        spin: layout.rotY,
        tilt: 0,
        roll: layout.roll,
        bobPhase: layout.bobPhase,
        material,
      }
    }

    const plan = logo === '3dar' ? LAYOUT_3DAR : { a: LAYOUT.solutions, b: LAYOUT.one01 }
    const words = [buildWord(listA, plan.a), buildWord(listB, plan.b)]

    return { words, flyingMaterial, flyingGeometry }
  }, [gltf, colorMap, normalMap, roughnessMap, logo])

  // ОДНА КНОПКА МЫШИ, ТРИ ЖЕСТА.
  //
  //   нажал на камень и отпустил, не сдвинув  → бросок;
  //   нажал на камень и повёл                 → слово едет за курсором;
  //   нажал мимо камня и повёл                → вращается камера;
  //   колесо при выбранном слове              → его размер.
  //
  // Слушатели висят на самом холсте, мимо системы событий R3F: она сообщает о
  // попадании в объект, но не о том, протяжка это или клик, — а вся развязка
  // жестов держится именно на пороге сдвига.
  useEffect(() => {
    const el = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const plane = new THREE.Plane()
    const normal = new THREE.Vector3()
    const hitPoint = new THREE.Vector3()
    const grab = new THREE.Vector3()
    const orbit = new THREE.Vector3(...CAMERA.orbitTarget)
    /** Куски → слово, которому они принадлежат. Луч возвращает меш, а тащим мы слово. */
    const owner = new Map<THREE.Object3D, Word>()
    for (const w of words) for (const p of w.pieces) p.obj.traverse((o) => owner.set(o, w))
    const targets = words.flatMap((w) => w.pieces.map((p) => p.obj))

    let downX = 0
    let downY = 0
    /** Слово под курсором в момент нажатия. Ещё не значит, что его потащат. */
    let pressed: Word | null = null
    let dragging = false
    /** Слово, которое сейчас разворачивают ПРАВОЙ кнопкой, и прошлая позиция
     *  курсора. Развороту порог сдвига не нужен: правой кнопкой по сцене
     *  больше ничего не делают, путать не с чем. */
    let turning: Word | null = null
    let lastX = 0
    let lastY = 0

    const aimRay = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
    }

    const select = (w: Word | null) => {
      if (selected.current === w) return
      selected.current = w
      for (const other of words) {
        other.material.emissive.set(other === w ? DRAG.selectEmissive : '#000000')
      }
      // Пока слово выбрано, колесо меняет ЕГО размер, а не приближение камеры.
      // Выключать зум обязательно: иначе одно колесо крутит обе величины
      // сразу — слово растёт, и камера к нему же едет.
      const c = controls.current
      if (c) c.enableZoom = DRAG.cameraZoom && w === null
    }

    const onDown = (e: PointerEvent) => {
      // ПРАВАЯ КНОПКА — РАЗВОРОТ выбранного слова: вбок поворачивает вокруг
      // вертикали, вверх-вниз наклоняет. На трекпаде Mac это нажатие двумя
      // пальцами. Разворачивается именно ВЫБРАННОЕ слово, а если ничего не
      // выбрано — то, что под курсором: тянуться правой кнопкой к слову,
      // которое и так подсвечено, было бы лишним движением.
      if (e.button === 2) {
        aimRay(e)
        const hit = ray.intersectObjects(targets, true)[0]
        const target = selected.current ?? (hit ? owner.get(hit.object) ?? null : null)
        if (!target) return
        select(target)
        turning = target
        lastX = e.clientX
        lastY = e.clientY
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // Без захвата тоже сойдёт — см. ниже, в перетаскивании.
        }
        return
      }
      if (e.button !== 0) return
      downX = e.clientX
      downY = e.clientY
      dragging = false
      aimRay(e)
      const hit = ray.intersectObjects(targets, true)[0]
      pressed = hit ? owner.get(hit.object) ?? null : null
    }

    const onMove = (e: PointerEvent) => {
      if (turning) {
        turning.spin += (e.clientX - lastX) * DRAG.rotateSpeed
        // Наклон зажат: за пределом слово встаёт торцом к зрителю и
        // превращается в полоску — буквы плоские, с ребра их не прочесть.
        turning.tilt = Math.max(
          -DRAG.maxTilt,
          Math.min(DRAG.maxTilt, turning.tilt + (e.clientY - lastY) * DRAG.rotateSpeed),
        )
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      if (!pressed) return
      if (!dragging) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) <= THROW.dragPx) return
        // Порог перейден — это перетаскивание. Камеру придерживаем и
        // захватываем указатель: увести курсор за край холста посреди жеста
        // проще простого, а слово не должно на этом застревать.
        dragging = true
        if (controls.current) controls.current.enabled = false
        // Захват указателя — удобство, а не условие: увести курсор за край
        // холста посреди жеста проще простого, и без захвата слово там
        // застревает. Но браузер бросает исключение, если указателя с таким
        // номером уже нет ((мышь отпустили за пределами окна) — а
        // необработанное исключение здесь обрывает жест целиком, до настройки
        // плоскости, и перетаскивание молча перестаёт работать.
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // Не беда: жест продолжится, просто без захвата.
        }
        // Плоскость перетаскивания ПАРАЛЛЕЛЬНА экрану и проходит через слово:
        // так слово держится под курсором и не уезжает от камеры вглубь.
        camera.getWorldDirection(normal)
        plane.setFromNormalAndCoplanarPoint(normal, pressed.at)
        aimRay(e)
        if (ray.ray.intersectPlane(plane, hitPoint)) grab.subVectors(hitPoint, pressed.at)
        select(pressed)
        return
      }
      aimRay(e)
      if (ray.ray.intersectPlane(plane, hitPoint)) pressed.at.copy(hitPoint).sub(grab)
    }

    const onUp = (e: PointerEvent) => {
      if (e.button === 2) {
        turning = null
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        return
      }
      if (e.button !== 0) return
      if (dragging) {
        dragging = false
        if (controls.current) controls.current.enabled = true
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        pressed = null
        return
      }
      // Сдвига не было — это клик, то есть бросок.
      aimRay(e)
      const hit = ray.intersectObjects(targets, true)[0]
      select(hit ? owner.get(hit.object) ?? null : null)
      // Промах — тоже бросок: камень уходит в пустоту на глубину сцены и
      // падает на землю. Клик, от которого не происходит НИЧЕГО, читается
      // сломанной страницей, а не промахом.
      pending.current = hit
        ? hit.point.clone()
        : ray.ray.at(camera.position.distanceTo(orbit), new THREE.Vector3())
      pressed = null
    }

    const onWheel = (e: WheelEvent) => {
      const w = selected.current
      if (!w) return
      e.preventDefault()
      // Умножением, а не прибавкой: одинаковый жест обязан давать одинаковую
      // ДОЛЮ роста. С прибавкой мелкое слово растёт рывками, а крупное еле
      // ползёт, и колесо ощущается разным на разных размерах.
      const next = w.scale * Math.exp(-e.deltaY * DRAG.wheelStep)
      w.scale = Math.min(DRAG.maxScale, Math.max(DRAG.minScale, next))
    }

    // Иначе правая кнопка вместо разворота открывает системное меню, и жест
    // обрывается на первом же пикселе.
    const onMenu = (e: Event) => e.preventDefault()

    // УВЁЛ КУРСОР — ВЫБОР СНЯТ. Пока слово выбрано, колесо меняет его размер и
    // страницу не листает. Без этого посетитель, разок кликнувший по камню,
    // остаётся с мёртвым колесом над всем разделом и не понимает почему.
    // Снятие выбора на выходе курсора возвращает прокрутку молча и сразу.
    const onLeave = () => {
      if (!turning && !dragging) select(null)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', onMenu)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onMenu)
      el.removeEventListener('pointerleave', onLeave)
      // Контролы переживают этот компонент: оставить их выключенными — значит
      // получить сцену, которая перестала вращаться после горячей замены кода.
      if (controls.current) {
        controls.current.enabled = true
        controls.current.enableZoom = true
      }
    }
  }, [gl, camera, words, controls])

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime
    // Потолок шага: вернувшаяся из сворачивания вкладка приносит кадр в
    // полсекунды, и без потолка он одним махом разносит и пружину, и падение.
    const dt = Math.min(delta, THROW.maxStep)

    if (pending.current) {
      shot.current = aim(pending.current, camera)
      pending.current = null
    }
    flyRock(shot, rock.current, words, dt)

    for (const w of words) {
      // Покачивание всего слова. Позиция задаётся ЗАНОВО от конфига, а не
      // накапливается: накопленный сдвиг не переживает ни горячей замены
      // модуля, ни прокрутки назад.
      const bob = Math.sin((time / FLOAT.bobPeriod) * Math.PI * 2 + w.bobPhase)
      w.group.position.set(w.at.x, w.at.y + bob * FLOAT.bobAmp, w.at.z)
      w.group.scale.setScalar(w.scale)
      // Порядок осей YXZ, а не штатный XYZ: при нём поворот вокруг вертикали
      // идёт по МИРОВОЙ вертикали, а наклон — уже вокруг повёрнутой оси, то
      // есть ровно так, как ждёт рука. На штатном порядке слово, развёрнутое
      // вбок, начинает от вертикального движения мыши заваливаться набок.
      w.group.rotation.order = 'YXZ'
      w.group.rotation.set(w.tilt, w.spin, w.roll)
      // Матрица группы обновляется СЕЙЧАС, а не движком перед отрисовкой:
      // ниже по ней переводят точки между мировыми и местными осями, и
      // отставшая на кадр матрица кладёт обломки мимо гнёзд.
      w.group.updateMatrixWorld()

      // Дыхание швов: каждый кусок отходит от дома по своей фазе, плюс
      // прокрутка приоткрывает слово целиком.
      const widen = 0
      for (const p of w.pieces) {
        const breathe =
          (0.5 + 0.5 * Math.sin((time / FLOAT.breathePeriod) * Math.PI * 2 + p.phase)) *
          FLOAT.breatheAmp
        const k = breathe + widen

        // Выбитый обломок живёт своей жизнью в мировых осях и укладке слова
        // не подчиняется — пока не вернётся.
        if (p.free) {
          stepFree(p, w, k, dt)
          continue
        }

        // Пружина возврата: скорость, потом смещение — порядок принципиален,
        // см. lib/impact.ts.
        p.kickVel.set(
          springVelocity(p.kick.x, p.kickVel.x, dt, THROW.stiffness, THROW.damping),
          springVelocity(p.kick.y, p.kickVel.y, dt, THROW.stiffness, THROW.damping),
          springVelocity(p.kick.z, p.kickVel.z, dt, THROW.stiffness, THROW.damping),
        )
        p.kick.addScaledVector(p.kickVel, dt)

        p.twistVel.set(
          springVelocity(p.twist.x, p.twistVel.x, dt, THROW.spinStiffness, THROW.spinDamping),
          springVelocity(p.twist.y, p.twistVel.y, dt, THROW.spinStiffness, THROW.spinDamping),
          springVelocity(p.twist.z, p.twistVel.z, dt, THROW.spinStiffness, THROW.spinDamping),
        )
        p.twist.addScaledVector(p.twistVel, dt)

        p.obj.position.set(
          p.home.x + p.out.x * k + p.kick.x,
          p.home.y + p.out.y * k + p.kick.y,
          p.home.z + p.out.z * k + p.kick.z,
        )
        p.obj.rotation.set(
          p.homeRot.x + p.twist.x,
          p.homeRot.y + p.twist.y,
          p.homeRot.z + p.twist.z,
        )
      }
    }
  })

  return (
    <>
      {words.map((w, i) => (
        <primitive key={i} object={w.group} />
      ))}
      {/* Снаряд. Живёт в мировых осях, а не внутри слова: он прилетает
          снаружи, и обе глыбы для него — просто мишени. */}
      <mesh
        ref={rock}
        geometry={flyingGeometry}
        material={flyingMaterial}
        visible={false}
        castShadow
      />
    </>
  )
}

/**
 * Откуда лететь в заданную точку.
 *
 * Точка приходит от клика — куда зритель ткнул, туда камень и прилетит.
 * Вылетает снаряд из места, заданного В ОСЯХ КАМЕРЫ, как из-за плеча: сцену
 * крутят мышью, и любая мировая точка вылета оказалась бы то сбоку, то за
 * спиной у зрителя.
 */
function aim(target: THREE.Vector3, camera: THREE.Camera): Shot {
  const to = target.clone()
  const from = new THREE.Vector3(...THROW.fromCamera)
    .applyQuaternion(camera.quaternion)
    .add(camera.position)

  // Остановиться на поверхности, а не в середине куска: снаряд, влетевший
  // внутрь буквы, на кадр показывает её изнанку.
  to.addScaledVector(from.clone().sub(to).normalize(), THROW.size)

  return {
    t: 0,
    from,
    to,
    prev: from.clone(),
    bounce: new THREE.Vector3(),
    since: 0,
    hit: false,
  }
}

const scratch = {
  pos: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  hitLocal: new THREE.Vector3(),
  dirLocal: new THREE.Vector3(),
  away: new THREE.Vector3(),
  axis: new THREE.Vector3(),
  target: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
}

/** Ведёт снаряд по дуге, бьёт по словам и роняет его на землю. */
function flyRock(
  ref: React.RefObject<Shot | null>,
  mesh: THREE.Mesh | null,
  words: Word[],
  dt: number,
) {
  const s = ref.current
  if (!s || !mesh) return

  const { pos, dir } = scratch
  const floorY = GROUND.y + THROW.size

  if (!s.hit) {
    s.t += dt / THROW.flight
    const u = Math.min(s.t, 1)
    pos.lerpVectors(s.from, s.to, u)
    // Подброс по дуге: прямая линия читается выстрелом, дуга — броском руки.
    pos.y += Math.sin(Math.PI * u) * THROW.arc

    dir.subVectors(pos, s.prev)
    if (dir.lengthSq() < 1e-12) dir.subVectors(s.to, s.from)
    dir.normalize()
    s.prev.copy(pos)

    if (s.t >= 1) {
      s.hit = true
      strike(words, pos, dir)
      // Отскок: зеркалим направление полёта от «поверхности», нормалью к
      // которой считаем направление на бросавшего. Точной нормали у нас нет,
      // и она не нужна — камень уходит прочь, а не строит отражение.
      scratch.normal.subVectors(s.from, s.to).normalize()
      s.bounce
        .copy(dir)
        .addScaledVector(scratch.normal, -2 * dir.dot(scratch.normal))
        .multiplyScalar(2.2)
    }
  } else {
    s.since += dt
    pos.copy(mesh.position)
    s.bounce.y = groundVelocity(
      pos.y,
      s.bounce.y,
      dt,
      THROW.gravity,
      floorY,
      THROW.bounce,
      THROW.snap,
    )
    pos.addScaledVector(s.bounce, dt)
    if (pos.y < floorY) {
      pos.y = floorY
      s.bounce.x *= THROW.friction
      s.bounce.z *= THROW.friction
    }
    if (s.since > THROW.ricochet) {
      mesh.visible = false
      ref.current = null
      return
    }
  }

  mesh.position.copy(pos)
  // Кувырок в полёте. Оси разные, чтобы не читался ровный вал.
  mesh.rotation.x += dt * 7
  mesh.rotation.y += dt * 4.5
  mesh.visible = true
}

/**
 * Раздаёт удар кускам обоих слов.
 *
 * Точка попадания и направление приходят В МИРОВЫХ осях, а куски живут в осях
 * своей группы, у которой свои поворот и масштаб. Направление переводится
 * через ДВЕ точки, а не поворотом вектора: перевести точку умеет сам объект, и
 * это единственный способ не собирать обратную матрицу руками.
 */
function strike(words: Word[], hit: THREE.Vector3, dir: THREE.Vector3) {
  const { hitLocal, dirLocal, away, axis } = scratch

  for (const w of words) {
    w.group.updateMatrixWorld()
    hitLocal.copy(hit)
    w.group.worldToLocal(hitLocal)
    dirLocal.copy(hit).add(dir)
    w.group.worldToLocal(dirLocal).sub(hitLocal).normalize()

    for (const p of w.pieces) {
      // Уже выбитый обломок второй раз не бьют: он и так в свободном полёте,
      // а добавка скорости отправила бы его за горизонт.
      if (p.free) continue

      // Расстояние от ДОМА, а не от текущего места: иначе второй бросок в то
      // же место достаётся уже вздрогнувшим кускам не по их месту в слове.
      const distance = p.home.distanceTo(hitLocal)
      const force = impulse(distance, THROW.radius, THROW.strength)
      if (force <= 0) continue

      away.subVectors(p.home, hitLocal)
      if (away.lengthSq() < 1e-8) away.copy(dirLocal)
      else away.normalize()
      // Смесь «прочь от удара» и «вдоль полёта». Без второго слагаемого
      // обломки распускаются ровным цветком, и удар читается взрывом изнутри.
      away.multiplyScalar(1 - THROW.through).addScaledVector(dirLocal, THROW.through).normalize()

      if (distance < THROW.breakRadius) {
        // Скорость вылета — по той же спадающей силе. В центре удара кусок
        // выстреливает, с краю воронки только вываливается. Одинаковая
        // скорость на всех читалась не выбитым материалом, а залпом.
        breakOff(p, w, away, THROW.breakSpeed * (0.3 + 0.7 * (force / THROW.strength)))
        continue
      }

      p.kickVel.addScaledVector(away, force)
      // Доворот вокруг оси, поперечной толчку: без него кусок ездит
      // параллельно самому себе и выглядит резиновым.
      axis.crossVectors(away, UP)
      if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0)
      p.twistVel.addScaledVector(axis.normalize(), force * THROW.spin)
    }
  }
}

/**
 * Выбивает кусок из слова насовсем — до самостоятельного возвращения.
 *
 * Кусок ПЕРЕПОДВЕШИВАЕТСЯ к сцене. Оставить его в группе слова нельзя: группа
 * покачивается и повёрнута, и лежащий на земле обломок качался бы вместе со
 * словом, а «земля» в местных осях группы была бы наклонной плоскостью.
 * attach() переносит объект, сохраняя его мировое положение, — на глаз в кадре
 * не меняется ничего.
 */
function breakOff(p: Piece, w: Word, away: THREE.Vector3, speed: number) {
  const root = w.group.parent
  if (!root) return

  root.attach(p.obj)
  // Дрожь обнуляется: она жила в местных осях слова и здесь бессмысленна.
  p.kick.set(0, 0, 0)
  p.kickVel.set(0, 0, 0)
  p.twist.set(0, 0, 0)
  p.twistVel.set(0, 0, 0)

  // Направление удара — из местных осей слова в мировые. Только поворот и
  // масштаб, без переноса: это направление, а не точка.
  const dir = away.clone().transformDirection(w.group.matrixWorld).normalize()
  // Вверх подмешано всегда: горизонтальный толчок гонит обломок вбок, и он
  // уезжает из кадра, вместо того чтобы упасть на землю перед словом.
  dir.y += 0.45
  dir.normalize()

  p.free = {
    stage: FALLING,
    vel: dir.multiplyScalar(speed),
    spin: new THREE.Vector3(
      (Math.random() - 0.5) * THROW.breakSpin,
      (Math.random() - 0.5) * THROW.breakSpin,
      (Math.random() - 0.5) * THROW.breakSpin,
    ),
    timer: 0,
    fromPos: new THREE.Vector3(),
    fromQuat: new THREE.Quaternion(),
  }
}

/** Один кадр жизни выбитого обломка: падение, лежание, дорога домой. */
function stepFree(p: Piece, w: Word, k: number, dt: number) {
  const f = p.free!
  const floorY = GROUND.y + p.size * w.scale

  if (f.stage === FALLING) {
    f.vel.y = groundVelocity(
      p.obj.position.y,
      f.vel.y,
      dt,
      THROW.gravity,
      floorY,
      THROW.bounce,
      THROW.snap,
    )
    p.obj.position.addScaledVector(f.vel, dt)
    p.obj.rotation.x += f.spin.x * dt
    p.obj.rotation.y += f.spin.y * dt
    p.obj.rotation.z += f.spin.z * dt

    if (p.obj.position.y <= floorY) {
      p.obj.position.y = floorY
      // Трение грунта: гасит и скольжение, и кувырок. Без него обломок
      // бесконечно едет по равнине и укатывается за горизонт.
      f.vel.x *= THROW.friction
      f.vel.z *= THROW.friction
      f.spin.multiplyScalar(THROW.friction)
      if (f.vel.lengthSq() < 0.02) {
        f.vel.set(0, 0, 0)
        f.stage = LYING
        f.timer = 0
      }
    }
    return
  }

  if (f.stage === LYING) {
    f.timer += dt
    if (f.timer < THROW.rest) return
    f.stage = RETURNING
    f.timer = 0
    f.fromPos.copy(p.obj.position)
    f.fromQuat.copy(p.obj.quaternion)
    return
  }

  // ДОРОГА ДОМОЙ. Цель пересчитывается каждый кадр: слово покачивается, и
  // гнездо к моменту прилёта стоит уже не там, где было на старте.
  f.timer += dt
  const u = Math.min(f.timer / THROW.returnTime, 1)
  const s = u * u * (3 - 2 * u)

  const { target, quat } = scratch
  target.set(p.home.x + p.out.x * k, p.home.y + p.out.y * k, p.home.z + p.out.z * k)
  w.group.localToWorld(target)
  p.obj.position.lerpVectors(f.fromPos, target, s)
  // Подъём по дуге: без него обломок ползёт домой по земле, как заводной.
  p.obj.position.y += Math.sin(Math.PI * s) * THROW.returnArc

  // Родная ориентация куска задана в осях слова, а обломок сейчас висит в
  // мировых: поэтому к ней домножается мировой поворот группы.
  quat.setFromEuler(p.homeRot).premultiply(w.group.getWorldQuaternion(wq))
  p.obj.quaternion.slerpQuaternions(f.fromQuat, quat, s)

  if (u >= 1) {
    // Обратно в группу слова — и кусок снова обычный, укладку ему считает
    // общий проход.
    w.group.attach(p.obj)

    // И СРАЗУ ЖЁСТКО В ГНЕЗДО, а не «куда получилось у attach».
    //
    // attach() сохраняет МИРОВОЙ вид куска, раскладывая его в положение,
    // поворот И МАСШТАБ относительно нового родителя. Масштаб здесь и подводит:
    // у «101» группа увеличена, поэтому каждый круг «вылетел — вернулся»
    // прогонял масштаб куска через деление и умножение на 1.05. Ошибка
    // накапливается, и после десятка бросков куски приходят домой чуть не
    // своего размера — слово заживает «почти», с разъехавшимися швами.
    // Здесь ошибке накапливаться негде: гнездо задано числами, а не историей.
    p.obj.position.copy(p.home)
    p.obj.rotation.copy(p.homeRot)
    p.obj.scale.set(1, 1, 1)
    p.free = null
  }
}

/** Заведён один раз наверху модуля: иначе кватернион на каждый обломок в кадре. */
const wq = new THREE.Quaternion()

useGLTF.preload(WORDS.glb, WORDS.dracoPath)

import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, N8AO, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Words } from './Words'
import { AO, CAMERA, GROUND, RENDER, RIG, SCENE, SHADOWMAP } from './config'
import { studioEnvironment } from './studioEnv'

/**
 * Сцена с камнем для раздела «О нас».
 *
 * Перенесена из отдельного проекта logo101-3d. Здесь она живёт куском обычной
 * страницы, а не занимает экран целиком, поэтому от песочницы отличается тремя
 * вещами, и все три — про то, чтобы не мешать посетителю:
 *
 *   - шейдера перехода и привязки к прокрутке страницы больше нет. В песочнице
 *     прокрутка вела камеру по маршруту и заливала кадр; на сайте прокрутка
 *     принадлежит странице;
 *   - приближение камеры колесом выключено (DRAG.cameraZoom). Иначе колесо над
 *     сценой перестаёт листать страницу, и посетитель упирается в раздел, из
 *     которого не выбраться, — худшее, что можно сделать на посадочной;
 *   - холст не подхватывает кадры в скрытой вкладке: это отладочный костыль
 *     песочницы, в бою частоту кадров держит сам браузер.
 */

/**
 * Вешает нарисованную студию на сцену как карту окружения.
 *
 * Это и есть та самая правка, после которой камень перестаёт быть тёмным
 * пятном: грани начинают отражать потолок и софтбоксы вместо пустоты. Ни одна
 * настройка материала и ни один дополнительный источник света этого не
 * заменяют — лампа не отражается, отражается окружение.
 */
function Studio() {
  const { gl, scene } = useThree()
  const env = useMemo(() => studioEnvironment(gl), [gl])

  useEffect(() => {
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
    }
  }, [scene, env])

  return null
}

export function Scene() {
  return (
    <Canvas
      camera={{ fov: CAMERA.fov, position: [...CAMERA.path[0]] as [number, number, number] }}
      // Пикселей, а не полигонов — главный рычаг скорости. Полноэкранным
      // эффектам всё равно, что в кадре, и весь перерасход делают они.
      dpr={[1, SCENE.maxPixelRatio]}
      // Мягкие тени. PCFSoft дороже обычного PCF на доли миллисекунды, а
      // разница между «край тени лесенкой» и «край тени мягкий» — вся.
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[SCENE.background]} />
      {/* Туман того же цвета, что фон: равнина растворяется в нём, и у сцены
          нет горизонта-обрыва. Простор делает не размер плоскости, а то, что
          её края никогда не видны. */}
      <fog attach="fog" args={[SCENE.background, 6, 16]} />

      {/* Общий свет почти выключен: работу «неба» делает карта окружения. */}
      <ambientLight intensity={RIG.ambient} />

      {/* РИСУЮЩИЙ. Единственный, кто бросает тень: вторая тень от второго
          источника мгновенно выдаёт компьютерную картинку. Низко и сбоку —
          скользящий свет цепляется за сколы, и рельеф читается сам. */}
      <directionalLight
        position={RIG.keyPosition}
        intensity={RIG.keyIntensity}
        color={RIG.keyColor}
        castShadow
        shadow-mapSize-width={SHADOWMAP.size}
        shadow-mapSize-height={SHADOWMAP.size}
        shadow-camera-near={SHADOWMAP.near}
        shadow-camera-far={SHADOWMAP.far}
        shadow-camera-left={-SHADOWMAP.extent}
        shadow-camera-right={SHADOWMAP.extent}
        shadow-camera-top={SHADOWMAP.extent}
        shadow-camera-bottom={-SHADOWMAP.extent}
        shadow-bias={SHADOWMAP.bias}
        shadow-normalBias={SHADOWMAP.normalBias}
        shadow-radius={SHADOWMAP.radius}
      />

      {/* ЗАПОЛНЯЮЩИЙ: холодный и слабый, с другой стороны. Не даёт теневой
          стороне провалиться в чёрное. Тени не бросает. */}
      <directionalLight
        position={RIG.fillPosition}
        intensity={RIG.fillIntensity}
        color={RIG.fillColor}
      />

      {/* КОНТРОВОЙ сзади: обводит силуэт и отрывает глыбу от фона. */}
      <directionalLight
        position={RIG.rimPosition}
        intensity={RIG.rimIntensity}
        color={RIG.rimColor}
      />

      <Studio />

      <Suspense fallback={null}>
        <Words />
        {/* Тёмная равнина под словами. ОДНА плоскость на всю сцену: стык двух
            виден всегда, и убрать его не получается ничем. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND.y, 0]} receiveShadow>
          <planeGeometry args={[GROUND.size, GROUND.size]} />
          <meshStandardMaterial color={GROUND.color} roughness={0.96} metalness={0} />
        </mesh>
      </Suspense>

      {/* Пан выключен: увести композицию из кадра — единственное, что
          пользователь сделает паном. Приближение тоже выключено, и это
          принципиально: колесо над сценой обязано листать страницу. */}
      <OrbitControls
        makeDefault
        target={CAMERA.orbitTarget as unknown as THREE.Vector3}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={CAMERA.minDistance}
        maxDistance={CAMERA.maxDistance}
        minPolarAngle={0.55}
        maxPolarAngle={2.0}
      />

      {/* multisampling={0} обязателен: со сглаживанием эта версия
          postprocessing отдаёт чёрный кадр на three 0.185. */}
      <EffectComposer multisampling={0}>
        {/* ЗАТЕНЕНИЕ В ЩЕЛЯХ — первым, до свечения: свечение обязано
            растекаться от уже затенённой картинки, иначе оно засветит именно
            те трещины, которые AO только что углубил. Без AO трещина освещена
            ровно как грань рядом, и весь раскол читается рисунком на
            поверхности, а не глубиной. */}
        <N8AO
          aoRadius={AO.radius}
          intensity={AO.intensity}
          color={AO.color}
          quality="medium"
          aoSamples={AO.samples}
          denoiseSamples={AO.denoise}
        />
        <Bloom
          intensity={RENDER.bloomIntensity}
          luminanceThreshold={RENDER.bloomThreshold}
          luminanceSmoothing={RENDER.bloomSmoothing}
          mipmapBlur
        />
        <Vignette offset={RENDER.vignetteOffset} darkness={RENDER.vignetteDarkness} />
      </EffectComposer>
    </Canvas>
  )
}

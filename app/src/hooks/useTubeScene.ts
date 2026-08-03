import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { FLOW, GLOW, ICE, isSmallDevice } from './heroTuning'

/* the tubes walk the same palette as the text, one step behind it */
const k = GLOW.l / 0.64
const sp = ICE.length * 0.12
const p0 = ICE.length * 0.10

/* The .morph box is full width; the glyphs inside are not. Measure the ink, not the box. */
function textWidth(el: HTMLElement): number {
  let w = 0
  for (const child of Array.from(el.children) as HTMLElement[]) {
    if (getComputedStyle(child).opacity === '0') continue
    const r = child.getBoundingClientRect()
    if (r.width > w) w = r.width
  }
  return w || el.getBoundingClientRect().width
}

function tubeSet(p: number): string[] {
  return [
    window.dim(window.paletteAt(ICE, p), k),
    window.dim(window.paletteAt(ICE, p + sp), k),
    window.dim(window.paletteAt(ICE, p + sp * 2), k),
  ]
}

/**
 * WebGL ribbon scene in its own fixed, viewport-sized layer (#tubelayer).
 * Built only on a pointer machine, parked whenever the hero leaves the screen.
 * Returns the ref for the layer div.
 */
export function useTubeScene(ready: boolean, heroVisible: boolean): RefObject<HTMLDivElement | null> {
  const layerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<TubesApp | null>(null)
  /* read by the aiming effect, which must not re-subscribe every time the hero flips */
  const heroOn = useRef(heroVisible)
  heroOn.current = heroVisible

  /* The ribbon path is centred on the viewport, but the words sit above the middle of the
     screen. The layer is nudged so the path's centre lands on the morph lines: that is what
     puts the ribbons behind the text instead of over the number below it. */
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const aimTubesAtText = () => {
      /* THE fix for "it lags everywhere else": this reads two boxes, which forces a fresh
         layout, and it was doing it on every scroll frame for the entire length of the page -
         long after the ribbons had left the screen and there was nothing left to aim. Below the
         hero there is nothing to do, so it does nothing. */
      if (!heroOn.current) return
      const a = document.getElementById('liq1'), b = document.getElementById('liq2')
      if (!a || !b) return
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
      const textMid = (ra.top + rb.bottom) / 2, screenMid = (innerHeight || 1) / 2
      layer.style.transform = 'translateY(' + Math.round(textMid - screenMid) + 'px)'
    }
    /* This reads two boxes and then writes a transform. Run straight off the scroll event it
       forces the browser to lay the page out again mid-scroll, once per event, on top of the
       parallax doing its own work - the classic read-write-read sawtooth. Folded into an
       animation frame it happens once per painted frame at most, after layout is already done. */
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => { queued = false; aimTubesAtText() })
    }
    addEventListener('resize', onScroll, { passive: true })
    addEventListener('scroll', onScroll, { passive: true }) /* the words move, the band follows */
    addEventListener('load', aimTubesAtText)
    aimTubesAtText()
    return () => {
      removeEventListener('resize', onScroll)
      removeEventListener('scroll', onScroll)
      removeEventListener('load', aimTubesAtText)
    }
  }, [])

  /* build / park. The scene used to be disposed the MOMENT the hero left and rebuilt the moment
     it returned - and building means creating a WebGL context, compiling shaders and eleven
     tube geometries. Scrolled up and down fast, the hero boundary was crossed on every turn,
     so every turn paid a full scene construction mid-scroll. That was his exact symptom: fine
     until you go up and down quick, many times. Now leaving only HIDES the layer, and the
     teardown runs on a delay: bounce back within eight seconds and the scene is simply shown
     again, for free. Only a visitor who actually stays below the hero pays the disposal, once. */
  const parkTimer = useRef<number>(0)
  /* the one function that fully kills the current scene; null means there is no scene */
  const teardownRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    const layer = layerRef.current
    if (!ready || !layer) return
    /* Phones get the ribbons back, on his word - the scene that killed mobile was the OLD one:
       bloom chain, pixel ratio pinned to 2, sixteen tubes. All three are gone, so a phone now
       runs a light build instead of nothing: half the ribbons, shorter trails, no ratio above 1.
       Without a mouse the library idle-sweeps the path on its own, which is the same figure the
       cursor rests into. Only a genuinely weak device still opts out. */
    const SMALL = isSmallDevice()
    if (SMALL && navigator.deviceMemory && navigator.deviceMemory <= 3) {
      layer.style.display = 'none'
      return
    }

    if (!heroVisible) {
      layer.style.visibility = 'hidden' /* off screen NOW; the GPU stops compositing it */
      if (teardownRef.current) {
        parkTimer.current = window.setTimeout(() => {
          teardownRef.current?.()
          teardownRef.current = null
        }, 8000)
      }
      /* coming back inside the grace period cancels the execution, and the scene was never gone */
      return () => clearTimeout(parkTimer.current)
    }

    layer.style.visibility = ''
    if (teardownRef.current) return /* still warm from the grace period: nothing to build */

    const cv = document.createElement('canvas')
    cv.className = 'tubes'
    layer.appendChild(cv)
    let parked = false
    const sweepRef: { current: (() => void) | null } = { current: null }
    const resizeRef: { current: (() => void) | null } = { current: null }

    const cancelInit = window.TubesCursorInit(cv, {
      /* Bloom off. In the library this is not a strength dial - the whole post-processing chain
         is built inside `if (options.bloom)`, so false means the frame goes straight from the
         scene to the screen with no extra full-canvas passes at all. It was the largest piece
         of GPU work left on the page. The ribbons keep their own four lights, so they stay lit;
         what they lose is the halo bleeding out past their edges. One word to put it back. */
      bloom: false,
      tubes: {
        colors: tubeSet(p0),
        /* The ribbon's own length, which is its tubular segment count - not the reach of the
           path, which is sleepRadiusX/Y below. +30% on the library's 32-128. */
        /* Length stays close to the Mac; the saving is taken around the tube instead of along
           it, below. He complained the mobile ribbons were short - so they are not short. */
        minTubularSegments: SMALL ? 40 : 42,
        maxTubularSegments: SMALL ? 150 : 166,
        /* THE mobile lever, and it costs nothing anyone can see. Each ribbon's surface is
           rebuilt every frame by a loop over tubularSegments x radialSegments, so the cost is
           the product - and radialSegments is how many facets go AROUND a tube whose radius is
           at most 0.05 world units, a few pixels on screen. The library had it hardcoded to 8
           (our self-hosted copy now takes it as an option). At 5 the silhouette of something
           this thin is identical and the per-frame work drops by a third, on the CPU and in
           what gets uploaded to the GPU. Same trick on the end caps: 4 -> 2. */
        radialSegments: SMALL ? 5 : 8,
        capSegments: SMALL ? 2 : 4,
        /* Every ribbon rebuilds its geometry each frame, so the count is the main-thread cost
           of this scene almost by itself. The library's 16 overlap heavily - at 11 the bundle
           reads the same and there is a third less geometry to rebuild sixty times a second. */
        count: SMALL ? 8 : 11,
        lights: {
          intensity: GLOW.i,
          colors: [
            window.dim(window.paletteAt(ICE, p0), k),
            window.dim(window.paletteAt(ICE, p0 + sp * 0.9), k),
            window.dim(window.paletteAt(ICE, p0 + sp * 1.5), k),
            window.dim(window.paletteAt(ICE, p0 + sp * 2.1), k),
          ],
        },
      },
    }, (a) => {
      if (parked) { try { a.dispose() } catch { /* already gone */ } return }
      appRef.current = a

      /* The library pins the renderer to pixel ratio 2 and runs a bloom pass over the whole
         canvas every frame. On a Retina screen that is a 2850x1662 surface going through a
         multi-pass glow - GPU work, which is why it never showed up in the main-thread numbers
         that said this scene was "only" three.js JS. Dropping to 1.4 is 51% fewer pixels
         through every pass; on a soft glowing effect the softening is not visible. */
      try {
        const r = a.three as { minPixelRatio?: number; maxPixelRatio?: number; resize?: () => void }
        r.minPixelRatio = 1
        r.maxPixelRatio = SMALL ? 1 : 1.4 /* full ratio on the phone was a real frame cost */
        r.resize?.()
      } catch { /* older build without the knob: leave it alone */ }

      /* Two per-object settings the library leaves at three.js defaults, checked on a live scene
         before touching anything:

         matrixAutoUpdate - three.js recomputes an object's world matrix every frame in case it
         moved. These ribbons never move: what changes is the geometry inside them, and their
         transform stays the identity from build to teardown. Same for the four lights. Fifteen
         matrix recomputations a frame, for nothing.

         frustumCulled - the cull test needs a bounding sphere, which three.js derives ONCE from
         the geometry and then caches. This geometry is rewritten every frame, so that cached
         sphere is stale by design; the tubes fill the screen and are never off camera anyway.
         Turning the test off is both cheaper and safer than a stale sphere that could cull a
         visible ribbon. */
      try {
        for (const t of a.tubes.tubes ?? []) {
          t.updateMatrix(); t.matrixAutoUpdate = false; t.frustumCulled = false
        }
        for (const l of a.tubes.lights ?? []) { l.updateMatrix(); l.matrixAutoUpdate = false }
      } catch { /* a build that exposes neither list: nothing to pin */ }

      /* If the frame guard finds the machine is not coping - integrated graphics on Windows is
         the case that started this - the scene halves its own resolution rather than the page
         losing the ribbons. Quarter the pixels through every pass, one live resize. */
      const thin = () => {
        try {
          const r = a.three as { minPixelRatio?: number; maxPixelRatio?: number; resize?: () => void }
          r.minPixelRatio = 0.7
          r.maxPixelRatio = 0.7
          r.resize?.()
          /* The ribbons use a physically-based material lit by FOUR point lights, so every pixel
             of every ribbon runs the full lighting model four times - the dominant per-pixel cost
             on a weak GPU. Dropping two of the lights out of the scene makes three.js recompile
             the shader for two, halving that work. The colour cycle keeps writing all four; the
             two that are gone simply stop being read. */
          for (const l of (a.tubes.lights ?? []).slice(2)) a.tubes.remove?.(l)
        } catch { /* nothing to thin */ }
      }
      if (document.documentElement.dataset.perf === 'low') thin()
      else addEventListener('perf-low', thin, { once: true })
      /* A flat wide figure keeps the ribbons in the line of the text instead of looping down
         across the number below it.

         The sweep is a FRACTION of the window, not a fixed 360px. That fixed number is why the
         ribbons looked wide in a narrow preview pane and cramped in his own 1440px browser: the
         same 360px covers 42% of an 864px window but only 25% of his. Now it is 55% either way,
         and it is recomputed on resize. */
      const sweep = () => {
        /* Measured off the slogan itself, not off the window. A fixed 360px was too narrow on a
           wide screen; a fraction of the window was far too wide. The ribbons should reach just
           past the ends of the words and just touch the top and bottom of the two lines, so the
           radii are half the text block plus a small margin. */
        const l1 = document.getElementById('liq1')
        const l2 = document.getElementById('liq2')
        if (!l1 || !l2) return
        const a1 = l1.getBoundingClientRect()
        const a2 = l2.getBoundingClientRect()
        const textW = Math.max(textWidth(l1), textWidth(l2))
        const blockH = Math.max(a1.bottom, a2.bottom) - Math.min(a1.top, a2.top)
        /* These two are how FAR the ribbons travel, not how long the ribbon itself is.
           Narrower on his word: the path used to reach past the ends of the words, now it stays
           well inside them. Height is three quarters of the block, up 50% from a half. */
        /* The path is x=cos(t), y=sin(2t) - a lemniscate, the infinity figure. These two radii
           are its half-width and half-height, so they are what wraps it around the words.
           "Around the edges of the morph text": framed on the TEXT, which is what desktop
           already does, not on the viewport. RY is the one being tuned by eye tonight. */
        /* RX is the half-width of the figure, so at 0.38 of the text width the loop turned back
           well INSIDE the words - that was a deliberate narrowing once, and it is what made the
           infinity read as a small knot rather than something wrapping the slogan. At 0.55 the
           full span is 1.1x the text, so the two lobes cross behind the middle of the line and
           the ends reach just past the last letter on each side without leaving the screen. */
        const RX = SMALL ? 0.55 : 0.38
        const RY = SMALL ? 1.6 : 1.125
        a.options.sleepRadiusX = Math.round(textW * RX)
        a.options.sleepRadiusY = Math.round(blockH * RY)
        window.__tubeSweep = [a.options.sleepRadiusX, a.options.sleepRadiusY] /* readable proof */
      }
      sweep()
      /* LiquidText paints its spans a moment after this runs; until it does there is no ink to
         measure and the fallback is the full-width box. Re-measure once it has drawn. */
      const t1 = window.setTimeout(sweep, 400)
      const t2 = window.setTimeout(sweep, 1400)
      sweepRef.current = () => { clearTimeout(t1); clearTimeout(t2); }
      addEventListener('resize', sweep, { passive: true })
      resizeRef.current = sweep
    })

    /* NOT returned as this effect's cleanup - that is the whole fix. React would run a cleanup
       on every visibility flip, which is what made every fast scroll pay a scene rebuild. The
       teardown now belongs to whoever decides the scene is truly done: the grace timer above,
       or the unmount effect below. */
    teardownRef.current = () => {
      parked = true
      cancelInit()
      if (resizeRef.current) removeEventListener('resize', resizeRef.current)
      if (sweepRef.current) sweepRef.current() /* clears the two re-measure timers */
      const app = appRef.current
      if (app) { try { app.dispose() } catch { /* nothing to dispose */ } appRef.current = null }
      cv.remove()
    }
  }, [ready, heroVisible])

  /* unmount only: whatever state the scene is in, end it */
  useEffect(() => () => {
    clearTimeout(parkTimer.current)
    teardownRef.current?.()
    teardownRef.current = null
  }, [])

  /* Colour cycle. It used to keep an animation frame loop alive for the whole life of the page
     and simply return early while there was no scene - a wake-up sixty times a second, for the
     entire time the visitor is anywhere below the hero, to do nothing. Now the loop only exists
     while the hero does. */
  useEffect(() => {
    if (!heroVisible) return
    let hue = 0, last = 0, raf = 0, warned = false
    const cycle = (now: number) => {
      raf = requestAnimationFrame(cycle)
      const app = appRef.current
      if (!app) { last = now; return }
      if (now - last < 62) return
      /* SAME rate as the slogan: LiquidText walks the palette in FLOW seconds, and this was
         doing it in FLOW*3, so after a few seconds the ribbons and the words were on completely
         different colours. One shared tempo; p0 keeps the ribbons a step behind, as intended. */
      hue = (hue + 360 * (now - last) / 1000 / (FLOW * 3)) % 360; last = now
      const p = hue / 360 * ICE.length + p0
      try {
        app.tubes.setColors(tubeSet(p))
        app.tubes.setLightsColors([
          window.dim(window.paletteAt(ICE, p + sp * 0.3), k),
          window.dim(window.paletteAt(ICE, p + sp * 0.9), k),
          window.dim(window.paletteAt(ICE, p + sp * 1.5), k),
          window.dim(window.paletteAt(ICE, p + sp * 2.1), k),
        ])
        window.__tubeHue = Math.round(hue) /* readable proof that the cycle is alive */
      } catch (e) { if (!warned) { warned = true; console.warn('tube colours:', e) } }
    }
    cycle(0)
    return () => { cancelAnimationFrame(raf) }
  }, [heroVisible])

  return layerRef
}

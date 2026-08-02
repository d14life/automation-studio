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

  /* The ribbon path is centred on the viewport, but the words sit above the middle of the
     screen. The layer is nudged so the path's centre lands on the morph lines: that is what
     puts the ribbons behind the text instead of over the number below it. */
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const aimTubesAtText = () => {
      const a = document.getElementById('liq1'), b = document.getElementById('liq2')
      if (!a || !b) return
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
      const textMid = (ra.top + rb.bottom) / 2, screenMid = (innerHeight || 1) / 2
      layer.style.transform = 'translateY(' + Math.round(textMid - screenMid) + 'px)'
    }
    addEventListener('resize', aimTubesAtText, { passive: true })
    addEventListener('scroll', aimTubesAtText, { passive: true }) /* the words move, the band follows */
    addEventListener('load', aimTubesAtText)
    aimTubesAtText()
    return () => {
      removeEventListener('resize', aimTubesAtText)
      removeEventListener('scroll', aimTubesAtText)
      removeEventListener('load', aimTubesAtText)
    }
  }, [])

  /* build / park. The scene is disposed and the canvas removed the moment the hero leaves,
     so nothing is left running behind the rest of the page. */
  useEffect(() => {
    const layer = layerRef.current
    if (!ready || !layer) return
    /* No WebGL on a phone: half resolution was still too much for the device most visitors use. */
    if (isSmallDevice()) { layer.style.display = 'none'; return }
    if (!heroVisible) return

    const cv = document.createElement('canvas')
    cv.className = 'tubes'
    layer.appendChild(cv)
    let parked = false
    const sweepRef: { current: (() => void) | null } = { current: null }
    const resizeRef: { current: (() => void) | null } = { current: null }

    const cancelInit = window.TubesCursorInit(cv, {
      tubes: {
        colors: tubeSet(p0),
        /* The ribbon's own length, which is its tubular segment count - not the reach of the
           path, which is sleepRadiusX/Y below. +30% on the library's 32-128. */
        minTubularSegments: 42,
        maxTubularSegments: 166,
        /* Every ribbon rebuilds its geometry each frame, so the count is the main-thread cost
           of this scene almost by itself. The library's 16 overlap heavily - at 11 the bundle
           reads the same and there is a third less geometry to rebuild sixty times a second. */
        count: 11,
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
        r.maxPixelRatio = 1.4
        r.resize?.()
      } catch { /* older build without the knob: leave it alone */ }
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
        a.options.sleepRadiusX = Math.round(textW * 0.38)
        a.options.sleepRadiusY = Math.round(blockH * 1.125)
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

    return () => {
      parked = true
      cancelInit()
      if (resizeRef.current) removeEventListener('resize', resizeRef.current)
      if (sweepRef.current) sweepRef.current() /* clears the two re-measure timers */
      const app = appRef.current
      if (app) { try { app.dispose() } catch { /* nothing to dispose */ } appRef.current = null }
      cv.remove()
    }
  }, [ready, heroVisible])

  /* colour cycle: runs for the life of the page, idles while there is no scene */
  useEffect(() => {
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
  }, [])

  return layerRef
}

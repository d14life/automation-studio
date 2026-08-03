/* Ambient types for the two plain <script> libraries the page loads from /public.
   Signatures are read off public/anim3.js and public/win.js, not guessed. */

export {}

declare global {
  /* ---------- anim3.js ---------- */

  interface StarfieldOptions {
    starColor?: string
    bgColor?: string
    mouseAdjust?: boolean
    easing?: number
    clickToWarp?: boolean
    warpFactor?: number
    opacity?: number
    speed?: number
    quantity?: number
    /* how far the field spreads from the centre; defaults to quantity/2, which used to couple
       the two so that adding stars pushed them off-screen. Set it to keep the count honest. */
    spread?: number
    /* a phone does not need 60 fps of starfield */
    minFrameMs?: number
    zIndex?: number
  }
  /* the returned stop() also carries setQuantity, attached to the function object */
  interface StarfieldStop {
    (): void
    setQuantity(n: number): void
  }

  interface LiquidTextOptions {
    /** the SVG url(#threshold) goo. false keeps the melt and drops the filter (touch devices) */
    threshold?: boolean
    morphTime?: number
    cooldownTime?: number
    colors?: string[]
    flow?: number
    drift?: number
    spread?: number
    letters?: boolean
    activeWhen?: () => boolean
    simple?: boolean
  }
  /* LiquidText hangs letterSpans() on the host element it was given */
  interface LiquidTextHost extends HTMLElement {
    letterSpans?(): HTMLElement[]
  }

  /* threejs-components tubes1 instance, only the members the page touches */
  interface TubesApp {
    /** the renderer wrapper; carries the pixel-ratio knobs and resize() */
    three?: { minPixelRatio?: number; maxPixelRatio?: number; resize?: () => void }
    options: { sleepRadiusX: number; sleepRadiusY: number }
    tubes: {
      setColors(colors: string[]): void
      setLightsColors(colors: string[]): void
      /* the meshes and the four point lights, so the page can pin their matrices and, on a
         machine that cannot cope, take two lights back out of the scene */
      tubes?: {
        updateMatrix(): void
        matrixAutoUpdate: boolean
        frustumCulled: boolean
      }[]
      lights?: { updateMatrix(): void; matrixAutoUpdate: boolean }[]
      remove?(child: unknown): void
    }
    dispose(): void
  }
  interface TubesOptions {
    /** the library builds a whole post-processing chain only `if (options.bloom)`; false skips it */
    bloom?: false | { threshold?: number; strength?: number; radius?: number }
    tubes?: {
      colors?: string[]
      /** how many ribbons; the library's own default is 16 */
      count?: number
      /* trail length of each ribbon; the library's own defaults are 32 and 128 */
      minTubularSegments?: number
      maxTubularSegments?: number
      /* facets around the tube and across its end cap. The library hardcodes 8 and 4; our
         self-hosted copy passes them through, because their product with the segment count is
         the per-frame surface rebuild and that is the whole mobile cost. */
      radialSegments?: number
      capSegments?: number
      lights?: { intensity?: number; colors?: string[] }
    }
  }

  /* ---------- win.js ---------- */

  interface WinOpenOptions {
    key?: string
    title?: string
    body?: HTMLElement | null
    host?: HTMLElement
    w?: number
    h?: number
    dock?: boolean
    onClose?: (key: string) => void
  }
  interface WinMgrApi {
    open(o: WinOpenOptions): HTMLElement
    close(key: string): void
    minimize(key: string): void
    maximize(key: string): void
    focus(key: string): void
    setBadge(key: string, flag: boolean): void
    isOpen(key: string): boolean
  }

  interface Window {
    Starfield1(host: HTMLElement, o?: StarfieldOptions): StarfieldStop
    LiquidText(host: LiquidTextHost, texts: string[], o?: LiquidTextOptions): () => void
    /* returns a cancel() for the 100 ms init timer */
    TubesCursorInit(
      canvas: HTMLCanvasElement,
      opts?: TubesOptions,
      onReady?: (app: TubesApp) => void,
    ): () => void
    flowGrad(cs: string[]): string
    paletteAt(pal: string[], p: number): string
    dim(hex: string, k: number): string
    hslHex(h: number, s?: number, l?: number): string
    tubesRandomColors(count: number): string[]
    WinMgr: WinMgrApi
    /* readable proof that the tube colour cycle is alive */
    __tubeHue?: number
    /* [sleepRadiusX, sleepRadiusY] - how far the ribbons travel, readable for checking */
    __tubeSweep?: [number, number]
    /* last measured frame rate, written once by usePerfGuard - proof on a real machine */
    __perfFps?: number
  }

  interface Navigator {
    /* non-standard, part of the SMALL test */
    readonly deviceMemory?: number
  }
}

"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* Border Beam Panel — from Motiq (https://motiq.dev/components/border-beam-panel).
   MIT licensed. Zero runtime dependencies. */

/* -------------------------------------------------------------------------- */
/* Motiq design tokens                                                        */
/* -------------------------------------------------------------------------- */
/* Rendered with the component, in a low cascade layer, so your own
   `:root { --motiq-*: … }` always wins. Move it to globals.css to drop it. */
const MOTIQ_TOKENS = "@layer motiq{:root{--motiq-accent:#315fea;--motiq-accent-text:#244fd1;--motiq-bg:#f7f9fc;--motiq-border:#dce4ef;--motiq-border-strong:#c5d1e1;--motiq-fg:#101828;--motiq-fg-secondary:#344054;--motiq-muted:#667085;--motiq-secondary-accent:#009fb3;--motiq-signature:#e9564a;--motiq-surface:#ffffff;--motiq-surface-2:#f8fafd}}@layer motiq{.dark,[data-theme=\"dark\"]{--motiq-accent:#4f7cff;--motiq-accent-text:#7f9fff;--motiq-bg:#080c14;--motiq-border:#263449;--motiq-border-strong:#354863;--motiq-fg:#f8fafc;--motiq-fg-secondary:#cbd5e1;--motiq-muted:#9caabd;--motiq-secondary-accent:#22c7d9;--motiq-signature:#ff6b5e;--motiq-surface:#111827;--motiq-surface-2:#192337}}";

/** Merge Tailwind class names; later/consumer classes win on conflict. */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ---- motion primitives (inlined from @motiq/primitives) ---- */

/**
 * SSR-safe `prefers-reduced-motion`. Reads synchronously on the client so a
 * reduced-motion user never sees a frame of motion; the value is never rendered
 * into markup, so there is no hydration-mismatch risk.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Returns whether the referenced element is currently worth animating — i.e.
 * on-screen AND the tab is visible. Use it to pause per-frame work, autoplay,
 * or streaming when the component scrolls away or the tab is backgrounded.
 */
function useVisibilityPause<T extends Element>(
  ref: React.RefObject<T | null>,
  { threshold = 0.1 }: { threshold?: number } = {},
): boolean {
  const [onScreen, setOnScreen] = React.useState(true);
  const [tabVisible, setTabVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  React.useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return onScreen && tabVisible;
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface BorderBeamPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Panel content — semantics and layout are entirely yours. */
  children?: React.ReactNode;
  /** One comet, or two opposed comets 180° apart. */
  beams?: 1 | 2;
  /** Comet colors. The second defaults to the rare coral signature. */
  colors?: [string, string?];
  /** Ring thickness in px. */
  thickness?: number;
  /** Resting angular velocity in deg/s (~8.5s per lap at 42). */
  idleSpeed?: number;
  /** Hover/focus angular velocity in deg/s — the springs wind up toward it. */
  hoverSpeed?: number;
  /** Blurred copy of the ring behind the panel, read as cast light. */
  glow?: boolean;
  /** Corner radius in px. */
  radius?: number;
  /** Velocity spring — the SPEED is sprung, so the comets coast instead of snapping. */
  spring?: { stiffness?: number; damping?: number };
  /** Deterministic starting angle (SSR-stable; no Math.random). */
  seed?: number;
  /** Park the loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free lit-border state regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics + gradient                                                         */
/* -------------------------------------------------------------------------- */

/** Hand-rolled delta-time spring — keeps the component dependency-free. */
class Spring {
  x: number;
  v = 0;
  target: number;
  k: number;
  d: number;
  constructor(value: number, k: number, d: number) {
    this.x = value;
    this.target = value;
    this.k = k;
    this.d = d;
  }
  step(dt: number): number {
    const a = this.k * (this.target - this.x) - this.d * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Static angle under reduced motion — both comets sit on visible edges. */
const PARKED_ANGLE = 40;

/**
 * One comet: a ~45° tail easing into a 4° bright head. The toe uses a 4% mix of
 * the comet color rather than `transparent`, because `transparent` is
 * rgba(0,0,0,0) and a conic ramp through it dips visibly gray.
 */
function comet(tail: string, head: string, tip: string, midAlpha: number, start: number): string {
  return [
    `color-mix(in srgb, ${tail} 4%, transparent) ${start + 18}deg`,
    `color-mix(in srgb, ${tail} ${midAlpha}%, transparent) ${start + 46}deg`,
    `${head} ${start + 56}deg`,
    `${tip} ${start + 60}deg`,
    `transparent ${start + 63}deg`,
  ].join(", ");
}

function ringGradient(beams: 1 | 2, colors: [string, string?] | undefined): string {
  const tail0 = colors?.[0] ?? "var(--motiq-accent, #4f7cff)";
  // Default comet reads azure → cyan along its length; a custom color stays itself.
  const head0 = colors?.[0] ?? "var(--motiq-secondary-accent, #22c7d9)";
  const stops = [
    "transparent 0deg",
    comet(tail0, head0, `color-mix(in srgb, ${head0} 22%, #ffffff)`, 55, 0),
  ];
  // The single coral moment on this surface — the second comet's head.
  if (beams === 2) {
    const c1 = colors?.[1] ?? "var(--motiq-signature, #ff6b5e)";
    stops.push("transparent 198deg", comet(c1, c1, `color-mix(in srgb, ${c1} 26%, #ffffff)`, 50, 198));
  }
  stops.push("transparent 360deg");
  return `conic-gradient(from var(--mk-beam-a, 0deg), ${stops.join(", ")})`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * BorderBeamPanel — twin comets orbiting a 2px border ring. The ring is a
 * rotating conic gradient cut with a two-layer CSS ALPHA mask
 * (`mask-composite: exclude`); SVG luminance masks are deliberately avoided
 * because they silently no-op in Chromium. The angular VELOCITY itself is
 * sprung (k=30, d=11) toward 240°/s on hover and back to 42°/s on leave, so the
 * beams wind up and coast instead of snapping between speeds. Only one custom
 * property changes per frame — panel content never repaints. Clean-room original.
 */
function BorderBeamPanelBase({
  children,
  beams = 2,
  colors,
  thickness = 2,
  idleSpeed = 42,
  hoverSpeed = 240,
  glow = true,
  radius = 16,
  spring,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: BorderBeamPanelProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-beam-${uid}`;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  // Resolved after mount so SSR and first client render agree on data-motion.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const stiffness = spring?.stiffness ?? 30;
  const damping = spring?.damping ?? 11;

  // Deterministic start angle — a lap phase, never Math.random (SSR-stable).
  const startAngle = React.useMemo(() => ((seed * 137.508) % 360 + 360) % 360, [seed]);

  const speedRef = React.useRef(new Spring(idleSpeed, stiffness, damping));
  const angleRef = React.useRef(startAngle);
  const liveRef = React.useRef({ idleSpeed, hoverSpeed });
  liveRef.current = { idleSpeed, hoverSpeed };

  React.useEffect(() => {
    speedRef.current.k = stiffness;
    speedRef.current.d = damping;
  }, [stiffness, damping]);

  const paint = React.useCallback((angle: number) => {
    rootRef.current?.style.setProperty("--mk-beam-a", `${(((angle % 360) + 360) % 360).toFixed(2)}deg`);
  }, []);

  /* The donor gives every panel its own animation frame loop, running a spring and writing a
     custom property sixty times a second. On this page there are eight of them, and because
     idleSpeed and hoverSpeed are set to the same value everywhere - nothing here reacts to
     hover - that spring only ever produces one constant rate. A constant rotation is exactly
     what a CSS animation does, off the main thread and for free.

     So: no script at all when the two speeds match, which is every panel on this page. The
     donor's loop is kept for the case where they differ, so the component still behaves as
     written for anyone using it properly. */
  const constantRate = idleSpeed === hoverSpeed;

  React.useEffect(() => {
    if (!animate || constantRate) return;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      angleRef.current += speedRef.current.step(dt) * dt;
      paint(angleRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, paint, constantRate]);

  React.useEffect(() => {
    if (!staticMode) return;
    angleRef.current = PARKED_ANGLE;
    speedRef.current.x = speedRef.current.target = liveRef.current.idleSpeed;
    speedRef.current.v = 0;
    paint(PARKED_ANGLE);
  }, [staticMode, paint]);

  const surge = React.useCallback(() => {
    speedRef.current.target = liveRef.current.hoverSpeed;
  }, []);
  const settle = React.useCallback(() => {
    speedRef.current.target = liveRef.current.idleSpeed;
  }, []);

  const gradient = React.useMemo(() => ringGradient(beams, colors), [beams, colors]);
  /* the same gradient with the live angle swapped for a fixed one - see .mk-beam-glow below */
  /* Both the ring and its halo now use a fixed-angle gradient: the ring is a static layer that
     gets TURNED, the halo does not move at all. The live-angle form is kept only for a caller
     that drives --mk-beam-a from script (idleSpeed !== hoverSpeed), which this page never does. */
  const glowGradient = React.useMemo(
    () => gradient.replace('from var(--mk-beam-a, 0deg)', 'from 0deg'),
    [gradient],
  );

  const css = `
.${cls} .mk-beam-ring, .${cls} .mk-beam-glow {
  position: absolute;
  inset: -1px;
  border-radius: ${radius}px;
  pointer-events: none;
}
.${cls} .mk-beam-ring {
  padding: ${Math.max(1, thickness)}px;
  overflow: hidden;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
/* The comets no longer come from an animated angle. Animating a registered custom property
   makes the browser recalculate style and REPAINT the element on every single frame - the
   gradient is rebuilt sixty times a second - and eight of these were doing it at once. The
   same picture is a STATIC conic gradient on a layer that is simply turned, and turning is
   the one thing the compositor does for free without waking the main thread.
   The layer is twice the panel so no corner is ever uncovered as it turns, and the ring mask
   above clips it back to a hairline border. */
.${cls} .mk-beam-ring::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: ${glowGradient};
  animation: mk-beam-turn var(--mk-beam-dur, 8.5s) linear infinite;
  animation-delay: var(--mk-beam-delay, 0s);
  will-change: transform;
}
.${cls} .mk-beam-glow { background: ${glowGradient}; }
@keyframes mk-beam-turn { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-beam-ring::before { animation: none }
}
/* The halo is a second copy of the ring gradient under a 14px blur. Reading the live angle
   meant the browser rebuilt a conic gradient AND re-blurred it, every frame, over the whole
   panel - on the biggest panel here that is ~149,000 pixels, sixty times a second. Pinned to a
   fixed angle it is painted once and never again. At 0.35 opacity behind a 14px blur, a halo
   that turns and a halo that does not are the same picture; the sharp ring above it still
   spins, and that is the part the eye follows. */
.${cls} .mk-beam-glow { filter: blur(14px); opacity: 0.35; z-index: -1; }
@media (forced-colors: active) {
  .${cls} .mk-beam-ring, .${cls} .mk-beam-glow { display: none; }
  .${cls} { border-color: CanvasText; }
}`.trim();

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      onPointerEnter={surge}
      onPointerLeave={settle}
      onFocus={surge}
      onBlur={settle}
      className={cn(
        "relative w-full border border-[var(--motiq-border,#263449)] bg-[var(--motiq-surface,#111827)] p-7",
        /* Constant rate: the browser turns the angle itself and no frame loop is ever created.
           Not gated on the visibility pause the way the script was - that gate existed to stop
           a main-thread loop, and a CSS animation on something off screen costs nothing. */
        !staticMode && constantRate ? "mk-beam-css" : null,
        cls,
        className,
      )}
      style={{
        borderRadius: `${radius}px`,
        isolation: "isolate",
        ["--mk-beam-a" as string]: `${startAngle.toFixed(2)}deg`,
        /* one turn at idleSpeed degrees a second, started part-way round so the panels are
           not all in step - the same job the seed did for the script */
        ["--mk-beam-dur" as string]: `${(360 / Math.max(1, idleSpeed)).toFixed(3)}s`,
        ["--mk-beam-delay" as string]: `${(-startAngle / Math.max(1, idleSpeed)).toFixed(3)}s`,
        ...style,
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {glow ? <div aria-hidden="true" className="mk-beam-glow" /> : null}
      <div aria-hidden="true" className="mk-beam-ring" />
      {children}
    </div>
  );
}

export function BorderBeamPanel(props: BorderBeamPanelProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOTIQ_TOKENS }} />
      <BorderBeamPanelBase {...props} />
    </>
  );
}

export default BorderBeamPanel;

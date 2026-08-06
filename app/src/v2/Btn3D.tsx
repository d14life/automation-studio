import type { CSSProperties } from 'react'

/* THE 3D CTA. His pick: 21st.dev @theutkarshmail/3d-button. Ported, not pasted.

   What the donor actually ships is markup plus a block of @keyframes - the surface itself
   (the slab, the glow, the letter grid, the arrow) is not in the registry payload, so it is
   written here. Three deliberate departures from the preview he sent:

   1. Plain CSS in v2.css, not Tailwind classes. This project has no Tailwind and no `cn`;
      the handoff's 21st.dev convention is keep the mechanism, drop the dependency - the same
      port the sky toggle got.
   2. The site's accent, not the donor's violet. A purple button on a cyan-on-navy page is a
      second brand. One variable (--b3-face/--b3-edge/--b3-glow) switches it back.
   3. The arrow hops sides instead of flying 128px. The donor hard-codes the flight distance
      to the width of the English word "Join Today"; a Russian label is a different width and
      the number would be a lie. It fades out on one side and in on the other, which is what
      the flight reads as anyway.

   The letters are split so each one can leave and arrive on its own delay - that per-letter
   stagger IS the component. Split letters wreck the accessible name, so the whole face is
   aria-hidden and the link carries aria-label. */

const chars = (s: string) =>
  [...s].map((c, i) => (
    <span key={i} style={{ '--i': i + 1 } as CSSProperties}>{c === ' ' ? ' ' : c}</span>
  ))

export function Btn3D({ href, label, hover, className }: {
  href: string
  label: string
  /* the second face, revealed on hover. Same length as `label` keeps the pill from resizing
     mid-animation - the two states share one grid cell. */
  hover: string
  className?: string
}) {
  return (
    <a className={className ? `btn3d ${className}` : 'btn3d'} href={href} aria-label={label}>
      <span className="btn3d__bg" aria-hidden="true" />
      {/* the ink that flicks off the pill on hover. Donor geometry, unchanged. */}
      <svg className="btn3d__splash" xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 342 208" aria-hidden="true" focusable="false">
        <path strokeLinecap="round" strokeWidth={3} d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362" />
        <path strokeLinecap="round" strokeWidth={3} d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449" />
        <path strokeLinecap="round" strokeWidth={3} d="M230.578 57.4476C230.578 57.4476 225.785 41.5051 236.061 30.4998C246.337 19.4945 244.686 12.9998 244.686 12.9998" />
        <path strokeLinecap="round" strokeWidth={3} d="M230.578 150.528C230.578 150.528 225.785 166.471 236.061 177.476C246.337 188.481 244.686 194.976 244.686 194.976" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 57.0278C170.392 57.0278 173.89 42.1322 169.571 29.54C165.252 16.9478 168.751 2.05227 168.751 2.05227" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 150.948C170.392 150.948 173.89 165.844 169.571 178.436C165.252 191.028 168.751 205.924 168.751 205.924" />
        <path strokeLinecap="round" strokeWidth={3} d="M112.609 57.4476C112.609 57.4476 117.401 41.5051 107.125 30.4998C96.8492 19.4945 98.5 12.9998 98.5 12.9998" />
        <path strokeLinecap="round" strokeWidth={3} d="M112.609 150.528C112.609 150.528 117.401 166.471 107.125 177.476C96.8492 188.481 98.5 194.976 98.5 194.976" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 64.9917C62.2941 64.9917 55.4671 49.8089 40.4932 48.2295C25.5194 46.6501 23.7159 36.5272 23.7159 36.5272" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 145.984C62.2941 145.984 55.4671 161.167 40.4932 162.746C25.5194 164.326 23.7159 174.449 23.7159 174.449" />
      </svg>
      <span className="btn3d__outline" aria-hidden="true" />
      <span className="btn3d__face" aria-hidden="true">
        <span className="btn3d__char btn3d__char--1">{chars(label)}</span>
        <span className="btn3d__char btn3d__char--2">{chars(hover)}</span>
        <span className="btn3d__icon"><span className="btn3d__fly"><i className="btn3d__arrow" /></span></span>
      </span>
    </a>
  )
}

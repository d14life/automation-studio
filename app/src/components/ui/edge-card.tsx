/* Service cards, second design. The first was the skew-gradient showcase, and it was the most
   expensive thing left on the page: each card carried a full-size skewed panel under a 30px CSS
   blur - a real filter, so the browser gives it its own layer and re-blurs it on every composite,
   six times over - plus twelve blob spans animating forever whether or not anyone was looking.

   This one has NO always-running animation and NO filter at all. The face is a static gradient,
   the rim is a masked gradient hairline, and the only motion is on hover: a transform and two
   opacity fades, which the compositor does without touching the main thread. */

export interface EdgeCard {
  title: string
  desc: string
  /** the one-line promise under the copy */
  cta?: string
}

export function EdgeCards({ cards, className = '' }: { cards: EdgeCard[]; className?: string }) {
  return (
    <div className={'edgerow ' + className}>
      {cards.map((c) => (
        <article className="edgecard" key={c.title}>
          {/* the light that leans across the face; opacity only, so hover costs nothing */}
          <span className="edgecard-sheen" aria-hidden="true" />
          <h3>{c.title}</h3>
          <p>{c.desc}</p>
          {c.cta ? <span className="edgecard-cta">{c.cta}</span> : null}
        </article>
      ))}
    </div>
  )
}

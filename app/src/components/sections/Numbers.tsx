import { lazy, Suspense, useEffect, useRef, useState } from 'react'

/* The sparkle strip runs on tsparticles, which is a whole particle engine with its own frame
   loop. It was pulled into the first bundle and started up on page load, for a decoration that
   lives most of the way down the page. Split out, it leaves the initial download entirely and
   is only fetched and started when this section is about to come into view. Once it is there it
   behaves exactly as before. */
const SparklesCore = lazy(() =>
  import('@/components/ui/sparkles').then((m) => ({ default: m.SparklesCore })),
)

/* His friend's brief, in his own words: "бизнес любит цифры, цифр нужно больше". This is that
   band, with the sparkles donor as a lit strip under the heading.

   Every number here is one the page already stands behind - the prepayment, the receivables
   build for the construction group, the price formats the collector reads, the reply window.
   Nothing invented: the two slots that would need Damir's own figures, headcount and prices,
   stay out of this section rather than being filled with something plausible. */
const FIGURES = [
  { n: '0 ₽', of: 'предоплата', sub: 'платите, только если инструмент помог' },
  { n: '1 день', of: 'на учёт взаиморасчётов', sub: 'строительная группа, готово за день' },
  { n: '48', of: 'контрагентов', sub: 'в том же учёте, 3 юрлица и мультивалюта' },
  { n: '12', of: 'форматов прайсов', sub: 'сборщик читает их и сводит в одну таблицу' },
  { n: '1', of: 'рабочий день', sub: 'столько ждать письменного ответа' },
]

export function Numbers() {
  /* one observer, one boolean, no library: start the engine a screen and a half early so it is
     already drawing by the time the strip is actually looked at, then stop watching. */
  const strip = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = strip.current
    if (!el || live) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setLive(true); io.disconnect() } },
      { rootMargin: '150% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [live])

  return (
    <section className="band" id="numbers"><div className="wrap">
      <p className="eyebrow">Цифры</p>
      <h2>Что это значит в числах</h2>

      {/* the donor strip: two hairlines with the particle field falling away underneath */}
      <div className="sparkstrip" ref={strip}>
        <div className="sp-line sp-line-wide" />
        <div className="sp-line sp-line-narrow" />
        {live && (
          <Suspense fallback={null}>
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={420}
              className="sp-core"
              particleColor="#DFF6FF"
              speed={2}
            />
          </Suspense>
        )}
        {/* the donor's own trick: a radial mask so the field has no hard edges */}
        <div className="sp-mask" />
      </div>

      <div className="figs">
        {FIGURES.map((f) => (
          <div className="fig" key={f.n + f.of}>
            <b>{f.n}</b>
            <span className="fig-of">{f.of}</span>
            <span className="fig-sub">{f.sub}</span>
          </div>
        ))}
      </div>
    </div></section>
  )
}

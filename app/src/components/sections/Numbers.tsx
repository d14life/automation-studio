import { SparklesCore } from '@/components/ui/sparkles'

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
  return (
    <section className="band" id="numbers"><div className="wrap">
      <p className="eyebrow">Цифры</p>
      <h2>Что это значит в числах</h2>

      {/* the donor strip: two hairlines with the particle field falling away underneath */}
      <div className="sparkstrip">
        <div className="sp-line sp-line-wide" />
        <div className="sp-line sp-line-narrow" />
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={420}
          className="sp-core"
          particleColor="#DFF6FF"
          speed={2}
        />
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

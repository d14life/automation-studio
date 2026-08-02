import { GlowingShadow } from '@/components/ui/glowing-shadow'

/* The donor card is 35vw at a fixed 1.5:1 with absolutely-positioned content. Four of those
   overflow the row, so its size is reined in by rules scoped to .steps in site.css — the
   donor file itself is untouched. .step stays on the inner div so the step number, the
   typography and the counter all survive. */
export function HowItWorks() {
  return (
    <section className="band" id="how"><div className="wrap">
      <p className="eyebrow">Как идёт работа</p>
      <h2>Четыре шага, никаких сюрпризов</h2>
      <div className="steps">
        <GlowingShadow><div className="step"><b>Разбор задачи</b><span>Разговор и взгляд на то, как работа устроена сейчас.
          На выходе письменное описание, что именно будет собрано и в какой срок. Бесплатно, ни к чему не обязывает.</span></div></GlowingShadow>
        <GlowingShadow><div className="step"><b>Сначала пробуете</b><span>Первая рабочая версия приходит за дни, а не в конце проекта.
          Вы гоняете её на реальной работе. Не помогло - расходимся, вы ничего не должны.</span></div></GlowingShadow>
        <GlowingShadow><div className="step"><b>Передача</b><span>Исходный код, документация, обучение сотрудников и доступы.
          Ничего не заперто: захотите передать другому подрядчику - сможете.</span></div></GlowingShadow>
        <GlowingShadow><div className="step"><b>Поддержка</b><span>Фиксированная месячная сумма или по часам, на ваш выбор.
          Или вообще без поддержки. Это ваша система.</span></div></GlowingShadow>
      </div>
    </div></section>
  )
}

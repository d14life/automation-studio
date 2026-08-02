import SkewCards from '@/components/ui/gradient-card-showcase'
import type { SkewCard } from '@/components/ui/gradient-card-showcase'

/* The six service cards use the skew-gradient showcase instead of the beam ring, on his word:
   "for some of the containers use this and replace the old beaming light animation".

   The donor's neon pairs are gone - he asked for no colour, just liquid glass. Passing
   translucent whites through the component's own gradient props keeps every skew, blur and
   transition of the original while turning the panels into panes of glass: the sharp copy is
   the pane, the 30px-blurred copy behind it is the light it casts. */
const G: [string, string][] = [
  ['rgba(255,255,255,0.20)', 'rgba(223,246,255,0.05)'],
  ['rgba(223,246,255,0.17)', 'rgba(255,255,255,0.05)'],
  ['rgba(255,255,255,0.16)', 'rgba(127,216,255,0.06)'],
]

const SERVICES: SkewCard[] = [
  {
    title: 'Счета, акты, сверка',
    desc: 'Документы создаются из состояния сделки, долги и переплаты видны по каждому контрагенту, платёжный календарь сам показывает, что горит.',
    cta: 'Закрытие месяца за день вместо недели',
  },
  {
    title: 'Заявки, клиенты, звонки',
    desc: 'CRM под ваши этапы, телефония с записью разговоров, автообзвон по базе, проверка компании по реквизитам перед сделкой.',
    cta: 'Ни одна заявка не теряется в мессенджерах',
  },
  {
    title: 'Сбор данных',
    desc: 'Сайты конкурентов, прайсы поставщиков в двенадцати форматах, почта, выгрузки из 1С и маркетплейсов - всё стекается в одну таблицу само.',
    cta: 'Никто не переносит цифры руками',
  },
  {
    title: 'Отчёты руководителю',
    desc: 'Один экран с деньгами, долгами, загрузкой и просрочками. Письмо в тот час, когда показатель вышел за границу, а не через месяц на планёрке.',
    cta: 'Цифры утром, а не в конце квартала',
  },
  {
    title: 'Боты и ИИ',
    desc: 'Отвечают клиенту по вашему прайсу и остаткам, читают счета и договоры, заполняют формы, заносят контакт в базу и передают человеку сложное.',
    cta: 'Первая линия работает ночью и в выходные',
  },
  {
    title: 'Склад и доставка',
    desc: 'Заказы, остатки, маршруты и статусы отгрузок на одной доске. Клиент видит, где его груз, без звонка менеджеру.',
    cta: 'Меньше звонков, меньше потерянных заказов',
  },
].map((c, i) => ({ ...c, gradientFrom: G[i % 3][0], gradientTo: G[i % 3][1] }))

export function Services() {
  return (
    <section className="band" id="services"><div className="wrap">
      <p className="eyebrow">Услуги</p>
      <h2>Что умеем и что это снимает с вас</h2>
      {/* the donor's own wrapper minus its full-screen height, which a page section does not want */}
      <SkewCards cards={SERVICES} className="skewrow flex justify-center items-start flex-wrap" />
    </div></section>
  )
}

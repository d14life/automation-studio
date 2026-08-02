import { EdgeCards } from '@/components/ui/edge-card'
import type { EdgeCard } from '@/components/ui/edge-card'

/* Second design for the six service cards. The skew-gradient donor is gone on his word - it was
   the heaviest thing on the page, a card-sized 30px blur per card plus twelve blob spans
   animating forever. These cards do not animate at rest at all; the sheen and the lift happen
   on hover, in transform and opacity only. */

const SERVICES: EdgeCard[] = [
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
]

export function Services() {
  return (
    <section className="band" id="services"><div className="wrap">
      <p className="eyebrow">Услуги</p>
      <h2>Что умеем и что это снимает с вас</h2>
      <EdgeCards cards={SERVICES} />
    </div></section>
  )
}

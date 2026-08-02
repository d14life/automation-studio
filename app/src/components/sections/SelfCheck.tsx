import { BorderBeamPanel } from '@/components/ui/border-beam-panel'

const R = 22
const BEAM = { beams: 2, thickness: 3, idleSpeed: 42, hoverSpeed: 42, glow: true } as const

export function SelfCheck() {
  return (
    <section className="band" id="check"><div className="wrap">
      <p className="eyebrow">Проверьте себя</p>
      <h2>Не знаете, что просить? Это нормально</h2>
      <BorderBeamPanel {...BEAM} radius={R} seed={13} className="qbox p-0 w-auto border-0 bg-transparent">
        <p className="claim" style={{ marginBottom: 0 }}>Клиенты редко знают, что заказывать. Зато точно знают, что бесит.
          Если хоть один вопрос колет - это и есть проект.</p>
        <ul className="qs">
          <li><b>?</b>Какой отчёт дольше всего собирается каждый месяц и кто его собирает?</li>
          <li><b>?</b>Какие решения принимаются с опозданием, потому что цифры приходят поздно?</li>
          <li><b>?</b>Где одни и те же данные вбиваются в две разные системы?</li>
          <li><b>?</b>От чего вы отказались в прошлом году, потому что не хватало трёх человек?</li>
          <li><b>?</b>Что клиенты спрашивают по телефону, хотя могли бы посмотреть сами?</li>
          <li><b>?</b>Где вы теряете заказы: на запросе, на счёте или после отгрузки?</li>
          <li><b>?</b>Что ломается, когда один конкретный сотрудник уходит в отпуск?</li>
          <li><b>?</b>На что команда жалуется так давно, что вы перестали это слышать?</li>
        </ul>
      </BorderBeamPanel>
    </div></section>
  )
}
